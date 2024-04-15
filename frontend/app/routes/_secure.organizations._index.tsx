import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useLoaderData, useRevalidator } from '@remix-run/react';

import { createSession, getPocketbase, getUser } from '~/utils/pb.server';
import { Collections, OrganizationsResponse, UserOrganizationResponse, UsersResponse } from '~/types/pocketbase';
import { cn } from '~/utils/cn';
import { buttonVariants } from '~/components/ui/button';
import { Icons } from '~/components/icons';
import { ScrollArea } from '~/components/ui/scroll-area';
import { OrganizationCard } from '~/components/organization/card';

export async function loader({ request }: LoaderFunctionArgs) {
  const pb = getPocketbase(request);
  const user = getUser(pb);

  if (!user) {
    return createSession('/login', pb);
  }

  const organizations = await pb
    .collection(Collections.Organizations)
    .getFullList<OrganizationsResponse<{
      user_organization_via_organization: UserOrganizationResponse<{ user: UsersResponse }>[]
    }>>(
      {
        sort: '+created',
        expand: [
          'user_organization_via_organization',
          'user_organization_via_organization.user'
        ].join(','),
        filter: 'user_organization_via_organization.role ?= "CREATOR"'
      }
    );

  return json({
    organizations,
  });
}

export default function Index() {
  const { organizations } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col flex-grow">
      <div className="mb-4">
        <Link
          to="/organizations/new"
          className={cn(
            buttonVariants({ variant: 'default' })
          )}
        >
          <Icons.create className="mr-2 h-4 w-4" />
          Create
        </Link>
      </div>
      <ScrollArea>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {
            organizations.map((organization) => {
              return (
                <OrganizationCard
                  key={organization.id}
                  organization={organization}
                />
              );
            })
          }
        </div>
      </ScrollArea>
    </div>
  );
}
