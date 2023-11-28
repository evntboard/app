import {db} from "@/lib/db";
import {userHasReadAccessToOrganization} from "@/lib/db/user";
import {redis} from "@/lib/redis";

export async function getStorageByUserIdAndOrganizationIdAndKey(organizationId: string, userId: string, storageKey: string) {
  const hasAccess = await userHasReadAccessToOrganization(organizationId, userId)

  if (!hasAccess) {
    return Promise.reject("no access")
  }

  const persistent = await db.storage.findFirst({
    select: {
      key: true,
      value: true
    },
    where: {
      key: storageKey,
      organizationId,
      organization: {
        OR: [
          {
            creatorId: userId,
          },
          {
            users: {
              some: {
                userId
              }
            }
          }
        ]
      }
    }
  })

  if (persistent) {
    return {
      type: "PERSISTENT",
      key: persistent.key,
      value: persistent.value
    }
  }

  const data = await redis.hget(`organization:${organizationId}:storage`, storageKey)

  if (data) {
    return ({
      type: "TEMPORARY",
      key: storageKey,
      value: JSON.parse(data ?? "")
    })
  }

  return null
}

export async function getStorageByUserIdAndOrganizationId(organizationId: string, userId: string, storageId: string) {
  return db.storage.findFirst({
    where: {
      id: storageId,
      organizationId,
      organization: {
        OR: [
          {
            creatorId: userId,
          },
          {
            users: {
              some: {
                userId
              }
            }
          }
        ]
      }
    }
  })
}

export async function getStoragesByUserIdAndOrganizationId(organizationId: string, userId: string) {
  const hasAccess = await userHasReadAccessToOrganization(organizationId, userId)

  if (!hasAccess) {
    return Promise.reject("no access")
  }

  const persistent = await db.storage.findMany({
    select: {
      key: true,
      value: true
    },
    where: {
      organizationId,
      organization: {
        OR: [
          {
            creatorId: userId,
          },
          {
            users: {
              some: {
                userId
              }
            }
          }
        ]
      }
    }
  })


  const data = await redis.hgetall(`organization:${organizationId}:storage`)

  const temporary = Object.entries(data).map(([key, value]) => ({key, value: JSON.parse(value)}))

  return [
    ...persistent.map((p) => ({...p, type: "PERSISTENT"})),
    ...temporary.map((p) => ({...p, type: "TEMPORARY"})),
  ]
}