import { JSONRPCErrorException } from 'json-rpc-2.0'
import { v4 as uuid } from 'uuid'

import { prisma } from '../prisma.js'
import { redis, redisSub, redisSubOrga } from '../redis.js'
import { sessionRegisterSchema } from '../schema.js'
import { clients } from '../sessions.js'
import { generateModuleKeyChannel, generateModuleKeyResponseChannel, generateModulesKey } from '../utils.js'

export const sessionRegister = async (rawParams, { clientId }) => {
  const params = sessionRegisterSchema.safeParse(rawParams)

  if (!params.success) {
    throw new JSONRPCErrorException(
      'Invalid params',
      213,
      params.error.issues
    )
  }

  const module = await prisma.module.findFirst({
    select: {
      organizationId: true,
      params: {
        select: {
          key: true,
          value: true
        }
      }
    },
    where: {
      code: params.data.code,
      name: params.data.name,
      token: params.data.token
    }
  })

  if (!module) {
    throw new JSONRPCErrorException(
      'Unknown Module',
      12,
      'Unknown Module'
    )
  }

  const modulesKey = generateModulesKey(module.organizationId)

  const keyExist = await redis.hexists(modulesKey, clientId)

  if (keyExist) {
    throw new JSONRPCErrorException(
      'Module already connected',
      12,
      'Module already connected'
    )
  }

  const modules = await redis.hgetall(modulesKey)

  // there is always ONE module with code:name for an orga
  const anotherConnected = Object.entries(modules).find(([_, moduleName]) => moduleName === `${params.data.code}:${params.data.name}`)

  if (anotherConnected) {
    const channel = generateModuleKeyChannel(module.organizationId, anotherConnected[0])

    // verify if module is really connected !
    const isReallyConnected = await new Promise((resolve) => {
      const requestId = uuid()
      const channelResponse = generateModuleKeyResponseChannel(module.organizationId, anotherConnected[0], requestId)

      redisSubOrga.on('message', (c, raw) => {
        if (c === channelResponse) {
          try {
            const msg = JSON.parse(raw)
            if (msg.error) {
              resolve(false)
            } else {
              resolve(true)
            }
          } catch (e) {
            resolve(false)
          } finally {
            redisSubOrga.unsubscribe(channelResponse)
          }
        }
      })

      setTimeout(() => {
        redisSubOrga.unsubscribe(channelResponse)
        resolve(false)
      }, 5_000)

      redisSubOrga.subscribe(channelResponse)

      redis.publish(
        channel,
        JSON.stringify({
          channel: channelResponse,
          method: 'healthcheck',
          params: null
        })
      )
      return true
    })

    if (!isReallyConnected) {
      await redis.hdel(modulesKey, anotherConnected[0])
      redisSub.unsubscribe(channel)
    } else {
      throw new JSONRPCErrorException(
        'Already connected',
        12,
        'Already connected'
      )
    }
  }

  console.log(`REGISTER MODULE ${params.data.code}:${params.data.name}`)

  clients.set(clientId, {
    ...clients.get(clientId),
    code: params.data.code,
    name: params.data.name,
    organizationId: module.organizationId
  })

  await redis.hset(modulesKey, clientId, `${params.data.code}:${params.data.name}`)

  redisSub.subscribe(generateModuleKeyChannel(module.organizationId, clientId))

  return module.params
}
