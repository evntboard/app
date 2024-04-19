import type { LoaderFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react';

import { createSession, getPocketbase, getUser } from '~/utils/pb.server'
import { Collections, OrganizationsResponse, UserOrganizationResponse, UsersResponse } from '~/types/pocketbase'
import { FormOrganizationAvatar } from '~/components/organization/form-avatar'
import { FormOrganizationName } from '~/components/organization/form-name'
import { FormOrganizationDelete } from '~/components/organization/form-delete';

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

  const organization = await pb
    .collection(Collections.Organizations)
    .getOne<OrganizationsResponse<{
      user_organization_via_organization: UserOrganizationResponse<{ user: UsersResponse }>[]
    }>>(organizationId)

  if (!organization) {
    throw new Error('404')
  }

  return json({
    organization,
  })
}

export default function OrganizationIdGeneralPage() {
  const { organization } = useLoaderData<typeof loader>()

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex justify-between">
        <h1 className="font-heading text-xl">
          General
        </h1>
      </div>
      <FormOrganizationAvatar organization={organization} />
      <FormOrganizationName organization={organization} />
      <FormOrganizationDelete organization={organization} />
    </div>
  )
}


