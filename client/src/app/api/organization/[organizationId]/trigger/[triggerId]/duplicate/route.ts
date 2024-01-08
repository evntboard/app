import * as z from "zod"

import {nc, prisma} from "@/lib/singleton";
import {getServerSession} from "next-auth/next";
import authOptions from "@/lib/auth.config";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {NextRequest, NextResponse} from "next/server";
import {Condition} from "@prisma/client";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
    triggerId: z.string(),
  })
})

export async function GET(req: NextRequest, context: z.infer<typeof routeContextSchema>) {
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

    const entity = await prisma.trigger.findFirstOrThrow({
      include: {
        conditions: true
      },
      where: {
        organizationId: params.organizationId,
        id: params.triggerId
      },
    })

    const targetPath = req.nextUrl.searchParams.get('target-path') ?? entity.name + '-dup'

    await prisma.trigger.create({
      data: {
        name: targetPath,
        code: entity.code,
        channel: entity.channel,
        enable: false,
        organizationId: params.organizationId,
        conditions: {
          createMany: {
            data:  (entity.conditions as Condition[]).map((condition) => ({
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

    return NextResponse.json({}, {status: 200})
  } catch (error) {
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}
