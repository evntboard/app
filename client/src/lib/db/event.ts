import {nc, prisma} from "@/lib/singleton";
import {DATA_EVENTS, gChOrgaEvents} from "@/lib/helper";
import {userHasReadAccessToOrganization} from "@/lib/db/user";

type RawEvent = {
  name: string,
  payload: any,
  emittedAt: Date,
  emitterCode: string,
  emitterName: string,
  organizationId: string
}

export const addEvent = async (organizationId: string, event: RawEvent) => {
  const {id: newEventId} = await prisma.event.create({
    select: {
      id: true
    },
    data: {
      organizationId: organizationId,
      name: event.name,
      payload: event.payload,
      emitterCode: event.emitterCode,
      emitterName: event.emitterName,
      emittedAt: event.emittedAt,
    }
  });

  (await nc).publish(DATA_EVENTS, newEventId);
  (await nc).publish(gChOrgaEvents(organizationId), newEventId);
}

export const getEventsByOrganizationId = async (organizationId: string, userId: string) => {
  return prisma.event.findMany({
    select: {
      id: true,
      name: true,
      organizationId: true,
      emittedAt: true,
      emitterCode: true,
      emitterName: true,
      payload: true,
      status: true,
    },
    where: {
      organizationId,
      OR: [
        {
          organization: {
            creatorId: userId
          }
        },
        {
          organization: {
            users: {
              some: {
                userId
              }
            }
          }
        }
      ]
    },
    orderBy: {
      emittedAt: 'desc'
    },
    take: 100
  });
}

export const getEventProcessAndLogById = async (organizationId: string, userId: string, eventId: string) => {
  return await prisma.event.findFirst({
    select: {
      id: true,
      name: true,
      organizationId: true,
      emittedAt: true,
      emitterCode: true,
      emitterName: true,
      payload: true,
      processes: {
        select: {
          id: true,
          eventId: true,
          triggerId: true,
          startDate: true,
          endDate: true,
          error: true,
          executed: true,
          trigger: {
            select: {
              id: true,
              name: true,
            }
          },
          logs: {
            select: {
              log: true,
              date: true
            }
          },
          requests: {
            select: {
              module: {
                select: {
                  code: true,
                  name: true,
                }
              },
              result: true,
              method: true,
              notification: true,
              params: true,
              requestDate: true,
              responseDate: true
            }
          }
        }
      }
    },
    where: {
      id: eventId,
      organizationId,
      OR: [
        {
          organization: {
            creatorId: userId
          }
        },
        {
          organization: {
            users: {
              some: {
                userId
              }
            }
          }
        }
      ]
    }
  });
}