import * as z from "zod"
import {getServerSession} from "next-auth/next";
import {NextRequest, NextResponse} from "next/server";

import {db} from "@/lib/db"
import {authOptions} from "@/lib/auth";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
    triggerId: z.string(),
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

    const trigger = await db.trigger.findFirst({
      select: {
        name: true,
        code: true,
        channel: true,
        conditions: {
          select: {
            name: true,
            code: true,
            timeout: true,
            type: true
          }
        }
      },
      where: {
        organizationId: params.organizationId,
        id: params.triggerId
      },
    })

    return NextResponse.json({triggers: [trigger], shareds: []}, {status: 200})
  } catch (error) {
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}
