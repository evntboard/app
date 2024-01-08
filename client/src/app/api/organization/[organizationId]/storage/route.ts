import {getServerSession} from "next-auth/next"
import {NextResponse} from "next/server";
import * as z from "zod"

import {authOptions} from "@/lib/auth"
import {nc, prisma} from "@/lib/singleton";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {gChOrgaStorage} from "@/lib/helper";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
  }),
})

export async function POST(req: Request, context: z.infer<typeof routeContextSchema>) {
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

    const json = await req.json()

    const storageSchema = z.object({
      key: z.string().min(3),
      value: z.any(),
    })

    const body = storageSchema.parse(json)

    if (body.key === 'new' || body.key === 'tmp:new') {
      return NextResponse.json({error: 'new cannot be a key name !'}, {status: 422})
    }

    const entity = await prisma.storage.upsert({
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
    });

    (await nc).publish(gChOrgaStorage(params.organizationId), body.key)

    return NextResponse.json({
      key: entity.key,
      value: entity.value,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), {status: 422})
    }

    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}