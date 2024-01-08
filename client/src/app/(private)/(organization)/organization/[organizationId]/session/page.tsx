import {redirect} from "next/navigation";

import {getCurrentUser} from "@/lib/session";
import authOptions from "@/lib/auth.config";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {getSessionsForOrganizationId} from "@/lib/db/session";

import {SessionTable} from "./session-table";

type Props = {
  params: {
    organizationId: string
  }
}


export default async function SessionPage(props: Props) {
  const user = await getCurrentUser()

  if (!user) {
    redirect(authOptions?.pages?.signIn || "/login")
  }

  const entities = await getSessionsForOrganizationId(props.params.organizationId)

  const hasWriteAccess = await userHasWriteAccessToOrganization(props.params.organizationId, user.id,)

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex justify-between">
        <h1 className="font-heading text-xl">
          Module Session
        </h1>
      </div>
      <div>
        <SessionTable
          organizationId={props.params.organizationId}
          data={entities}
        />
      </div>
    </div>
  )
}