import * as z from "zod"

import {prisma} from "@/lib/singleton";
import {moduleSchema} from "@/lib/validations/module"
import {auth} from "@/lib/auth"
import {userHasReadAccessToOrganization, userHasWriteAccessToOrganization} from "@/lib/db/user";
import {NextRequest, NextResponse} from "next/server";
import {ModuleParam} from "@prisma/client";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
    moduleId: z.string(),
  }),
})

export async function DELETE(
  req: NextRequest,
  context: z.infer<typeof routeContextSchema>
) {
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

    await prisma.module.deleteMany({
      where: {
        organizationId: params.organizationId,
        id: params.moduleId,
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
    const {params} = routeContextSchema.parse(context)

    const session = await auth()

    if (!session) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401})
    }

    const hasAccess = await userHasWriteAccessToOrganization(params.organizationId, session.user.id)

    if (!hasAccess) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 403})
    }

    // Get the request body and validate it.
    const json = await req.json()
    const body = moduleSchema.parse(json)


    await prisma.moduleParam.deleteMany({
      where: {
        moduleId: params.moduleId,
        NOT: {
          id: {
            in: (body.params as ModuleParam[]).map((p) => p.id).filter((a) => !!a),
          },
        },
      },
    });


    await prisma.module.update({
      where: {
        id: params.moduleId,
        organizationId: params.organizationId
      },
      data: {
        code: body.code,
        name: body.name,
        params: {
          upsert: (body.params as ModuleParam[]).map((p) => ({
            where: p.id
              ? {
                id: p.id,
                moduleId: params.moduleId,
              }
              : {
                key_moduleId: {
                  key: p.key,
                  moduleId: params.moduleId,
                },
              },
            update: {
              key: p.key,
              value: p.value,
            },
            create: {
              key: p.key,
              value: p.value,
            },
          })),
        },
      },
    });

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

    const session = await auth()

    if (!session) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401})
    }

    const hasAccess = await userHasReadAccessToOrganization(params.organizationId, session.user.id)

    if (!hasAccess) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 403})
    }

    const entity = await prisma.module.findFirstOrThrow({
      where: {
        organizationId: params.organizationId,
        id: params.moduleId
      },
      select: {
        id: true,
        code: true,
        name: true,
        params: {
          select: {
            id: true,
            key: true,
            value: true,
          }
        }
      },
    })

    return NextResponse.json(entity)
  } catch (error) {
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}
