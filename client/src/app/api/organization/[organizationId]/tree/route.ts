import * as z from "zod"
import {getServerSession} from "next-auth/next";
import authOptions from "@/lib/auth.config";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {NextRequest, NextResponse} from "next/server";
import {nc, prisma} from "@/lib/singleton";;
import {generateTree} from "@/lib/tree";

const routeContextSchema = z.object({
  params: z.object({
    organizationId: z.string(),
  })
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

    const path = req.nextUrl.searchParams.get('path')

    if (!path) {
      return NextResponse.json({error: 'SearchParams "path" is required.'}, {status: 422})
    }

    await prisma.trigger.deleteMany({
      where: {
        organizationId: params.organizationId,
        name: {
          startsWith: path,
        }
      },
    })

    await prisma.shared.deleteMany({
      where: {
        organizationId: params.organizationId,
        name: {
          startsWith: path,
        }
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

    const path = req.nextUrl.searchParams.get('path') ?? '/'

    const triggersP = prisma.trigger.findMany({
      where: {
        organizationId: params.organizationId,
        name: {
          startsWith: path
        }
      },
    })

    const sharedsP = prisma.shared.findMany({
      where: {
        organizationId: params.organizationId,
        name: {
          startsWith: path
        }
      },
    })

    const [triggers, shared] = await Promise.all([triggersP, sharedsP])

    return NextResponse.json(generateTree(path, triggers, shared), {status: 200})
  } catch (error) {
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}
