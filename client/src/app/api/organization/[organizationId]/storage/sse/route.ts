import {NextRequest, NextResponse} from "next/server";
import * as z from "zod";
import {getServerSession} from "next-auth/next";

import authOptions from "@/lib/auth.config";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {gChOrgaStorage} from "@/lib/helper";
import {nc, prisma} from "@/lib/singleton";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
  }),
})

export async function GET(req: NextRequest, context: z.infer<typeof routeContextSchema>) {
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

    const sub = (await nc).subscribe(gChOrgaStorage(params.organizationId))

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const m of sub) {
            const storage = await prisma.storage.findFirst({
              select: {
                key: true,
                value: true,
              },
              where: {
                organizationId: params.organizationId,
                key: m.string()
              }
            })
            if (!controller.desiredSize || !storage) {
              return
            }
            controller.enqueue(`data:${JSON.stringify(storage)}\n\n`);
          }
          controller.close();
        } catch (e) {
          if (!controller.desiredSize) {
            return
          }
          controller.close();
        }
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