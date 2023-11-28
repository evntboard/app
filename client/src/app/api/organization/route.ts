import {NextResponse} from "next/server";
import {getServerSession} from "next-auth/next"
import * as z from "zod"

import {authOptions} from "@/lib/auth"
import {organizationSchema} from "@/lib/validations/organization";
import {createOrganizationForUserId, getOrganizationsByUserId} from "@/lib/db/organization";

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401})
    }

    const entities = await getOrganizationsByUserId(session.user.id)

    return NextResponse.json(entities)
  } catch (error) {
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401})
    }

    // TODO SUBSCRIPTION ! :)

    const json = await req.json()
    const body = organizationSchema.parse(json)

    const entity = await createOrganizationForUserId(session.user.id, body)

    return NextResponse.json(entity)
  } catch (error) {
    console.log(error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, {status: 422})
    }
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
  }
}