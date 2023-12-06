import * as z from "zod";
import {getServerSession} from "next-auth/next";
import {NextResponse} from "next/server";

import {authOptions} from "@/lib/auth";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {redis} from "@/lib/redis";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
    sessionId: z.string()
  }),
})

export async function DELETE(
  req: Request,
  context: z.infer<typeof routeContextSchema>
) {
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

    // check if redis have this key !
    const moduleSession = await redis.hget(`organization:${params.organizationId}:modules`, params.sessionId)

    if (!moduleSession) {
      return NextResponse.json({error: 'No module connected for this sessionId'}, {status: 500})
    }

    await redis.hdel(`organization:${params.organizationId}:modules`, params.sessionId)

    redis.publish(`organization:${params.organizationId}:module-eject:${params.sessionId}`, '')

    return new Response(null, {status: 204})
  } catch (error) {
    console.log(error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({error}, {status: 422})
    }

    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}