import { v4 as uuid } from 'uuid'
import { JSONRPCErrorException } from 'json-rpc-2.0'

import { redis } from '../redis.js'
import { eventNewSchema } from '../schema.js'
import { clients } from '../sessions.js'
import { generateModulesKey } from '../utils.js'

export const eventNew = async (rawParams, { clientId }) => {
  const client = clients.get(clientId)

  const keyExist = await redis.hexists(generateModulesKey(client.organizationId), clientId)

  if (!keyExist) {
    return new JSONRPCErrorException(
      'Module not connected',
      12,
      'Module not connected'
    )
  }

  const params = eventNewSchema.safeParse(rawParams)

  if (!params.success) {
    throw new JSONRPCErrorException(
      'Invalid params',
      213,
      params.error.issues
    )
  }

  const { organizationId, code, name } = clients.get(clientId)

  const event = {
    id: uuid(),
    emitter_code: code,
    emitter_name: name,
    emitted_at: new Date().toISOString(),
    organizationId,
    name: params.data.name,
    payload: params.data.payload
  }

  await redis.set(`event:${event.id}`, JSON.stringify(event))

  await redis.lpush(`organization:${organizationId}:event`, event.id)
  await redis.lpush('event', event.id)

  await redis.publish(`organization:${organizationId}:event`, event.id)

  return event
}
