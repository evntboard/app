import { Outlet } from '@remix-run/react'
import { LoaderFunctionArgs } from '@remix-run/node'

import { createSession, getPocketbase, getUser } from '~/utils/pb.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const pb = getPocketbase(request)
  const user = getUser(pb)

  if (user) return createSession('/', pb)

  return null
}

export default function AuthLayout() {
  return (<Outlet />)
}
