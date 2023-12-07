import * as z from "zod"
import {getServerSession} from "next-auth/next";
import {NextResponse} from "next/server";

import {db} from "@/lib/db"
import {authOptions} from "@/lib/auth";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {redis} from "@/lib/redis";
import {gChOrgaStorage, gKeyOrgaStorage} from "@/lib/helper";

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

    const keyStorage = gKeyOrgaStorage(params.organizationId)
    const channelStorage = gChOrgaStorage(params.organizationId)

    if (params.storageKey.startsWith('tmp:')) {
      const storageKeys = await redis.hkeys(keyStorage)
      const existInRedis = storageKeys.includes(params.storageKey)

      if (!existInRedis) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 404})
      }

      await redis.hdel(keyStorage, params.storageKey)

      redis.publish(channelStorage, JSON.stringify({
        key: params.storageKey,
        value: null
      }))

      return new Response(null, {status: 204})
    }

    const storageCount = await db.storage.count({
      where: {
        key: params.storageKey,
        organizationId: params.organizationId,
      },
    })
    const existInStorage = storageCount > 0

    if (!existInStorage) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 404})
    }

    await db.storage.delete({
      where: {
        key_organizationId: {
          key: params.storageKey,
          organizationId: params.organizationId
        }
      },
    })

    redis.publish(channelStorage, JSON.stringify({
      key: params.storageKey,
      value: null
    }))

    return new Response(null, {status: 204})
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({error}, {status: 422})
    }

    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}