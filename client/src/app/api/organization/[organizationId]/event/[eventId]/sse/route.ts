import {NextRequest, NextResponse} from "next/server";
import * as z from "zod";

import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {getEventProcessAndLogById} from "@/lib/db/event";
import {gChOrgaEvent} from "@/lib/helper";
import {getCurrentUser} from "@/lib/session";

import {nc} from "@/lib/singleton";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
    eventId: z.string(),
  }),
})

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

    const sub = (await nc).subscribe(gChOrgaEvent(params.organizationId, params.eventId))

    const stream = new ReadableStream({
      async start(controller) {
        for await (const m of sub) {
          const process = await getEventProcessAndLogById(params.organizationId, currentUser.id, params.eventId)

          if (!controller.desiredSize) {
            return
          }
          controller.enqueue(`data:${JSON.stringify(process)}\n\n`);
        }
        controller.close();
      },
      async cancel() {
        sub.unsubscribe()
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}