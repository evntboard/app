import * as React from "react";
import {notFound, redirect} from "next/navigation";

import {getOrganizationByUserId} from "@/lib/db/organization";
import {getCurrentUser} from "@/lib/session";
import {authOptions} from "@/lib/auth";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {UserAvatarName} from "@/components/user-avatar-name";

import {RemoveUserFromOrganization} from "./remove-user-from-organization";
import {AddMembers} from "./add-members";

type Props = {
  params: {
    organizationId: string
  }
}

export default async function OrganizationPage(props: Props) {
  const user = await getCurrentUser()

  if (!user) {
    redirect(authOptions?.pages?.signIn || "/login")
  }

  const organization = await getOrganizationByUserId(user.id, props.params.organizationId)

  if (!organization) {
    return notFound()
  }

  const hasWriteAccess = await userHasWriteAccessToOrganization(props.params.organizationId, user.id, )

  return (
    <div className="flex flex-1 flex-col gap-2">
      <div className="flex justify-between">
        <h1 className="font-heading text-xl">
          Manage organization
        </h1>
        <AddMembers
          organizationId={props.params.organizationId}
          hasWriteAccess={!!hasWriteAccess}
        />
      </div>
      <div>
        <div>Creator</div>
        <UserAvatarName user={organization.creator} />
      </div>
      <div>
        <div>Members</div>
        <ul>
          {organization.users.map(({user}) => {
            return (
              <li key={user.name} className="flex items-center justify-between">
                <UserAvatarName user={user} />
                <RemoveUserFromOrganization currentUserId={user.id} user={user} organizationId={props.params.organizationId} />
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}