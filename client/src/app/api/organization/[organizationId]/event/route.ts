import {NextRequest, NextResponse} from "next/server";
import * as z from "zod";
import {eventSchema} from "@/lib/validations/event";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {addEvent, getEventsByOrganizationId} from "@/lib/db/event";
import {getCurrentUser} from "@/lib/session";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
  }),
})

export async function POST(req: NextRequest, context: z.infer<typeof routeContextSchema>) {
  try {
    const {params} = routeContextSchema.parse(context)

    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401})
    }

    const hasAccess = await userHasWriteAccessToOrganization(params.organizationId, currentUser.id)

    if (!hasAccess) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 403})
    }

    const json = await req.json()
    const body = eventSchema.parse(json)

    try {
      await addEvent(
        params.organizationId,
        {
          name: body.name,
          payload: body.payload,
          emittedAt: new Date(),
          emitterCode: 'WEB',
          emitterName: 'WEB',
          organizationId: params.organizationId
        }
      )
    } catch (erreur) {
      console.error("Erreur lors de l'ajout des données à la liste:", erreur);
    }

    return NextResponse.json(null)
  } catch (error) {
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}

export async function GET(req: NextRequest, context: z.infer<typeof routeContextSchema>) {
  try {
    const {params} = routeContextSchema.parse(context)

    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401})
    }

    const hasAccess = await userHasWriteAccessToOrganization(params.organizationId, currentUser.id)

    if (!hasAccess) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 403})
    }

    const result = await getEventsByOrganizationId(params.organizationId, currentUser.id)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}