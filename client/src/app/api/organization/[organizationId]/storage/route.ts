import {getServerSession} from "next-auth/next"
import {NextResponse} from "next/server";
import * as z from "zod"

import {authOptions} from "@/lib/auth"
import {db} from "@/lib/db"
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {redis} from "@/lib/redis";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
  }),
})

export async function POST(req: Request, context: z.infer<typeof routeContextSchema>) {
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

    const json = await req.json()

    const storageSchema = z.object({
      key: z.string(),
      type: z.string(),
      value: z.any(),
    })

    const body = storageSchema.parse(json)

    if (body.key === 'new') {
      return NextResponse.json({error: 'new cannot be a key name !'}, {status: 422})
    }

    switch (body.type) {
      case 'TEMPORARY': {
        // verify if key don't exist on storage DB
        const exist = await db.storage.count({
          where: {
            key: body.key,
            organizationId: params.organizationId,
          },
        })

        if (exist > 0) {
          return NextResponse.json({error: 'This key is on PERSISTENT !'}, {status: 422})
        }

        await redis.hset(`organization:${params.organizationId}:storage`, body.key, JSON.stringify(body.value))
        const data = await redis.hget(`organization:${params.organizationId}:storage`, body.key)

        redis.publish(`organization:${params.organizationId}:storage:temporary`, JSON.stringify({
          key: body.key,
          value: data
        }))

        return NextResponse.json({
          key: body.key,
          value: JSON.parse(data ?? ""),
          type: 'TEMPORARY'
        })
      }
      case 'PERSISTENT': {
        // verify if key don't exist on redis
        const exist = await redis.hget(`organization:${params.organizationId}:storage`, body.key)

        if (exist !== null) {
          return NextResponse.json({error: 'This key is on TEMPORARY !'}, {status: 422})
        }

        const entity = await db.storage.upsert({
          where: {
            key_organizationId: {
              key: body.key,
              organizationId: params.organizationId,
            }
          },
          update: {
            value: body.value,
            organizationId: params.organizationId,
          },
          create: {
            key: body.key,
            value: body.value,
            organizationId: params.organizationId,
          },
        })

        redis.publish(`organization:${params.organizationId}:storage:persistent`, JSON.stringify({
          key: entity.key,
          value: entity.value
        }))

        return NextResponse.json({
          key: entity.key,
          value: entity.value,
          type: 'PERSISTENT'
        })
      }
      default:
        return NextResponse.json({error: 'UNKNOWN type storage'}, {status: 500})
    }
  } catch (error) {
    console.log(error)
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), {status: 422})
    }

    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}