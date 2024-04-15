import { ActionFunctionArgs, json } from '@remix-run/node'
import { Link, useLoaderData, useParams } from '@remix-run/react'

import { createSession, getPocketbase, getUser } from '~/utils/pb.server'
import {
  Collections,
  EventProcessesResponse,
  EventProcessLogsResponse,
  EventProcessRequestsResponse,
  ModulesResponse,
  TriggersResponse,
} from '~/types/pocketbase'
import { cn } from '~/utils/cn'
import { Button, buttonVariants } from '~/components/ui/button'
import { Icons } from '~/components/icons'
import { DataTable } from '~/components/data-table'
import { ColumnDef, Row } from '@tanstack/react-table'
import { differenceInMilliseconds, format } from 'date-fns'
import { LogsTable } from '~/components/process/logs-table'
import { RequestsTable } from '~/components/process/requests-table'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { Badge } from '~/components/ui/badge'

type PROCESS = EventProcessesResponse<{
  trigger: TriggersResponse,
  event_process_requests_via_event_process: EventProcessRequestsResponse<{ module: ModulesResponse }>[],
  event_process_logs_via_event_process: EventProcessLogsResponse[],
}>

export async function loader(args: ActionFunctionArgs) {
  const organizationId = args.params?.organizationId
  const eventId = args.params?.eventId

  if (!organizationId || !eventId) {
    throw new Error('404')
  }

  const pb = getPocketbase(args.request)
  const user = getUser(pb)

  if (!user) {
    return createSession('/login', pb)
  }

  const event = await pb
    .collection(Collections.Events)
    .getOne(
      eventId,
      {
        filter: `organization.id = "${organizationId}"`,
      },
    )

  const processes = await pb
    .collection(Collections.EventProcesses)
    .getFullList<PROCESS>(
      {
        filter: `event.id = "${eventId}"`,
        sort: '+created',
        expand: [
          'trigger',
          'event_process_requests_via_event_process',
          'event_process_requests_via_event_process.module',
          'event_process_logs_via_event_process',
        ].join(','),
      },
    )

  const organization = await pb
    .collection(Collections.Organizations)
    .getOne(organizationId)

  return json({
    organization,
    event,
    processes,
  })
}

const columns: ColumnDef<PROCESS>[] = [
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
    accessorKey: 'expand.trigger.name',
    header: 'Trigger',
  },
  {
    accessorKey: 'executed',
    header: 'Reaction executed',
    cell: ({ row: { original } }) => {
      if (original?.executed) {
        return (<Badge>YES</Badge>)
      }
      return (<Badge variant="destructive">NO</Badge>)
    },
  },
  {
    id: 'process',
    header: 'Info',
    cell: ({ row: { original } }) => {
      if (!original?.start_at) {
        return null
      }

      const startDate = format(original?.start_at, 'dd/MM/yyyy HH:mm:ss.SSSS')

      if (!original?.end_at) {
        return (
          <div className="flex items-center gap-2 justify-between">
            <p>{startDate}</p>
            <Icons.spinner className="h-4 w-4 animate-spin" />
          </div>
        )
      }

      return (
        <div className="flex items-center gap-2 justify-between">
          <p>{startDate} + {differenceInMilliseconds(original?.end_at, original?.start_at)} ms</p>
          {original?.error && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="destructive"><Icons.error className="mx-auto h-4 w-4" /></Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-lg">
                {original.error}
              </TooltipContent>
            </Tooltip>

          )}
        </div>
      )
    },
  },
]

const SubComponent = (props: { row: Row<PROCESS> }) => {
  const { organizationId, eventId } = useParams()

  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-xl">
        Logs
      </h1>
      <LogsTable
        organizationId={organizationId!}
        eventId={eventId!}
        data={props.row.original?.expand?.event_process_logs_via_event_process ?? []}
      />
      <h1 className="font-heading text-xl">
        Requests
      </h1>
      <RequestsTable
        organizationId={organizationId!}
        eventId={eventId!}
        data={props.row.original?.expand?.event_process_requests_via_event_process ?? []}
      />
    </div>
  )
}

export default function OrganizationIdScriptLayout() {
  const { event, processes } = useLoaderData<typeof loader>()

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex justify-between">
        <h1 className="font-heading text-xl">
          Event {event.name}
        </h1>
        <Link
          to={`/organizations/${event.organization}/events`}
          className={cn(
            'flex gap-2',
            buttonVariants({ variant: 'default' }),
          )}
        >
          <Icons.back className="h-4 w-4" />
          Back
        </Link>
      </div>

      <DataTable
        getRowId={((originalRow) => originalRow.id)}
        getRowCanExpand={({ original }) => {
          const logsCount = original?.expand?.event_process_logs_via_event_process?.length ?? 0
          const requestsCount = original?.expand?.event_process_requests_via_event_process?.length ?? 0
          return logsCount + requestsCount > 0
        }}
        renderSubComponent={({ row }) => <SubComponent row={row} />}
        columns={columns}
        data={processes as PROCESS[]}
      />
    </div>
  )
}


