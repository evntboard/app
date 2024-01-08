import * as z from "zod"

import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth/next";
import {nc, prisma} from "@/lib/singleton";
import authOptions from "@/lib/auth.config";
import {userHasReadAccessToOrganization, userHasWriteAccessToOrganization} from "@/lib/db/user";
import {userIdSchema} from "@/lib/validations/user";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
  }),
})

export async function GET(req: NextRequest, context: z.infer<typeof routeContextSchema>) {
  try {
    const {params} = routeContextSchema.parse(context)

    const session = await auth()

    if (!session) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401})
    }

    const hasAccess = await userHasReadAccessToOrganization(params.organizationId, session.user.id)

    if (!hasAccess) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 403})
    }


    const search = req.nextUrl.searchParams.get('search') ?? ''

    if (search.length < 3) {
      return NextResponse.json({error: 'searchParams "search" have to be at least 3 length'}, {status: 422})
    }

    const entities = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true
      },
      where: {
        name: {
          contains: search,
          mode: 'insensitive',
        },
        NOT: {
          OR: [
            {
              organizations: {
                some: {
                  organizationId: params.organizationId,
                },
              },
            },
            {
              myOrganizations: {
                some: {
                  creatorId: session.user.id
                }
              }
            }
          ],
        },
      },
    });

    return NextResponse.json(entities)
  } catch (error) {
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}

export async function POST(req: NextRequest, context: z.infer<typeof routeContextSchema>) {
  try {
    const {params} = routeContextSchema.parse(context)

    const session = await auth()

    if (!session) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401})
    }

    const hasAccess = await userHasWriteAccessToOrganization(params.organizationId, session.user.id)

    if (!hasAccess) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 403})
    }

    const json = await req.json()
    const body = userIdSchema.parse(json)

    await prisma.usersOrganizations.create({
      data: {
        organizationId: params.organizationId,
        userId: body.userId,
        readOnly: true,
        assignedBy: session.user.id
      }
    });

    return NextResponse.json([])
  } catch (error) {
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}
