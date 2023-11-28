import * as z from "zod"
import {getServerSession} from "next-auth/next";
import {NextResponse} from "next/server";

import {db} from "@/lib/db"
import {authOptions} from "@/lib/auth";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {redis} from "@/lib/redis";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
    storageKey: z.string(),
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

    const storageCount = await db.storage.count({
      where: {
        key: params.storageKey,
        organizationId: params.organizationId,
      },
    })

    const storageKeys = await redis.hkeys(`organization:${params.organizationId}:storage`)

    const existInStorage = storageCount > 0
    const existInRedis = storageKeys.includes(params.storageKey)

    if (!existInStorage && !existInRedis) {
      return NextResponse.json({error: 'This key does not exist !'}, {status: 500})
    }

    if (existInRedis) {
      await redis.hdel(`organization:${params.organizationId}:storage`, params.storageKey)
    }

    if (existInStorage) {
      await db.storage.delete({
        where: {
          key_organizationId: {
            key: params.storageKey,
            organizationId: params.organizationId
          }
        },
      })
    }

    return new Response(null, {status: 204})
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({error}, {status: 422})
    }

    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}