import {getServerSession} from "next-auth/next"
import {NextResponse} from "next/server";
import * as z from "zod"

import {authOptions} from "@/lib/auth"
import {db} from "@/lib/db"
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {eventSchema} from "@/lib/validations/event";

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

    // TODO CHECK SUBSCRIPTION PLAN

    const json = await req.json()
    const body = eventSchema.parse(json)

    const entity = await db.event.create({
      data: {
        name: body.name,
        payload: body.payload,
        organizationId: params.organizationId,
      },
      select: {
        id: true,
        name: true,
        payload: true,
      },
    })

    return NextResponse.json(entity)
  } catch (error) {
    console.log(error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({error}, {status: 422})
    }

    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}