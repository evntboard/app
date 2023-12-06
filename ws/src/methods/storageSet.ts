import {JSONRPCErrorException, SimpleJSONRPCMethod} from 'json-rpc-2.0'

import {storageSetSchema} from '../schema'
import {prisma} from '../prisma'
import {clients} from '../sessions'
import {redis} from '../redis'

export const storageSet: SimpleJSONRPCMethod<{ clientId: string }> = async (rawParams, {clientId}) => {
  if (!clients.has(clientId)) {
    return new JSONRPCErrorException(
      'Unknown client',
      213,
      "Unknown client"
    )
  }

  const client = clients.get(clientId)

  if (!client || !client.organizationId || !client.code || !client.name) {
    return new JSONRPCErrorException(
      'Unknown client',
      213,
      "Unknown client"
    )
  }

  const params = storageSetSchema.safeParse(rawParams)

  if (!params.success) {
    throw new JSONRPCErrorException(
      'Invalid params',
      213,
      params.error.issues
    )
  }

  if (params.data.key.startsWith('tmp:')) {
    await redis.hset(`organization:${client.organizationId}:storage`, params.data.key, JSON.stringify(params.data.value))
    const data = await redis.hget(`organization:${client.organizationId}:storage`, params.data.key)

    const parsedData = JSON.parse(data ?? "")

    redis.publish(`organization:${client.organizationId}:storage`, JSON.stringify({
      key: params.data.key,
      value: parsedData
    }))

    return
  } else {
    const entity = await prisma.storage.upsert({
      where: {
        key_organizationId: {
          key: params.data.key,
          organizationId: client.organizationId,
        }
      },
      update: {
        value: params.data.value,
        organizationId: client.organizationId,
      },
      create: {
        key: params.data.key,
        value: params.data.value,
        organizationId: client.organizationId,
      },
    })

    redis.publish(`organization:${client.organizationId}:storage`, JSON.stringify({
      key: params.data.key,
      value: entity.value
    }))

    return entity.value
  }
}
