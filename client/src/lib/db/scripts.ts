import {db} from "@/lib/db";

export async function getScriptsForUserIdAndOrganizationId(userId: string, organizationId: string) {
  return await Promise.all([
    db.trigger.findMany({
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
    db.shared.findMany({
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