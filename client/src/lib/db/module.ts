import {db} from "@/lib/db";

export async function getModuleByUserIdAndOrganizationId(organizationId: string, userId: string, moduleId: string) {
  return db.module.findFirst({
    select: {
      id: true,
      organizationId: true,
      code: true,
      name: true,
      params: {
        select: {
          id: true,
          key: true,
          value: true,
        }
      }
    },
    where: {
      id: moduleId,
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

export async function getModulesByUserIdAndOrganizationId(organizationId: string, userId: string) {
  return db.module.findMany({
    select: {
      id: true,
      organizationId: true,
      code: true,
      name: true,
      params: {
        select: {
          id: true,
          key: true,
          value: true,
        }
      }
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
}