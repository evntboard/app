import * as z from "zod"

import {db} from "@/lib/db"
import {triggerSchema} from "@/lib/validations/trigger"
import {getServerSession} from "next-auth/next";
import {authOptions} from "@/lib/auth";
import {userHasReadAccessToOrganization, userHasWriteAccessToOrganization} from "@/lib/db/user";
import {NextRequest, NextResponse} from "next/server";
import {Condition} from "@prisma/client";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
    triggerId: z.string(),
  }),
})

export async function DELETE(
  req: NextRequest,
  context: z.infer<typeof routeContextSchema>
) {
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

    await db.trigger.deleteMany({
      where: {
        organizationId: params.organizationId,
        id: params.triggerId,
      },
    })


    return new Response(null, {status: 204})
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({error}, {status: 422})
    }

    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}

export async function PATCH(
  req: Request,
  context: z.infer<typeof routeContextSchema>
) {
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

    // Get the request body and validate it.
    const json = await req.json()
    const body = triggerSchema.parse(json)


    await db.condition.deleteMany({
      where: {
        triggerId: params.triggerId,
        NOT: {
          id: {
            in: (body.conditions as Condition[]).map((condition) => condition.id).filter((a) => !!a),
          },
        },
      },
    });


    await db.trigger.update({
      where: {
        id: params.triggerId,
        organizationId: params.organizationId
      },
      data: {
        name: body.name,
        code: body.code,
        channel: body.channel,
        enable: body.enable,
        conditions: {
          upsert: (body.conditions as Condition[]).map((condition) => ({
            where: condition.id
              ? {
                id: condition.id,
                triggerId: params.triggerId,
              }
              : {
                name_triggerId: {
                  name: condition.name,
                  triggerId: params.triggerId,
                },
              },
            update: {
              name: condition.name,
              enable: condition.enable,
              code: condition.code,
              type: condition.type,
              timeout: condition.timeout,
            },
            create: {
              name: condition.name,
              enable: condition.enable,
              code: condition.code,
              type: condition.type,
              timeout: condition.timeout,
            },
          })),
        },
      },
    });

    return NextResponse.json({}, {status: 200})
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({error}, {status: 422})
    }

    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}

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

    const entity = await db.trigger.findFirstOrThrow({
      where: {
        organizationId: params.organizationId,
        id: params.triggerId
      },
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
    })

    return NextResponse.json(entity)
  } catch (error) {
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}
