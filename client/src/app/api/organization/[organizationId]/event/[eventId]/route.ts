import * as z from "zod"

import {db} from "@/lib/db"
import {eventSchema} from "@/lib/validations/event"
import {getServerSession} from "next-auth/next";
import {authOptions} from "@/lib/auth";
import {userHasReadAccessToOrganization, userHasWriteAccessToOrganization} from "@/lib/db/user";
import {NextRequest, NextResponse} from "next/server";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
    eventId: z.string(),
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
    await db.event.delete({
      where: {
        id: params.eventId as string,
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
    const body = eventSchema.parse(json)

    await db.event.update({
      where: {
        id: params.eventId,
      },
      data: {
        name: body.name,
        payload: body.payload,
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

    const entities = await db.event.findFirstOrThrow({
      where: {
        organizationId: params.organizationId,
        id: params.eventId
      },
    })

    return NextResponse.json(entities)
  } catch (error) {
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}
