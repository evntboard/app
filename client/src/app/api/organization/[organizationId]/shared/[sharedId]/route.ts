import * as z from "zod"

import {db} from "@/lib/db"
import {sharedSchema} from "@/lib/validations/shared"
import {getServerSession} from "next-auth/next";
import {authOptions} from "@/lib/auth";
import {userHasReadAccessToOrganization, userHasWriteAccessToOrganization} from "@/lib/db/user";
import {NextRequest, NextResponse} from "next/server";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
    sharedId: z.string(),
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

    // Delete the post.
    await db.shared.delete({
      where: {
        id: params.sharedId as string,
      },
    })

    return new Response(null, {status: 204})
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({error}, {status: 422})
    }

    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}

export async function PATCH(
  req: Request,
  context: z.infer<typeof routeContextSchema>
) {
  try {
    // Validate the route params.
    const {params} = routeContextSchema.parse(context)

    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401})
    }

    const hasAccess = await userHasWriteAccessToOrganization(params.organizationId, session.user.id)

    if (!hasAccess) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 403})
    }

    // Get the request body and validate it.
    const json = await req.json()
    const body = sharedSchema.parse(json)

    await db.shared.update({
      where: {
        id: params.sharedId,
      },
      data: {
        code: body.code,
        name: body.name,
      },
    })

    return NextResponse.json({}, {status: 200})
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({error}, {status: 422})
    }

    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}

export async function GET(req: NextRequest, context: z.infer<typeof routeContextSchema>) {
  try {
    const {params} = routeContextSchema.parse(context)

    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401})
    }

    const hasAccess = await userHasReadAccessToOrganization(params.organizationId, session.user.id)

    if (!hasAccess) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 403})
    }

    const entities = await db.shared.findFirstOrThrow({
      where: {
        organizationId: params.organizationId,
        id: params.sharedId
      },
    })

    return NextResponse.json(entities)
  } catch (error) {
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}
