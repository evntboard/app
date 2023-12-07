import {v4 as uuid} from 'uuid'
import {JSONRPCErrorException, SimpleJSONRPCMethod} from 'json-rpc-2.0'

import {redis} from '../redis'
import {eventNewSchema} from '../schema'
import {clients} from '../sessions'
import {DATA_EVENTS, gChOrgaEvents, gKeyOrgaEvent, gKeyOrgaModules} from "../helper";

export const eventNew: SimpleJSONRPCMethod<{ clientId: string }> = async (rawParams, {clientId}) => {
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

  const keyExist = await redis.hexists(gKeyOrgaModules(client.organizationId), clientId)

  if (!keyExist) {
    return new JSONRPCErrorException(
      'Module not connected',
      12,
      'Module not connected'
    )
  }

  const params = eventNewSchema.safeParse(rawParams)

  if (!params.success) {
    return new JSONRPCErrorException(
      'Invalid params',
      213,
      params.error.issues
    )
  }

  const event = {
    id: uuid(),
    emitter_code: client.code,
    emitter_name: client.name,
    emitted_at: new Date().toISOString(),
    organizationId: client.organizationId,
    name: params.data.name,
    payload: params.data.payload
  }

  const eventKey = gKeyOrgaEvent(client.organizationId, event.id)

  await redis.hset(
    eventKey,
    {
      id: event.id,
      organizationId: client.organizationId,
      name: params.data.name,
      payload: JSON.stringify(params.data.payload),
      emitter_code: client.code,
      emitter_name: client.name,
      emitted_at: new Date().toISOString(),
    }
  )

  await redis.lpush(DATA_EVENTS, eventKey);

  await redis.publish(gChOrgaEvents(client.organizationId), eventKey);

  return event
}
