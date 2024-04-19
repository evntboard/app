import { json, LoaderFunctionArgs } from '@remix-run/node'
import { ClientResponseError } from 'pocketbase'
import { createSession, getPocketbase, getUser } from '~/utils/pb.server'
import { exportFormSchema } from '~/validation/export'
import { Collections, OrganizationsResponse } from '~/types/pocketbase'

export async function loader(args: LoaderFunctionArgs) {
  const pb = getPocketbase(args.request)
  const user = getUser(pb)

  if (!user) {
    return createSession('/login', pb)
  }

  const organizationId = args.params?.organizationId

  if (!organizationId) {
    throw new Error('404')
  }

  const url = new URL(args.request.url)

  const result = exportFormSchema.safeParse({
    path: url.searchParams.get('path'),
  })
  if (!result.success) {
    const errorsFormatted = result.error.issues.reduce((acc, currentValue) => {
      return {
        ...acc,
        [currentValue.path.join('.')]: {
          type: currentValue.code,
          message: currentValue.message,
        },
      }
    }, {})
    return json({ errors: errorsFormatted })
  }

  try {
    const data = await pb.send(`/api/organization/${organizationId}/export`, {
      method: 'GET',
      query: {
        path: result.data.path,
      },
    })

    const organization = await pb
      .collection(Collections.Organizations)
      .getOne<OrganizationsResponse>(organizationId)

    const creationDate = new Date().toDateString()
    const name = `Export EvntBoard ${organization.name}${result.data.path.replace('/', ' ')} ${creationDate}.json`

    return new Response(
      JSON.stringify(data, null, 2),
      {
        headers: {
          'Content-Disposition': `attachment; filename="${name}"`,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (e) {
    if (e instanceof ClientResponseError) {
      return {
        error: e.data.message,
        errors: e.data.data,
      }
    }
  }
  return null
}