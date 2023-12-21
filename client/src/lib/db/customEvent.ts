import {nc, prisma} from "@/lib/singleton";;

export async function getEventsByIdAndOrganization(organizationId: string, userId: string) {
  return prisma.customEvent.findMany({
    select: {
      id: true,
      payload: true,
      name: true,
      description: true,
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

export async function getEventByIdAndOrganization(organizationId: string, userId: string, eventId: string) {
  return prisma.customEvent.findFirst({
    select: {
      id: true,
      description: true,
      payload: true,
      name: true,
    },
    where: {
      id: eventId,
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