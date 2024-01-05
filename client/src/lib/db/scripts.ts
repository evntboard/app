import {nc, prisma} from "@/lib/singleton";;

export async function getScriptsForUserIdAndOrganizationId(userId: string, organizationId: string) {
  return await Promise.all([
    prisma.trigger.findMany({
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
      },
    }),
    prisma.shared.findMany({
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
        },
      }
    )
  ])
}