import { ActionFunctionArgs, json, redirect } from '@remix-run/node'
import { Link, useFetcher, useLoaderData, useLocation, useSearchParams } from '@remix-run/react'
import { ColumnDef } from '@tanstack/react-table'
import { addMinutes, format, parseISO } from 'date-fns'
import { MoreHorizontal } from 'lucide-react'
import { ClientResponseError } from 'pocketbase'
import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { createSession, getPocketbase, getUser } from '~/utils/pb.server'
import { Collections, EventsResponse } from '~/types/pocketbase'
import { DataTable } from '~/components/data-table'
import { cn } from '~/utils/cn'
import { Button } from '~/components/ui/button'
import { Icons } from '~/components/icons'
import { AddEvent } from '~/components/events/add-event'
import { eventCreateFormSchema } from '~/validation/event'
import { Editor } from '~/components/editor'
import { ScrollArea } from '~/components/ui/scroll-area'
import { customEventCreateFormSchema, customEventModalCreateFormSchema } from '~/validation/custom-event'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { FormEventsSearch } from '~/components/events/form-events-search'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '~/components/ui/pagination'

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
      const result = eventCreateFormSchema.safeParse(formValues)
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
        return await pb.collection(Collections.Events).create({
          organization: organizationId,
          name: result.data.name,
          payload: JSON.parse(result.data.payload),
          emitted_at: new Date(),
          emitter_code: 'WEB',
          emitter_name: 'WEB',
        })
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
      break
    }
    case 'save': {
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
          organization: organizationId,
          name: result.data.name,
          description: result.data.description,
          payload: JSON.parse(result.data.payload),
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
      break
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


  const currentDate = new Date()

  const url = new URL(args.request.url)

  const page = url.searchParams.get('page')
  const name = url.searchParams.get('name')
  const emitterCode = url.searchParams.get('emitterCode')
  const emitterName = url.searchParams.get('emitterName')
  const emittedAtStart = url.searchParams.get('emittedAtStart') ?? ''
  const emittedAtEnd = url.searchParams.get('emittedAtEnd') ?? ''

  let realEmittedAtStart = addMinutes(currentDate, -30)
  let realEmittedAtEnd = addMinutes(currentDate, 30)

  if (emittedAtStart !== '') {
    realEmittedAtStart = parseISO(emittedAtStart)
  }

  if (emittedAtEnd !== '') {
    realEmittedAtEnd = parseISO(emittedAtEnd)
  }

  let filter = `organization.id = "${organizationId}"`

  if (name) {
    filter = `${filter} && name ~ "${name}"`
  }

  if (emitterCode) {
    filter = `${filter} && emitter_code ~ "${emitterCode}"`
  }

  if (emitterName) {
    filter = `${filter} && emitter_name ~ "${emitterName}"`
  }

  // it now use ISO ...  => Y-m-d H:i:s.uZ
  filter = `${filter} && emitted_at >= "${realEmittedAtStart.toISOString().replace('T', ' ')}" && emitted_at <= "${realEmittedAtEnd.toISOString().replace('T', ' ')}"`

  const events = await pb
    .collection(Collections.Events)
    .getList(
      parseInt(page ?? '1', 10),
      10,
      {
        filter,
        sort: '-created',
      },
    )

  const organization = await pb
    .collection(Collections.Organizations)
    .getOne(organizationId)

  return json({
    organization,
    events,
    currentDate
  })
}

const columns: ColumnDef<EventsResponse>[] = [
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
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'emitter_code',
    header: 'Emitter code',
  },
  {
    accessorKey: 'emitter_name',
    header: 'Emitter name',
  },
  {
    accessorKey: 'emitted_at',
    header: 'Emitted at',
    cell: ({ row: { original: event } }) => {
      if (!event?.created) {
        return null
      }

      return format(event?.created, 'dd/MM/yyyy HH:mm:ss.SSSS')
    },
  },
  {
    id: 'actions',
    cell: function ActionComponent({ row }) {
      const [open, setOpen] = useState<boolean>(false)
      const event = row.original

      const fetcher = useFetcher<{
        errors?: Record<string, { type: string, message: string }>
      }>()

      const resolver = zodResolver(customEventModalCreateFormSchema)
      const form = useForm<z.infer<typeof customEventModalCreateFormSchema>>({
        resolver,
        defaultValues: {
          description: `Event: ${event.name}`,
        },
      })

      const onSubmit = (data: z.infer<typeof customEventModalCreateFormSchema>) => {
        fetcher.submit(
          {
            name: event.name,
            description: data.description,
            payload: JSON.stringify(event.payload),
            _action: 'save',
          },
          {
            action: `/organizations/${event.organization}/events`,
            method: 'POST',
            encType: 'application/json',
          },
        )
      }

      useEffect(() => {
        if (fetcher.data?.errors) {
          Object.entries(fetcher.data?.errors)
            .forEach(([name, error]) => {
              form.setError(name as never, { message: error.message })
            })
        }
      }, [fetcher.data, form])

      return (
        <>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <Form {...form}>
                <fetcher.Form
                  className="flex flex-col gap-2 px-1"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <DialogHeader>
                    <DialogTitle>Save {event.name} as custom event</DialogTitle>
                    <DialogDescription>
                    </DialogDescription>
                  </DialogHeader>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {fetcher.data?.errors?.global && (
                    <p className={cn('text-sm font-medium text-destructive')}>
                      {fetcher.data?.errors?.global?.message}
                    </p>
                  )}
                  <DialogFooter>
                    <Button type="submit" className="flex gap-2">
                      Save
                      <Icons.loader
                        className={cn('animate-spin', { hidden: fetcher.state === 'idle' })}
                      />
                    </Button>
                  </DialogFooter>
                </fetcher.Form>
              </Form>
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
              <DropdownMenuItem asChild className="flex gap-2 cursor-pointer">
                <Link to={`/organizations/${event.organization}/events/${event.id}`}>
                  <Icons.view className="h-4 w-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex gap-2 cursor-pointer"
                onClick={() => setOpen(true)}
              >
                <Icons.save className="h-4 w-4" />
                Save
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )
    },
  },
]

export default function OrganizationIdEvents() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { events, organization, currentDate } = useLoaderData<typeof loader>()


  const getUrlFromPage = (page: number) => {
    const params = new URLSearchParams(location.search)
    params.set('page', `${page}`)
    return `${location.pathname}?${params.toString()}`
  }

  const defaultValues = useMemo(() => {
    const name = searchParams.get('name') ?? ''
    const emitterCode = searchParams.get('emitterCode') ?? ''
    const emitterName = searchParams.get('emitterName') ?? ''
    const emittedAtStart = searchParams.get('emittedAtStart') ?? ''
    const emittedAtEnd = searchParams.get('emittedAtEnd') ?? ''

    const realCurrentDate = parseISO(currentDate)

    let realEmittedAtStart = addMinutes(realCurrentDate, -30)
    let realEmittedAtEnd = addMinutes(realCurrentDate, 30)

    if (emittedAtStart !== '') {
      realEmittedAtStart = parseISO(emittedAtStart)
    }

    if (emittedAtEnd !== '') {
      realEmittedAtEnd = parseISO(emittedAtEnd)
    }

    return {
      name,
      emitterCode,
      emitterName,
      emittedAtStart: realEmittedAtStart,
      emittedAtEnd: realEmittedAtEnd,
    }
  }, [currentDate, searchParams])

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex justify-between">
        <h1 className="font-heading text-xl">
          Events
        </h1>
        <AddEvent organization={organization} />
      </div>
      <FormEventsSearch
        defaultValues={defaultValues}
        organizationId={organization.id}
      />
      <ScrollArea className="py-4 grow">
        <DataTable
          columns={columns}
          data={(events?.items ?? []) as EventsResponse[]}
          renderSubComponent={({ row: { original } }) => {
            return (
              <>
                <p>Payload</p>
                <Editor
                  options={{
                    readOnly: true,
                  }}
                  height={350}
                  language="json"
                  value={JSON.stringify(original?.payload, null, 2)}
                />
              </>
            )
          }}
          getRowId={((originalRow) => originalRow.id)}
          getRowCanExpand={({ original }) => !!original.payload}
        />
      </ScrollArea>
      <Pagination>
        <PaginationContent>
          <PaginationItem className={events.page <= 1 ? 'pointer-events-none opacity-50' : undefined}>
            <PaginationPrevious href={getUrlFromPage(events.page - 1)} />
          </PaginationItem>
          {
            events.totalPages === 0 && (
              <PaginationItem className="pointer-events-none opacity-50">
                <PaginationLink>
                  1
                </PaginationLink>
              </PaginationItem>
            )
          }
          {
            events.totalPages > 0 && (
              <PaginationItem className="pointer-events-none">
                <PaginationLink>
                  {events.page} / {events.totalPages}
                </PaginationLink>
              </PaginationItem>
            )
          }
          <PaginationItem
            className={events.page >= events.totalPages ? 'pointer-events-none opacity-50' : undefined}>
            <PaginationNext href={getUrlFromPage(events.page + 1)} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}


