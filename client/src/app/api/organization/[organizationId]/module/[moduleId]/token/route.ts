import * as z from "zod"
import {NextRequest, NextResponse} from "next/server";
import {auth} from "@/lib/auth"

import { prisma} from "@/lib/singleton";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
    moduleId: z.string(),
  }),
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

    const entity = await prisma.module.findFirstOrThrow({
      where: {
        organizationId: params.organizationId,
        id: params.moduleId
      },
      select: {
        token: true,
      },
    })

    return NextResponse.json(entity)
  } catch (error) {
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}
