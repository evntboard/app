import {JSONRPCErrorException, SimpleJSONRPCMethod} from 'json-rpc-2.0'

import {eventNewSchema} from '../schema'
import {clients} from '../sessions'
import {DATA_EVENTS, gChOrgaEvents} from "../helper";
import {prisma} from "../prisma";
import {getSessionById} from "../db";
import {nc} from "../nats";

export const eventNew: SimpleJSONRPCMethod<{ clientId: string }> = async (rawParams, {clientId}) => {
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

  const params = eventNewSchema.safeParse(rawParams)

  if (params.success === false) {
    throw new JSONRPCErrorException(
      'Invalid params',
      213,
      params.error.issues
    )
  }

  const event = await prisma.event.create({
    select: {
      id: true,
      name: true,
      payload: true,
      emitterCode: true,
      emitterName: true,
      emittedAt: true,
    },
    data: {
      name: params.data.name,
      payload: params.data.payload,
      emitterCode: session.module.code,
      emitterName: session.module.name,
      emittedAt: new Date(),
      organizationId: session.module.organizationId
    }
  })

  nc?.publish(DATA_EVENTS, event.id)
  nc?.publish(gChOrgaEvents(session.module.organizationId), event.id)

  return event
}
