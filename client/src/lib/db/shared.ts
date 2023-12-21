import {nc, prisma} from "@/lib/singleton";;

export async function getSharedByIdAndOrganization(organizationId: string, userId: string, scriptId: string) {
  return prisma.shared.findFirst({
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