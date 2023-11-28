import {db} from "@/lib/db";

export async function getSharedByIdAndOrganization(organizationId: string, userId: string, scriptId: string) {
  return db.shared.findFirst({
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