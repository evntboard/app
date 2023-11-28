import {db} from "@/lib/db";

export const userHasReadAccessToOrganization = async (organizationId: string, userId: string) => {
  const countExtra = await db.organization.count({
    where: {
      id: organizationId,
      OR: [
        {
          creatorId: userId
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
  })

  return countExtra > 0
}

export const userHasWriteAccessToOrganization = async (organizationId: string, userId: string): Promise<boolean> => {
  const isCreator = await db.organization.count({
    where: {
      id: organizationId,
      creatorId: userId
    }
  });

  if (isCreator > 0) {
    return true
  }

  const userOrganization = await db.usersOrganizations.findFirst({
    where: {
      userId: userId,
      organizationId: organizationId
    }
  });

  if (userOrganization) {
    return !userOrganization.readOnly;
  }

  return false
}