import {redis} from "@/lib/redis";
import {userHasReadAccessToOrganization} from "@/lib/db/user";
import {RealtimeEvent} from "@/types/realtime-event";
import {db} from "@/lib/db"
import {TriggerWithProcessData} from "@/types/trigger-process";

export const addEvent = async (event: RealtimeEvent, organizationId: string) => {
  await redis.set(`event:${event.id}`, JSON.stringify(event))

  await redis.lpush(`organization:${organizationId}:event`, event.id);
  await redis.lpush('event', event.id);

  await redis.publish(`organization:${organizationId}:event`, event.id);
}

export const getEvent = async (eventId: string): Promise<RealtimeEvent> => {
  const data = await redis.get(`event:${eventId}`)
  return data ? JSON.parse(data) : undefined
}

export const getEventsByOrganizationId = async (organizationId: string, userId: string): Promise<RealtimeEvent[]> => {
  const hasAccess = await userHasReadAccessToOrganization(organizationId, userId)

  if (!hasAccess) {
    return []
  }

  const data = await redis.lrange(`organization:${organizationId}:event`, 0, 99)

  return await Promise.all(data.map(i => getEvent(i)))
}

export const getEventProcessAndLogById = async (eventId: string): Promise<TriggerWithProcessData[]> => {
  const keysProcess = await redis.keys(`event:${eventId}:trigger:*:process`)
  const keysLogs = await redis.keys(`event:${eventId}:trigger:*:log`)

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
    const [, , , triggerId] = key.split(':')
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
        const [, , , triggerId] = log.key.split(':')
        return triggerId === trigger.id
      })
      .map((log) => log.value)
      .flat()

    const process = dataProcess
      .find((log) => {
        const [, , , triggerId] = log.key.split(':')
        return triggerId === trigger.id
      })

    return {
      trigger,
      process: process?.value,
      logs
    }
  })
}