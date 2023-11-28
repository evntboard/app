import * as z from "zod"

import {db} from "@/lib/db";
import {organizationSchema} from "@/lib/validations/organization";

export function getOrganizationsByUserId(userId: string) {
  return db.organization.findMany({
    select: {
      id: true,
      name: true,
      creatorId: true,
      creator: {
        select: {
          id: true,
          name: true,
          image: true,
        }
      },
      users: {
        select: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          }
        }
      }
    },
    where: {
      OR: [
        {
          creatorId: null
        },
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
    },
  })
}

export function getOrganizationByUserId(userId: string, organizationId: string) {
  return db.organization.findFirst({
    select: {
      id: true,
      name: true,
      creatorId: true,
      creator: {
        select: {
          id: true,
          name: true,
          image: true,
        }
      },
      users: {
        select: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          }
        }
      }
    },
    where: {
      id: organizationId,
      OR: [
        {
          creatorId: null
        },
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
    },
  })
}

export function createOrganizationForUserId(userId: string, body: z.infer<typeof organizationSchema>) {
  return db.organization.create({
    data: {
      name: body.name,
      creatorId: userId,
    },
    select: {
      id: true,
      name: true,
      creatorId: true,
      creator: {
        select: {
          name: true,
        }
      },
      users: {
        select: {
          user: {
            select: {
              name: true,
            }
          }
        }
      }
    },
  })
}