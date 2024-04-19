import { ActionFunctionArgs, json, redirect } from '@remix-run/node'
import { Link, useFetcher, useLoaderData } from '@remix-run/react'
import { ColumnDef } from '@tanstack/react-table'

import { createSession, getPocketbase, getUser } from '~/utils/pb.server'
import { Collections, CustomEventsResponse } from '~/types/pocketbase'
import { DataTable } from '~/components/data-table'
import { customEventCreateFormSchema } from '~/validation/custom-event'
import { ClientResponseError } from 'pocketbase'
import { cn } from '~/utils/cn'
import { Button, buttonVariants } from '~/components/ui/button'
import { useEffect, useState } from 'react'
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
import { ScrollArea } from '~/components/ui/scroll-area'

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
      const result = customEventCreateFormSchema.safeParse(formValues)
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
        const created = await pb.collection(Collections.CustomEvents).create({
          'organization': organizationId,
          'name': result.data.name,
          'description': result.data.description,
          'payload': result.data.payload,
        })
        return redirect(`/organizations/${organizationId}/custom-events/${created.id}`)
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return {
            errors: {
              ...e.data.data,
              global: {
                message: e.data.message,
              },
            },
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

export async function loader(args: ActionFunctionArgs) {
  const organizationId = args.params?.organizationId

  if (!organizationId) {
    throw new Error('404')
  }

  const pb = getPocketbase(args.request)
  const user = getUser(pb)

  if (!user) {
    return createSession('/login', pb)
  }

  const customEvents = await pb
    .collection(Collections.CustomEvents)
    .getFullList(
      {
        filter: `organization.id = "${organizationId}"`,
        sort: '+created',
      },
    )

  const organization = await pb
    .collection(Collections.Organizations)
    .getOne(organizationId)

  return json({
    organization,
    customEvents,
  })
}

export const columns: ColumnDef<CustomEventsResponse>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'description',
    header: 'Description',
  },
  {
    accessorKey: 'payload',
    header: 'Payload',
  },
  {
    id: 'actions',
    cell: function ActionComponent({ row }) {
      const fetcher = useFetcher()
      const [modalDeleteOpen, setModalDeleteOpen] = useState(false)

      useEffect(() => {
        if (fetcher.state === 'loading') {
          setModalDeleteOpen(false)
        }
      }, [fetcher])

      const handleOpenDelete = () => {
        setModalDeleteOpen(true)
      }

      return (
        <>
          <Dialog open={modalDeleteOpen} onOpenChange={setModalDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Do you want to delete {row.original.name} custom event ?</DialogTitle>
                <DialogDescription />
                <DialogFooter>
                  <fetcher.Form
                    method="POST"
                    action={`/organizations/${row.original.organization}/custom-events/${row.original.id}`}
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
                  to={`/organizations/${row.original.organization}/custom-events/${row.original.id}`}
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


export default function OrganizationIdScriptLayout() {
  const { customEvents, organization } = useLoaderData<typeof loader>()
  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex justify-between">
        <h1 className="font-heading text-xl">
          Custom events
        </h1>
        <Link
          to={`/organizations/${organization.id}/custom-events/new`}
          className={cn(
            'flex gap-2',
            buttonVariants({ variant: 'default' }),
          )}
        >
          <Icons.create className="h-4 w-4" />
          New
        </Link>
      </div>
      <ScrollArea className="py-4 grow">
        <DataTable columns={columns} data={customEvents as CustomEventsResponse[]} />
      </ScrollArea>
    </div>
  )
}