import { LoaderFunctionArgs } from '@remix-run/node'
import { Outlet } from '@remix-run/react'

import { createSession, getPocketbase, getUser } from '~/utils/pb.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const pb = getPocketbase(request)
  const authModel = getUser(pb)

  if (!authModel) {
    return createSession('/login', pb)
  }

  return null
}

export default function SecureLayout() {
  return (
    <div className="flex flex-1 p-8 overflow-auto">
      <Outlet />
    </div>
  )

}
