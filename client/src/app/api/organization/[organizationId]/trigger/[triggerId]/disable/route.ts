import * as z from "zod"

import {db} from "@/lib/db"
import {getServerSession} from "next-auth/next";
import {authOptions} from "@/lib/auth";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {NextRequest, NextResponse} from "next/server";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
    triggerId: z.string(),
  }),
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


    await db.trigger.update({
      where: {
        id: params.triggerId,
        organizationId: params.organizationId,
      },
      data: {
        enable: false
      },
    })

    return NextResponse.json({}, {status: 200})
  } catch (error) {
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}
