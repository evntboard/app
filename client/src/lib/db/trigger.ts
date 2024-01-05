import {nc, prisma} from "@/lib/singleton";;

export async function getTriggerByIdAndOrganization(organizationId: string, userId: string, scriptId: string) {
  return prisma.trigger.findFirst({
    select: {
      id: true,
      name: true,
      code: true,
      enable: true,
      channel: true,
      conditions: {
        select: {
          id: true,
          name: true,
          type: true,
          code: true,
          timeout: true,
          enable: true
        }
      }
    },
    where: {
      id: scriptId,
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