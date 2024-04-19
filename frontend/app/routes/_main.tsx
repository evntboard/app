import { Link, Outlet, useLoaderData, useMatch } from '@remix-run/react'
import { OrganizationSwitcher } from '~/components/organization/switcher'
import {
  DropdownMenu,
  DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { AvatarPb } from '~/components/avatar-pb'
import { getAvatarUrl } from '~/utils/avatar'
import { ThemeToggle } from '~/components/theme-toggle'
import { json, LoaderFunctionArgs } from '@remix-run/node'
import { getPocketbase, getUser } from '~/utils/pb.server'
import { Collections, OrganizationsResponse, UserOrganizationResponse, UsersResponse } from '~/types/pocketbase'
import { cn } from '~/utils/cn'
import { buttonVariants } from '~/components/ui/button'
import { Icons } from '~/components/icons'

export async function loader({ request }: LoaderFunctionArgs) {
  const pb = getPocketbase(request)
  const authModel = getUser(pb)

  if (!authModel) {
    return json({
      organizations: null,
      user: null,
    })
  }

  const user = await pb.collection(Collections.Users).getOne(pb.authStore.model?.id)

  const organizations = await pb
    .collection(Collections.Organizations)
    .getFullList<OrganizationsResponse<{
      user_organization_via_organization: UserOrganizationResponse<{ user: UsersResponse }>[]
    }>>(
      {
        sort: '+created',
        expand: [
          'user_organization_via_organization',
          'user_organization_via_organization.user',
        ].join(','),
        filter: 'user_organization_via_organization.role ?= "CREATOR"',
      },
    )

  return json({
    organizations,
    user,
  })
}

export default function IndexPage() {
  const { user, organizations } = useLoaderData<typeof loader>()

  const match = useMatch('/organizations/*')

  return (
    <div className="h-screen w-screen flex flex-col md:flex overflow-auto">
      <div className="border-b shrink-0">
        <div className="container flex h-16 items-center px-4 gap-2">
          <div className="flex items-center px-4">
            <Icons.logo className="w-8 h-8" />
          </div>
          <nav
            className={'flex items-center space-x-4 lg:space-x-6'}
          >
            <Link
              to="/"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Home
            </Link>
            <Link
              to="/organizations"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Organizations
            </Link>
          </nav>
          <div className="ml-auto flex items-center space-x-4">
            {
              !!match && organizations && (
                <OrganizationSwitcher organizations={organizations} />
              )
            }
            {
              !user && (
                <Link
                  to={`/login`}
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                  )}
                >
                  <Icons.signin className="mr-2 h-4 w-4" />
                  Login
                </Link>
              )
            }
            {
              user && (
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
              )
            }
            <ThemeToggle />
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  )
}
