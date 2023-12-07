import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth/next";
import * as z from "zod";
import {v4 as uuid} from "uuid";
import isObject from "lodash/isObject";

import {authOptions} from "@/lib/auth";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {realtimeEventSchema} from "@/lib/validations/realtime-event";
import {addEvent, getEventsByOrganizationId} from "@/lib/event";
import {RealtimeEvent} from "@/types/realtime-event";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
  }),
})

export async function POST(req: NextRequest, context: z.infer<typeof routeContextSchema>) {
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
    const body = realtimeEventSchema.parse(json)

    let event: RealtimeEvent = {
      id: uuid(),
      name: body.name,
      payload: isObject(json.payload) ? json.payload : {},
      emitted_at: new Date().toISOString(),
      emitter_code: 'WEB',
      emitter_name: 'WEB',
    }

    try {
      await addEvent(event, params.organizationId)
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

    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401})
    }

    const hasAccess = await userHasWriteAccessToOrganization(params.organizationId, session.user.id)

    if (!hasAccess) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 403})
    }

   const result = await getEventsByOrganizationId(params.organizationId, session.user.id)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}