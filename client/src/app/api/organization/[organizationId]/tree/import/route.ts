import * as z from "zod"
import {getServerSession} from "next-auth/next";
import {NextRequest, NextResponse} from "next/server";

import {nc, prisma} from "@/lib/singleton";
import authOptions from "@/lib/auth.config";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {importPostSchema} from "@/lib/validations/import";
import {ConditionType} from "@prisma/client";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string()
  })
})

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
    const body = importPostSchema.parse(json)

    const promsT = body.triggers.map((trigger) => prisma.trigger.create({
      data: {
        name: `${body.slug}${trigger.name.substring(1)}` ,
        enable: false,
        channel: trigger.channel,
        code: trigger.code,
        organization: {
          connect: {id: params.organizationId},
        },
        conditions: {
          createMany: {
            data: trigger.conditions.map((condition) => ({
              name: condition.name,
              enable: false,
              code: condition.code,
              type: condition.type as ConditionType,
              timeout: condition.timeout,
            })),
          },
        },
      },
    }))

    const promsS = body.shareds.map((shared) => prisma.shared.create({
      data: {
        name: `${body.slug}${shared.name.substring(1)}` ,
        code: shared.code,
        enable: false,
        organization: {
          connect: {id: params.organizationId},
        },
      },
    }))

    const resultsP = await Promise.allSettled([...promsT, ...promsS])

    const results = resultsP.map(
      (res, i) => {
        if (i < body.triggers.length) {
          return {
            type: 'trigger',
            entity: body.triggers[i]?.name,
            result: res.status
          }
        } else {
          return {
            type: 'shared',
            entity: body.shareds[i - body.triggers.length]?.name,
            result: res.status
          }
        }
      }
    )

    return NextResponse.json(results, {status: 200})
  } catch (error) {
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}
