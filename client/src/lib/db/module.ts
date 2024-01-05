import {nc, prisma} from "@/lib/singleton";;

export async function getModuleByUserIdAndOrganizationId(organizationId: string, userId: string, moduleId: string) {
  return prisma.module.findFirst({
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
  return prisma.module.findMany({
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