import {nc, prisma} from "@/lib/singleton";;

export async function getSessionsForOrganizationId(organizationId: string) {
  return prisma.moduleSession.findMany({
    select: {
      id: true,
      lastMessage: true,
      subs: true,
      module: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    },
    where: {
      module: {
        organizationId: organizationId
      }
    }
  });
}