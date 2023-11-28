import * as z from "zod"
import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth/next";

import {db} from "@/lib/db"
import {authOptions} from "@/lib/auth";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {generateToken} from "@/lib/utils";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
    moduleId: z.string(),
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

    const entity = await db.module.update({
      where: {
        id: params.moduleId,
        organizationId: params.organizationId,
      },
      data: {
        token: generateToken()
      },
    })

    return NextResponse.json(entity)
  } catch (error) {
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}
