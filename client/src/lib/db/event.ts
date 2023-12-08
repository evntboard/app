import {db} from "@/lib/db";

export async function getEventsByIdAndOrganization(organizationId: string, userId: string) {
  return db.event.findMany({
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
  return db.event.findFirst({
    select: {
      id: true,
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