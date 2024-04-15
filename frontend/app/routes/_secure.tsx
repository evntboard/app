import { json, LoaderFunctionArgs } from '@remix-run/node';
import { Link, Outlet, useLoaderData } from '@remix-run/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu';
import { AvatarPb } from '~/components/avatar-pb';

import { createSession, getPocketbase, getUser } from '~/utils/pb.server';
import { Collections, OrganizationsResponse, UserOrganizationResponse, UsersResponse } from '~/types/pocketbase';
import { OrganizationSwitcher } from '~/components/organization/switcher';
import { ThemeToggle } from '~/components/theme-toggle';
import { getAvatarUrl } from '~/utils/avatar'

export async function loader({ request }: LoaderFunctionArgs) {
  const pb = getPocketbase(request);
  const authModel = getUser(pb);

  if (!authModel) {
    return createSession('/login', pb);
  }

  const user = await pb.collection(Collections.Users).getOne(pb.authStore.model?.id);

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
    user,
  });
}

export default function SecureLayout() {
  const { user, organizations } = useLoaderData<typeof loader>();

  return (
    <div className="h-screen w-screen flex flex-col md:flex overflow-auto">
      <div className="border-b shrink-0">
        <div className="flex h-16 items-center px-4 gap-2">
          <nav
            className={'flex items-center space-x-4 lg:space-x-6'}
          >
            <OrganizationSwitcher organizations={organizations}/>
            <Link
              to="/organizations"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Organizations
            </Link>
          </nav>
          <div className="ml-auto flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <AvatarPb url={getAvatarUrl(user)} />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <Link to="/logout">
                    Log out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
          </div>
        </div>
      </div>
      <div className="flex flex-1 p-8 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
