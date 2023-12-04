import {JSONRPCErrorException, SimpleJSONRPCMethod} from 'json-rpc-2.0'

import {prisma} from '../prisma'
import {redis, redisSub} from '../redis'
import {sessionRegisterSchema} from '../schema'
import {clients} from '../sessions'
import {
  generateModuleKeyChannel,
  generateModuleKeyChannelEject,
  generateModulesKey,
  generatePersistentStorageKey,
  generateTemporaryStorageKey
} from '../utils'

export const sessionRegister: SimpleJSONRPCMethod<{ clientId: string }> = async (rawParams, {clientId}) => {
  if (!clients.has(clientId)) {
    return new JSONRPCErrorException(
      'Unknown client',
      213,
      "Unknown client"
    )
  }

  const client = clients.get(clientId)

  if (!client) {
    return new JSONRPCErrorException(
      'Unknown client',
      213,
      "Unknown client"
    )
  }

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

  // there is always only ONE module with code:name for an orga
  const anotherConnected = Object.entries(modules).find(([_, moduleName]) => moduleName === `${params.data.code}:${params.data.name}`)

  if (anotherConnected) {
    throw new JSONRPCErrorException(
      'Already connected',
      12,
      'Already connected'
    )
  }

  console.log(`REGISTER MODULE ${params.data.code}:${params.data.name}`)

  clients.set(clientId, {
    ...client,
    code: params.data.code,
    name: params.data.name,
    organizationId: module.organizationId,
    subs: params.data.subs ?? []
  })

  await redis.hset(modulesKey, clientId, `${params.data.code}:${params.data.name}`)

  redisSub.subscribe(generateModuleKeyChannel(module.organizationId, clientId))
  redisSub.subscribe(generatePersistentStorageKey(module.organizationId))
  redisSub.subscribe(generateTemporaryStorageKey(module.organizationId))
  redisSub.subscribe(generateModuleKeyChannel(module.organizationId, clientId))
  redisSub.subscribe(generateModuleKeyChannelEject(module.organizationId, clientId))

  return module.params
}
