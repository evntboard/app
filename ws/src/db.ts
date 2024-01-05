import {prisma} from "./prisma";

export const getSessionById = async (clientId: string) => {
  return prisma.moduleSession.findFirst({
    select: {
      id: true,
      module: {
        select: {
          id: true,
          params: true,
          name: true,
          code: true,
          organizationId: true,
        }
      },
      subs: true,
      lastMessage: true,
    },
    where: {
      id: clientId
    }
  });
}