import {redis} from "@/lib/redis";
import {userHasReadAccessToOrganization} from "@/lib/db/user";
import {db} from "@/lib/db"
import {
  DATA_EVENTS,
  gChOrgaEvents,
  gKeyOrgaEvent,
  gKeyOrgaEventTriggerLog,
  gKeyOrgaEventTriggerProcess
} from "@/lib/helper";

import {RealtimeEvent} from "@/types/realtime-event";
import {TriggerWithProcessData} from "@/types/trigger-process";
import {jsonParse} from "@/lib/utils";

export const addEvent = async (event: RealtimeEvent, organizationId: string) => {

  const eventKey = gKeyOrgaEvent(organizationId, event.id)

  await redis.hset(
    eventKey,
    {
      id: event.id,
      name: event.name,
      payload: JSON.stringify(event.payload),
      emitter_code: event.emitter_code,
      emitter_name: event.emitter_name,
      emitted_at: event.emitted_at,
    }
  )

  await redis.lpush(DATA_EVENTS, eventKey);

  await redis.publish(gChOrgaEvents(organizationId), eventKey);
}

export const getEvent = async (eventKey: string): Promise<RealtimeEvent> => {
  const data = await redis.hgetall(eventKey)

  return {
    id: data.id,
    name: data.name,
    payload: jsonParse(data?.payload ?? ""),
    emitter_name: data.emitter_name,
    emitter_code: data.emitter_code,
    emitted_at: data.emitted_at,
  }
}

export const getEventById = async (organizationId: string, eventId: string): Promise<RealtimeEvent> => {
  const data = await redis.hgetall(gKeyOrgaEvent(organizationId, eventId))

  return {
    id: data.id,
    name: data.name,
    payload: jsonParse(data?.payload ?? ""),
    emitter_name: data.emitter_name,
    emitter_code: data.emitter_code,
    emitted_at: data.emitted_at,
  }
}

export const getEventsByOrganizationId = async (organizationId: string, userId: string): Promise<RealtimeEvent[]> => {
  const hasAccess = await userHasReadAccessToOrganization(organizationId, userId)

  if (!hasAccess) {
    return []
  }

  const keys = await redis.keys(gKeyOrgaEvent(organizationId, '*'))

  return await Promise.all(
    keys
      .filter((k) => k.split(':').length === 4)
      .map(i => getEvent(i))
  )
}

export const getEventProcessAndLogById = async (organizationId: string, eventId: string): Promise<TriggerWithProcessData[]> => {
  const keysProcess = await redis.keys(gKeyOrgaEventTriggerProcess(organizationId, eventId, '*'))
  const keysLogs = await redis.keys(gKeyOrgaEventTriggerLog(organizationId, eventId, '*'))

  const dataProcess = await Promise.all(
    keysProcess.map(async (key) => {
      const value = await redis.hgetall(key)
      return {
        key,
        value
      }
    })
  )

  const dataLogs = await Promise.all(
    keysLogs.map(async (key) => {
      const value = await redis.lrange(key, 0, -1)
      return {
        key,
        value
      }
    })
  )

  const triggersId = Array.from(new Set([...keysProcess, ...keysLogs])).map(key => {
    const [, , , , , triggerId] = key.split(':')
    return triggerId
  })

  const triggers = await db.trigger.findMany({
    select: {
      id: true,
      name: true,
    },
    where: {
      id: {in: triggersId}
    }
  })

  return triggers.map((trigger) => {
    const logs = dataLogs
      .filter((log) => {
        const [, , , , , triggerId] = log.key.split(':')
        return triggerId === trigger.id
      })
      .map((log) => log.value)
      .flat()

    const process = dataProcess
      .find((log) => {
        const [, , , , , triggerId] = log.key.split(':')
        return triggerId === trigger.id
      })

    return {
      trigger,
      process: process?.value,
      logs
    }
  })
}