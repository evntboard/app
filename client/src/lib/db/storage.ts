import {nc, prisma} from "@/lib/singleton";;
import {userHasReadAccessToOrganization} from "@/lib/db/user";

export async function getStorageByUserIdAndOrganizationIdAndKey(organizationId: string, userId: string, storageKey: string) {
  const hasAccess = await userHasReadAccessToOrganization(organizationId, userId)

  if (!hasAccess) {
    return Promise.reject("no access")
  }

  const persistent = await prisma.storage.findFirst({
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

  return prisma.storage.findMany({
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
  });
}