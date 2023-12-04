import {JSONRPCErrorException, SimpleJSONRPCMethod} from 'json-rpc-2.0'

import {storageGetSchema} from '../schema'
import {prisma} from '../prisma'
import {clients} from '../sessions'

export const storagePersistentGet: SimpleJSONRPCMethod<{ clientId: string }> = async (rawParams, {clientId}) => {
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
