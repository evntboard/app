import {NextRequest, NextResponse} from "next/server";
import * as z from "zod";
import {getServerSession} from "next-auth/next";
import Redis from "ioredis";

import {authOptions} from "@/lib/auth";
import {redisConfig} from "@/lib/redis";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
  }),
})

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

    const channel = `organization:${params.organizationId}:storage`

    const souscripteur = new Redis(redisConfig);

    const stream = new ReadableStream({
      async start(controller) {
        souscripteur.on("message", (canal, message) => {
          if (canal === channel) {
            controller.enqueue(`data:${message}\n\n`);
          }
        });

        souscripteur.on("error", (erreur) => {
          controller.error(erreur);
        });

        souscripteur.on("end", () => {
          if (!controller.desiredSize) {
            return;
          }

          controller.close();
        });

        souscripteur.subscribe(channel);
      },
      cancel() {
        souscripteur.unsubscribe(channel);
        souscripteur.quit();
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