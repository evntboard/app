import * as z from "zod"
import {getServerSession} from "next-auth/next";
import {NextRequest, NextResponse} from "next/server";

import {db} from "@/lib/db"
import {authOptions} from "@/lib/auth";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";

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

    const triggersP = db.trigger.findMany({
      select: {
        name:true,
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
        name: {
          startsWith: path
        }
      },
    })

    const sharedsP = db.shared.findMany({
      select: {
        name:true,
        code: true,
      },
      where: {
        organizationId: params.organizationId,
        name: {
          startsWith: path
        }
      },
    })

    const [triggers, shareds] = await Promise.all([triggersP, sharedsP])

    return NextResponse.json({ triggers, shareds }, {status: 200})
  } catch (error) {
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}
