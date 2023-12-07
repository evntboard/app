import {db} from "@/lib/db";
import {userHasReadAccessToOrganization} from "@/lib/db/user";
import {redis} from "@/lib/redis";
import {gKeyOrgaStorage} from "@/lib/helper";
import {jsonParse} from "@/lib/utils";

export async function getStorageByUserIdAndOrganizationIdAndKey(organizationId: string, userId: string, storageKey: string) {
  const hasAccess = await userHasReadAccessToOrganization(organizationId, userId)

  if (!hasAccess) {
    return Promise.reject("no access")
  }

  if (storageKey.startsWith('tmp:')) {
    const data = await redis.hget(gKeyOrgaStorage(organizationId), storageKey)

    if (!data) {
      return null
    }

    return ({
      key: storageKey,
      value: jsonParse(data ?? "")
    })
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

  if (!persistent) {
    return null
  }

  return {
    key: persistent.key,
    value: persistent.value
  }
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


  const data = await redis.hgetall(gKeyOrgaStorage(organizationId))

  const temporary = Object.entries(data).map(([key, value]) => ({key, value: jsonParse(value ?? "")}))

  return [...persistent, ...temporary]
}