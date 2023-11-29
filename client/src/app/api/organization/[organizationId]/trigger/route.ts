import {getServerSession} from "next-auth/next"
import {NextRequest, NextResponse} from "next/server";
import * as z from "zod"

import {authOptions} from "@/lib/auth"
import {db} from "@/lib/db"
import {userHasReadAccessToOrganization, userHasWriteAccessToOrganization} from "@/lib/db/user";
import {triggerSchema} from "@/lib/validations/trigger";
import {Condition} from "@prisma/client";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
  }),
})

export async function GET(req: NextRequest, context: z.infer<typeof routeContextSchema>) {
  try {
    const {params} = routeContextSchema.parse(context)

    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401})
    }

    const hasAccess = await userHasReadAccessToOrganization(params.organizationId, session.user.id)

    if (!hasAccess) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 403})
    }

    const entities = await db.trigger.findMany({
      select: {
        id: true,
        name: true,
        enable: true,
        channel: true,
        code: true,
        conditions: {
          select: {
            id: true,
            name: true,
            enable: true,
            code: true,
            type: true,
            timeout: true,
          }
        }
      },
      where: {
        organizationId: params.organizationId
      },
    })

    return NextResponse.json(entities)
  } catch (error) {
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}

export async function POST(req: Request, context: z.infer<typeof routeContextSchema>) {
  try {
    const {params} = routeContextSchema.parse(context)

    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401})
    }

    const hasAccess = await userHasWriteAccessToOrganization(params.organizationId, session.user.id)

    if (!hasAccess) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 403})
    }

    // TODO CHECK SUBSCRIPTION PLAN

    const json = await req.json()
    const body = triggerSchema.parse(json)

    const entity = await db.trigger.create({
      select: {
        id: true,
        name: true,
        enable: true,
        channel: true,
        code: true,
        conditions: {
          select: {
            id: true,
            name: true,
            enable: true,
            code: true,
            type: true,
            timeout: true,
          },
        },
      },
      data: {
        name: body.name,
        code: body.code,
        channel: body.channel,
        enable: false,
        organizationId: params.organizationId,
        conditions: {
          createMany: {
            data:  (body.conditions as Condition[]).map((condition) => ({
              name: condition.name,
              enable: condition.enable,
              code: condition.code,
              type: condition.type,
              timeout: condition.timeout,
            })),
          },
        },
      },
    })

    return NextResponse.json(entity)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), {status: 422})
    }

    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}