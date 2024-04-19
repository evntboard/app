import { ActionFunctionArgs, json, LoaderFunctionArgs } from '@remix-run/node'
import { Link, useFetcher, useLoaderData } from '@remix-run/react'
import { createSession, getPocketbase, getUser } from '~/utils/pb.server'
import { Collections, UserOrganizationResponse, UsersResponse } from '~/types/pocketbase'
import { Button, buttonVariants } from '~/components/ui/button'
import { ClientResponseError } from 'pocketbase'
import { organizationAddMemberFormSchema } from '~/validation/organization'
import { cn } from '~/utils/cn'
import { DataTable } from '~/components/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { Icons } from '~/components/icons'
import { AvatarPb } from '~/components/avatar-pb'
import { ScrollArea } from '~/components/ui/scroll-area'
import { getAvatarUrl } from '~/utils/avatar'

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

  let formValues: { _action?: string } = {}

  if (args.request.headers.get('content-type') === 'application/json') {
    formValues = await args.request.json()
  } else {
    const formData = await args.request.formData()
    formValues = Object.fromEntries(formData.entries())
  }

  switch (formValues?._action) {
    case 'create': {
      const result = organizationAddMemberFormSchema.safeParse(formValues)
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
        await pb.collection(Collections.UserOrganization).create({
          'role': result.data.role,
          'user': result.data.userId,
        })
        return null
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return {
            errors: e.data.data,
          }
        }
      }
    }
  }
  return json({
    errors: {
      global: {
        message: 'Unknown error ...',
      },
    },
  })
}

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

  const uos = await pb
    .collection(Collections.UserOrganization)
    .getFullList<UserOrganizationResponse<{
      user: UsersResponse
    }>>({
      sort: '+created',
      expand: 'user',
      filter: `organization = "${organizationId}"`,
    })

  const organization = await pb
    .collection(Collections.Organizations)
    .getOne(organizationId)

  return json({
    organization,
    uos,
  })
}

const columns: ColumnDef<UserOrganizationResponse<{ user: UsersResponse }>>[] = [
  {
    accessorKey: 'user',
    header: 'User',
    cell: ({ row: { original } }) => {
      return (
        <div className="flex gap-2 items-center">
          <AvatarPb url={getAvatarUrl(original.expand?.user)} />
          {original.expand?.user.name ?? '-'}
        </div>
      )
    },
  },
  {
    accessorKey: 'role',
    header: 'Role',
  },
  {
    id: 'actions',
    cell: function CellActions({ row }) {
      const fetcher = useFetcher()
      const { organization } = useLoaderData<typeof loader>()
      const [modalDeleteOpen, setModalDeleteOpen] = useState(false)

      const handleOpenDelete = () => {
        setModalDeleteOpen(true)
      }

      return (
        <>
          <Dialog open={modalDeleteOpen} onOpenChange={setModalDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex gap-2 items-center">
                  Do you want to remove
                  <AvatarPb url={getAvatarUrl(row.original.expand?.user)} />
                  {row.original.expand?.user.name} from
                  <AvatarPb url={getAvatarUrl(organization)} />
                  {organization.name}
                  ?
                </DialogTitle>
                <DialogDescription />
                <DialogFooter>
                  <fetcher.Form
                    method="POST"
                    action={`/organizations/${row.original.organization}/members/${row.original.id}`}
                  >
                    <Button variant="destructive" type="submit" name="_action" value="delete">Delete</Button>
                  </fetcher.Form>
                </DialogFooter>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link
                  to={`/organizations/${row.original.organization}/members/${row.original.id}`}
                  className="flex gap-2 cursor-pointer"
                >
                  <Icons.edit className="h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex gap-2 cursor-pointer" onClick={handleOpenDelete}>
                <Icons.delete className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )
    },
  },
]

export default function OrganizationIdMembers() {
  const { organization, uos } = useLoaderData<typeof loader>()

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex justify-between">
        <h1 className="font-heading text-xl">
          Members
        </h1>
        <Link
          to={`/organizations/${organization.id}/members/new`}
          className={cn(
            buttonVariants({ variant: 'default' }),
          )}
        >
          New
        </Link>
      </div>
      <ScrollArea className="py-4 grow">
        <DataTable columns={columns} data={uos as UserOrganizationResponse<{ user: UsersResponse }>[]} />
      </ScrollArea>
    </div>
  )
}


