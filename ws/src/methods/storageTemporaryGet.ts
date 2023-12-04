import {JSONRPCErrorException, SimpleJSONRPCMethod} from 'json-rpc-2.0'

import {storageGetSchema} from '../schema'
import {clients} from '../sessions'
import {redis} from '../redis'

export const storageTemporaryGet: SimpleJSONRPCMethod<{ clientId: string }> = async (rawParams, {clientId}) => {
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

  const params = storageGetSchema.safeParse(rawParams)

  if (!params.success) {
    throw new JSONRPCErrorException(
      'Invalid params',
      213,
      params.error.issues
    )
  }

  const storageTemp = await redis.hget(`organization:${client.organizationId}:storage`, params.data.key)

  if (!storageTemp) {
    throw new JSONRPCErrorException(
      'Unknown key',
      214,
      "key has not value"
    )
  }

  try {
    return JSON.parse(storageTemp)
  } catch (e) {
    throw new JSONRPCErrorException(
      'Invalid JSON value',
      214,
      "key have an invalid JSON value"
    )
  }
}
