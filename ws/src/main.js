import 'dotenv/config'
import { WebSocketServer } from 'ws'
import { v4 as uuid } from 'uuid'
import {
  isJSONRPCRequest,
  isJSONRPCRequests,
  isJSONRPCResponse,
  isJSONRPCResponses,
  JSONRPCClient,
  JSONRPCServer
} from 'json-rpc-2.0'

import { eventNew } from './methods/eventNew.js'
import { sessionRegister } from './methods/sessionRegister.js'
import { storageGet } from './methods/storageGet.js'
import { storageSet } from './methods/storageSet.js'

import { redis, redisSub } from './redis.js'
import { clients } from './sessions.js'
import { generateModuleKeyChannel, generateModulesKey } from './utils.js'
import { APP_PORT } from './constant.js'

const server = new JSONRPCServer()

server.addMethod('session.register', sessionRegister)
server.addMethod('event.new', eventNew)
server.addMethod('storage.set', storageSet)
server.addMethod('storage.get', storageGet)

const wss = new WebSocketServer({ port: APP_PORT, path: '/module' })

wss.on('connection', async (ws) => {
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
      ws,
      rpc: client,
      moduleId: null
    }
  )

  setTimeout(async () => {
    const client = clients.get(clientId)

    if (!client.organizationId) {
      ws.close()
    }

    const value = await redis.hget(generateModulesKey(client.organizationId), clientId)
    if (!value) {
      ws.close()
    }
  }, 10_000)

  ws.on('close', async () => {
    if (clients.has(clientId)) {
      const client = clients.get(clientId)
      await redis.hdel(generateModulesKey(client.organizationId), clientId)
      redisSub.unsubscribe(generateModuleKeyChannel(client.organizationId, clientId))
    }
  })

  ws.on('error', console.error)

  ws.on('message', async (data) => {
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
      const response = await server.receive(payload, { clientId })
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
  // `organization:${organizationId}:module:${clientId}`
  const [, , type, clientId] = channel.split(':')

  switch (type) {
    case 'storage': {
      const message = JSON.parse(raw)

      const clientsObj = Object.fromEntries(clients.entries())

      for (let clientId in clientsObj) {
        if (clientsObj.hasOwnProperty(clientId)) {
          clientsObj[clientId]?.rpc?.notify?.('storage.sync', message)
        }
      }
      break
    }
    case 'module': {
      if (clients.has(clientId)) {
        const client = clients.get(clientId)
        const message = JSON.parse(raw)
        if (message.notification) {
          try {
            client?.rpc?.notify?.(message?.method, message?.params)
            redis.publish(message?.channel, JSON.stringify(null))
          } catch (e) {
            redis.publish(message?.channel, JSON.stringify({
              error: e.message
            }))
          }
        } else {
          try {
            const result = await client
              ?.rpc
              ?.timeout(2_000)
              ?.request?.(message?.method, message?.params)
            if (message?.method === 'healthcheck' && result !== true) {
              await redis.hdel(generateModulesKey(client.organizationId), clientId)
              redisSub.unsubscribe(generateModuleKeyChannel(client.organizationId, clientId))
              client?.ws?.close()
            }

            redis.publish(message?.channel, JSON.stringify({
              result
            }))
          } catch (e) {
            if (message?.method === 'healthcheck') {
              await redis.hdel(generateModulesKey(client.organizationId), clientId)
              redisSub.unsubscribe(generateModuleKeyChannel(client.organizationId, clientId))
              client?.ws?.close()
            }

            redis.publish(message?.channel, JSON.stringify({
              error: e.message
            }))
          }
        }
      }
      break
    }
  }
})
