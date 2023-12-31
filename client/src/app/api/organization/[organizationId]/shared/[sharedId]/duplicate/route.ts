import * as z from "zod"

import {nc, prisma} from "@/lib/singleton";
import {getServerSession} from "next-auth/next";
import {authOptions} from "@/lib/auth";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {NextRequest, NextResponse} from "next/server";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
    sharedId: z.string(),
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


    const entity = await prisma.shared.findFirstOrThrow({
      where: {
        organizationId: params.organizationId,
        id: params.sharedId
      },
    })

    const targetPath = req.nextUrl.searchParams.get('target-path') ?? entity.name + '-dup'

    await prisma.shared.create({
      data: {
        name: targetPath,
        code: entity.code,
        enable: false,
        organizationId: params.organizationId,
      },
    })

    return NextResponse.json({}, {status: 200})
  } catch (error) {
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}
