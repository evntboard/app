import 'dotenv/config'
import {WebSocket, WebSocketServer} from 'ws'
import {createId} from '@paralleldrive/cuid2';
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

import {clients} from './sessions'
import {APP_PORT} from './constant'
import {prisma} from "./prisma";
import {getSessionById} from "./db";
import {initNc, nc} from "./nats";
import {gChOrgaModule, gChOrgaModuleEject, gChOrgaStorage} from "./helper";

const main = async () => {
  await initNc()

  const server = new JSONRPCServer<{ clientId: string }>()

  server.addMethod('session.register', sessionRegister)
  server.addMethod('event.new', eventNew)
  server.addMethod('storage.set', storageSet)
  server.addMethod('storage.get', storageGet)

  const wss = new WebSocketServer({port: APP_PORT, path: '/module'})

  wss.on('connection', async (ws: WebSocket) => {
    const clientId = createId()

    const client = new JSONRPCClient(
      async (payload) => {
        ws.send(JSON.stringify(payload))
        return Promise.resolve()
      },
      createId
    )

    clients.set(clientId, {ws, rpc: client})

    setTimeout(async () => {
      if (clients.has(clientId)) {
        const client = clients.get(clientId)

        const session = await getSessionById(clientId)

        if (!client || !session) {
          ws.close()
        }
      }
    }, 10_000)

    ws.on('close', async () => {
      if (clients.has(clientId)) {
        const client = clients.get(clientId)

        const session = await getSessionById(clientId)

        if (!client || !session) {
          ws.close()
          clients.delete(clientId)
          return
        }

        await prisma.moduleSession.delete({
          where: {
            id: clientId
          }
        })
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

  nc?.subscribe(
    'organization.>',
    {
      callback: async (err, msg) => {
        if (err) {
          console.log(err)
          return
        }
        const [, organizationId, type, extraId] = msg.subject.split('.')

        switch (type) {
          case 'storage': {
            const storageId = msg.string()

            const clientsObj = Object.fromEntries(clients.entries())

            const newStorageValue = await prisma.storage.findFirst({
              select: {
                key: true,
                value: true,
              },
              where: {
                organizationId: organizationId,
                key: storageId ?? ''
              }
            })

            if (!newStorageValue) {
              return
            }

            const matches = await prisma.moduleSession.findMany({
              select: {
                id: true
              },
              where: {
                module: {
                  organizationId: organizationId
                },
                subs: {
                  hasSome: [newStorageValue.key]
                }
              }
            })

            for (const session of matches) {
              if (clients.has(session.id)) {
                clientsObj[session.id]?.rpc?.notify?.(`storage.sync`, newStorageValue)
              }
            }
            break
          }
          case 'module': {
            if (!clients.has(extraId)) {
              return
            }

            const client = clients.get(extraId)

            const message: {
              notification: boolean,
              channel: string,
              method: string,
              params: any
            } = msg.json()

            if (message.notification) {
              client?.rpc?.notify?.(message?.method, message?.params)
            } else {
              try {
                const result = await client
                  ?.rpc
                  ?.timeout(2_000)
                  ?.request?.(message?.method, message?.params)

                msg.respond(JSON.stringify({result}))
              } catch (e: unknown) {
                console.log(e)
                if (e instanceof Error) {
                  msg.respond(JSON.stringify({error: e.message}))
                }
              }
            }
            break
          }
          case 'module-eject': {
            if (!clients.has(extraId)) {
              return
            }

            const client = clients.get(extraId)

            // TODO VERIFY ON DB

            if (!client || !client.ws) {
              return
            }

            client.ws?.close()
            clients.delete(extraId)
            break
          }
        }
      }
    }
  )
}

main()
  .catch((e) => {
    console.error(`There is an error ...`, e)
  })