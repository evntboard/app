import 'dotenv/config'
import {WebSocket, WebSocketServer} from 'ws'
import {v4 as uuid} from 'uuid'
import {
  isJSONRPCRequest,
  isJSONRPCRequests,
  isJSONRPCResponse,
  isJSONRPCResponses,
  JSONRPCClient,
  JSONRPCServer
} from 'json-rpc-2.0'

import {eventNew} from './methods/eventNew'
import {sessionRegister} from './methods/sessionRegister'
import {storageGet} from './methods/storageGet'
import {storageSet} from './methods/storageSet'

import {redis, redisSub} from './redis'
import {clients} from './sessions'
import {APP_PORT} from './constant'
import {gChOrgaModule, gChOrgaModuleEject, gChOrgaStorage, gKeyOrgaModules} from "./helper";

const server = new JSONRPCServer<{ clientId: string }>()

server.addMethod('session.register', sessionRegister)
server.addMethod('event.new', eventNew)
server.addMethod('storage.set', storageSet)
server.addMethod('storage.get', storageGet)

const wss = new WebSocketServer({port: APP_PORT, path: '/module'})

wss.on('connection', async (ws: WebSocket) => {
  const clientId = uuid()

  const client = new JSONRPCClient(
    async (payload) => {
      ws.send(JSON.stringify(payload))
      return Promise.resolve()
    },
    uuid
  )

  clients.set(
    clientId,
    {
      subs: [],
      ws,
      rpc: client,
      organizationId: undefined,
      name: undefined,
      code: undefined,
    }
  )

  setTimeout(async () => {
    if (clients.has(clientId)) {
      const client = clients.get(clientId)

      if (!client || !client.organizationId) {
        ws.close()
        return
      }

      const value = await redis.hget(gKeyOrgaModules(client.organizationId), clientId)
      if (!value) {
        ws.close()
      }
    }
  }, 10_000)

  ws.on('close', async () => {
    if (clients.has(clientId)) {
      const client = clients.get(clientId)

      if (!client || !client.organizationId) {
        ws.close()
        return
      }

      await redis.hdel(gKeyOrgaModules(client.organizationId), clientId)

      redisSub.unsubscribe(gChOrgaModule(client.organizationId, clientId))
      redisSub.unsubscribe(gChOrgaStorage(client.organizationId))
      redisSub.unsubscribe(gChOrgaModuleEject(client.organizationId, clientId))
    }
  })

  ws.on('error', console.error)

  ws.on('message', async (data: Buffer) => {
    let payload
    try {
      payload = JSON.parse(data.toString())
    } catch (e) {
      console.error('Received an mal formatted JSON-RPC message')
      return
    }

    // is a response
    if (isJSONRPCResponse(payload) || isJSONRPCResponses(payload)) {
      return client.receive(payload)
    }

    // is a request
    if (isJSONRPCRequest(payload) || isJSONRPCRequests(payload)) {
      const response = await server.receive(payload, {clientId})
      if (response != null) {
        return await client.send(response)
      }
      return
    }

    console.error('Received an invalid JSON-RPC message')
  })
})

// global listener on pub sub !
redisSub.on('message', async (channel, raw) => {
  console.log(channel, raw)
  // `ch:organization:${organizationId}:XXXX`
  // [ "ch","organization", organizationId, type
  const [, , organizationId, type, ...rest] = channel.split(':')

  switch (type) {
    // `ch:oorganization:${organizationId}:storage`
    // persistent || temporary
    case 'storage': {
      const message: { key: string, value: string } = JSON.parse(raw)

      const clientsObj = Object.fromEntries(clients.entries())

      for (let clientId in clientsObj) {
        if (
          clientsObj.hasOwnProperty(clientId) &&
          clientsObj[clientId]?.organizationId === organizationId &&
          clientsObj[clientId]?.subs.includes(message.key)
        ) {
          clientsObj[clientId]?.rpc?.notify?.(`storage.sync`, message)
        }
      }
      break
    }
    // `ch:organization:${organizationId}:module:${clientId}`
    case 'module': {
      const [clientId] = rest
      if (clients.has(clientId)) {
        const client = clients.get(clientId)
        const message: { notification: boolean, channel: string, method: string, params: any } = JSON.parse(raw)
        if (message.notification) {
          try {
            client?.rpc?.notify?.(message?.method, message?.params)
            redis.publish(message?.channel, JSON.stringify({
              result: null
            }))
          } catch (e: unknown) {
            if (e instanceof Error) {
              redis.publish(message?.channel, JSON.stringify({
                error: e.message
              }))
            }
          }
        } else {
          try {
            const result = await client
              ?.rpc
              ?.timeout(2_000)
              ?.request?.(message?.method, message?.params)

            console.log(message, result)

            redis.publish(message?.channel, JSON.stringify({
              result
            }))
          } catch (e: unknown) {
            if (e instanceof Error) {
              redis.publish(message?.channel, JSON.stringify({
                error: e.message
              }))
            }
          }
        }
      }
      break
    }
    // `ch:organization:${organizationId}:module-eject:${clientId}`
    case 'module-eject': {
      const [clientId] = rest
      if (clients.has(clientId)) {
        const client = clients.get(clientId)

        if (!client || !client.ws) {
          return
        }

        client.ws?.close()
      }
      break
    }
  }
})
