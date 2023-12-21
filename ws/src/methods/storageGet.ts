import {JSONRPCErrorException, SimpleJSONRPCMethod} from 'json-rpc-2.0'

import {storageGetSchema} from '../schema'
import {clients} from '../sessions'
import {prisma} from "../prisma";
import {getSessionById} from "../db";

export const storageGet: SimpleJSONRPCMethod<{ clientId: string }> = async (rawParams, {clientId}) => {
  if (!clients.has(clientId)) {
    throw new JSONRPCErrorException(
      'Unknown client',
      213,
      "Unknown client"
    )
  }

  const client = clients.get(clientId)

  const session = await getSessionById(clientId)

  if (!client || !session) {
    throw new JSONRPCErrorException(
      'Unknown client or not connected',
      213,
      "Unknown client or not connected"
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


  // verify if key don't exist on storage DB
  const storagePersist = await prisma.storage.findFirst({
    select: {
      value: true
    },
    where: {
      key: params.data.key,
      organizationId: session.module.organizationId,
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
