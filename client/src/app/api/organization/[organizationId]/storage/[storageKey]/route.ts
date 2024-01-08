import * as z from "zod"
import {getServerSession} from "next-auth/next";
import {NextResponse} from "next/server";

import {nc, prisma} from "@/lib/singleton";
import authOptions from "@/lib/auth.config";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {gChOrgaStorage} from "@/lib/helper";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
    storageKey: z.string().min(3),
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

    const storageCount = await prisma.storage.count({
      where: {
        key: params.storageKey,
        organizationId: params.organizationId,
      },
    })
    const existInStorage = storageCount > 0

    if (!existInStorage) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 404})
    }

    await prisma.storage.delete({
      where: {
        key_organizationId: {
          key: params.storageKey,
          organizationId: params.organizationId
        }
      },
    });

    (await nc).publish(gChOrgaStorage(params.organizationId), params.storageKey)

    return new Response(null, {status: 204})
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({error}, {status: 422})
    }

    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}