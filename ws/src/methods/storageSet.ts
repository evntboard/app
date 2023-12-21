import {JSONRPCErrorException, SimpleJSONRPCMethod} from 'json-rpc-2.0'

import {storageSetSchema} from '../schema'
import {prisma} from '../prisma'
import {clients} from '../sessions'
import {gChOrgaStorage} from "../helper";
import {getSessionById} from "../db";
import {nc} from "../nats";

export const storageSet: SimpleJSONRPCMethod<{ clientId: string }> = async (rawParams, {clientId}) => {
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

  const params = storageSetSchema.safeParse(rawParams)

  if (params.success === false) {
    throw new JSONRPCErrorException(
      'Invalid params',
      213,
      params.error.issues
    )
  }

  const entity = await prisma.storage.upsert({
    where: {
      key_organizationId: {
        key: params.data.key,
        organizationId: session.module.organizationId,
      }
    },
    update: {
      value: params.data.value,
    },
    create: {
      key: params.data.key,
      value: params.data.value,
      organizationId: session.module.organizationId,
    },
  })

  nc?.publish(gChOrgaStorage(session.module.organizationId), params.data.key)

  return entity.value
}
