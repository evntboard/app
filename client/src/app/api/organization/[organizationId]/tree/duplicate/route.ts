import * as z from "zod"

import {prisma} from "@/lib/singleton";
import {getServerSession} from "next-auth/next";
import {authOptions} from "@/lib/auth";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {NextRequest, NextResponse} from "next/server";
import {Condition} from "@prisma/client";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string()
  })
})

export async function GET(req: NextRequest, context: z.infer<typeof routeContextSchema>) {
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

    const path = req.nextUrl.searchParams.get('path') ?? '/'
    const targetPath = req.nextUrl.searchParams.get('target-path') ?? '/dup/'

    const [triggers, shareds] = await Promise.all([
      prisma.trigger.findMany({
        where: {
          organizationId: params.organizationId,
          name: {
            startsWith: path
          }
        },
        include: {
          conditions: true
        }
      }),
      prisma.shared.findMany({
        where: {
          organizationId: params.organizationId,
          name: {
            startsWith: path
          }
        },
      })
    ])

    await Promise.all([
      ...triggers.map((t) => {
        return prisma.trigger.create({
          data: {
            name: t.name.replace(path, targetPath),
            code: t.code,
            channel: t.channel,
            enable: false,
            organizationId: params.organizationId,
            conditions: {
              createMany: {
                data: (t.conditions as Condition[]).map((condition) => ({
                  name: condition.name,
                  enable: condition.enable,
                  code: condition.code,
                  type: condition.type,
                  timeout: condition.timeout,
                })),
              },
            },
          },
        });
      }),
      ...shareds.map((s) => {
        return prisma.shared.create({
          data: {
            name: s.name.replace(path, targetPath),
            code: s.code,
            enable: false,
            organizationId: params.organizationId,
          },
        });
      })
    ])

    return NextResponse.json({}, {status: 200})
  } catch (error) {
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}
