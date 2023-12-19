import {JSONRPCErrorException, SimpleJSONRPCMethod} from 'json-rpc-2.0'

import {storageGetSchema} from '../schema'
import {clients} from '../sessions'
import {redis} from '../redis'
import {prisma} from "../prisma";
import {gKeyOrgaStorage} from "../helper";

export const storageGet: SimpleJSONRPCMethod<{ clientId: string }> = async (rawParams, {clientId}) => {
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

  if (params.success === false) {
    throw new JSONRPCErrorException(
      'Invalid params',
      213,
      params.error.issues
    )
  }

  if (params.data.key.startsWith('tmp:')) {
    const storageTemp = await redis.hget(gKeyOrgaStorage(client.organizationId), params.data.key)

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
  } else {
    // verify if key don't exist on storage DB
    const storagePersist = await prisma.storage.findFirst({
      select: {
        value: true
      },
      where: {
        key: params.data.key,
        organizationId: client.organizationId,
      },
    })

    if (!storagePersist) {
      throw new JSONRPCErrorException(
        'Unknown key',
        214,
        "key has not value"
      )
    }

    return storagePersist.value
  }
}
