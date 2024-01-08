import * as z from "zod";
import {NextResponse} from "next/server";

import {auth} from "@/lib/auth"
import {nc, prisma} from "@/lib/singleton";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {gChOrgaModuleEject} from "@/lib/helper";

;

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

    const session = await auth()

    if (!session) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401})
    }

    const hasAccess = await userHasWriteAccessToOrganization(params.organizationId, session.user.id)

    if (!hasAccess) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 403})
    }

    await prisma.moduleSession.delete({
      where: {
        id: params.sessionId
      }
    });

    (await nc).publish(gChOrgaModuleEject(params.organizationId, params.sessionId))

    return new Response(null, {status: 204})
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({error}, {status: 422})
    }

    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}