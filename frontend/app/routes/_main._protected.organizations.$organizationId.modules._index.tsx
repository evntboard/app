import { ActionFunctionArgs, json, redirect } from '@remix-run/node'
import { Link, useFetcher, useLoaderData, useRevalidator } from '@remix-run/react'
import { ColumnDef } from '@tanstack/react-table'
import { ClientResponseError } from 'pocketbase'
import { v4 as uuid } from 'uuid'

import { Collections, ModuleParamsResponse, ModulesResponse } from '~/types/pocketbase';
import { cn } from '~/utils/cn'
import { createSession, getPocketbase, getUser } from '~/utils/pb.server'
import { moduleCreateFormSchema } from '~/validation/module'
import { DataTable } from '~/components/data-table'
import { Button, buttonVariants } from '~/components/ui/button'
import { Icons } from '~/components/icons'
import {
  DropdownMenu,
  DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { ScrollArea } from '~/components/ui/scroll-area'
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { EjectModule } from '~/components/module/eject'
import { pb } from '~/utils/pb.client'

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
      const result = moduleCreateFormSchema.safeParse(formValues)
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
        const created = await pb.collection(Collections.Modules).create({
          organization: organizationId,
          code: result.data.code,
          name: result.data.name,
          sub: result.data.sub,
          token: `${uuid()}`
        })
        return redirect(`/organizations/${organizationId}/modules/${created.id}`)
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

  const modules = await pb
    .collection(Collections.Modules)
    .getFullList<ModulesResponse<{ module_params_via_module: ModuleParamsResponse[] }>>(
      {
        filter: `organization.id = "${organizationId}"`,
        expand: 'module_params_via_module',
        sort: '+created',
      },
    )

  const organization = await pb
    .collection(Collections.Organizations)
    .getOne(organizationId)

  return json({
    organization,
    modules,
  })
}

export const columns: ColumnDef<ModulesResponse<{ module_params_via_module: ModuleParamsResponse[] }>>[] = [
  {
    id: 'expander',
    header: () => null,
    cell: ({ row }) => {
      return (
        <Button
          size="icon"
          variant="ghost"
          onClick={row.getToggleExpandedHandler()}
          disabled={!row.getCanExpand()}
        >
          {row.getIsExpanded() ? <Icons.down className="mx-auto h-4 w-4" /> :
            <Icons.right className="mx-auto h-4 w-4" />}
        </Button>
      )
    },
  },
  {
    accessorKey: 'session',
    header: 'Session',
    cell: ({ row }) => {
      if (!row.original.session) {
        return null
      }
      return <EjectModule module={row.original} />
    },
  },
  {
    accessorKey: 'code',
    header: 'Code',
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    id: 'actions',
    cell: function ActionsComponent({ row }) {
      const module = row.original
      const refreshFetcher = useFetcher()
      const deleteFetcher = useFetcher()
      const [modalDeleteOpen, setModalDeleteOpen] = useState(false)

      const handleOpenDelete = () => {
        setModalDeleteOpen(true)
      }

      const handleRefreshToken = () => {
        refreshFetcher.submit({
            _action: 'refresh',
          },
          {
            action: `/organizations/${module.organization}/modules/${module.id}`,
            method: 'POST',
          },
        )
      }

      const handleCopyToken = async () => {
        try {
          await navigator.clipboard.writeText(module.token)
        } catch (err) {
          console.error('Failed to copy: ', err)
        }
      }

      return (
        <>
          <Dialog open={modalDeleteOpen} onOpenChange={setModalDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Do you want to delete [{row.original.code}] {row.original.name} module ?</DialogTitle>
                <DialogDescription />
                <DialogFooter>
                  <deleteFetcher.Form
                    method="POST"
                    action={`/organizations/${row.original.organization}/modules/${row.original.id}`}
                  >
                    <Button variant="destructive" type="submit" name="_action" value="delete">Delete</Button>
                  </deleteFetcher.Form>
                </DialogFooter>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <Icons.more className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to={`/organizations/${module.organization}/modules/${module.id}`}
                      className="flex gap-2 cursor-pointer">
                  <Icons.edit className="h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex gap-2 cursor-pointer"
                onClick={handleCopyToken}
              >
                <Icons.token className="h-4 w-4" />
                Copy token
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex gap-2 cursor-pointer"
                onClick={handleRefreshToken}
              >
                <Icons.refresh className="h-4 w-4" />
                Refresh token
                <Icons.loader
                  className={cn('animate-spin', { hidden: refreshFetcher.state === 'idle' })}
                />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex gap-2 cursor-pointer"
                onClick={handleOpenDelete}
              >
                <Icons.delete className="h-4 w-4" />
                Delete
                <Icons.loader
                  className={cn('animate-spin', { hidden: deleteFetcher.state === 'idle' })}
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )
    },
  },
]

export default function OrganizationIdScriptLayout() {
  const { modules, organization } = useLoaderData<typeof loader>()
  const revalidator = useRevalidator();

  useEffect(() => {
    pb?.collection(Collections.Modules).subscribe(
      '*',
      () => {
        revalidator.revalidate();
      },
      {
        filter: `organization.id = "${organization.id}"`
      }
    );

    return () => {
      pb?.collection(Collections.Modules).unsubscribe('*')
    }
  }, [organization.id, revalidator]);

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex justify-between">
        <h1 className="font-heading text-xl">
          Modules
        </h1>
        <Link
          to={`/organizations/${organization.id}/modules/new`}
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
        <DataTable
          columns={columns}
          data={modules as ModulesResponse<{ module_params_via_module: ModuleParamsResponse[] }>[]}
        />
      </ScrollArea>
    </div>
  )
}


