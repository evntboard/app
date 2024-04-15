import { ActionFunctionArgs } from '@remix-run/node'
import { createSession, getPocketbase, getUser } from '~/utils/pb.server'
import { ClientResponseError } from 'pocketbase'

export async function action(args: ActionFunctionArgs) {
  const pb = getPocketbase(args.request)
  const user = getUser(pb)

  if (!user) {
    return createSession('/login', pb)
  }

  const organizationId = args.params?.organizationId

  if (!organizationId) {
    throw new Error('404')
  }

  const data = await args.request.formData()

  try {
    const result = await pb.send(`/api/organization/${organizationId}/import`, {
      method: 'POST',
      body: data,
    })
    return {
      result
    }
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