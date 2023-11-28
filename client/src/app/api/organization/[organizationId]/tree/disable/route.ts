import * as z from "zod"
import {getServerSession} from "next-auth/next";
import {authOptions} from "@/lib/auth";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {NextRequest, NextResponse} from "next/server";
import {db} from "@/lib/db";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
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

    const triggerP = db.trigger.updateMany({
      where: {
        organizationId: params.organizationId,
        name: {
          startsWith: path
        }
      },
      data: {
        enable: false
      },
    });

    const sharedP = db.shared.updateMany({
      where: {
        organizationId: params.organizationId,
        name: {
          startsWith: path
        }
      },
      data: {
        enable: false
      },
    });

    await Promise.all([triggerP, sharedP])

    return NextResponse.json({}, {status: 200})
  } catch (error) {
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}
