"use client"

import * as React from "react";
import {useEffect, useState} from "react";
import {differenceInMilliseconds, format,} from "date-fns";
import {ColumnDef} from "@tanstack/react-table";
import {Process} from "@prisma/client";

import {Button} from "@/components/ui/button";
import {Icons} from "@/components/icons";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {DataTable} from "@/components/data-table";
import {Badge} from "@/components/ui/badge";
import {LogsTable} from "@/app/(private)/(organization)/organization/[organizationId]/event/[eventId]/logs-table";
import {
  RequestsTable
} from "@/app/(private)/(organization)/organization/[organizationId]/event/[eventId]/requests-table";
import {useParams} from "next/navigation";

const columnsProcess: ColumnDef<Process>[] = [
  {
    id: 'expander',
    header: () => null,
    cell: ({row}) => {
      return (
        <Button
          size="icon"
          variant="ghost"
          onClick={row.getToggleExpandedHandler()}
          disabled={!row.getCanExpand()}
        >
          {row.getIsExpanded() ? <Icons.down className="mx-auto h-4 w-4"/> : <Icons.right className="mx-auto h-4 w-4"/>}
        </Button>
      )
    },
  },
  {
    accessorKey: "trigger.name",
    header: "Trigger",
  },
  {
    accessorKey: "executed",
    header: "Reaction executed",
    cell: ({row: {original}}) => {
      if (original?.executed) {
        return (<Badge>YES</Badge>)
      }
      return (<Badge variant="destructive">NO</Badge>)
    }
  },
  {
    id: "process",
    header: "Info",
    cell: ({row: {original}}) => {
      if (!original?.startDate) {
        return null
      }

      const startDate = format(original?.startDate, 'dd/MM/yyyy HH:mm:ss.SSSS')

      if (!original?.endDate) {
        return (
          <div className="flex items-center gap-2 justify-between">
            <p>{startDate}</p>
            <Icons.spinner className="h-4 w-4 animate-spin"/>
          </div>
        )
      }

      return (
        <div className="flex items-center gap-2 justify-between">
          <p>{startDate} + {differenceInMilliseconds(original?.endDate, original?.startDate)} ms</p>
          {original?.error && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="destructive"><Icons.error className="mx-auto h-5 w-5"/></Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-lg">
                {original.error}
              </TooltipContent>
            </Tooltip>

          )}
        </div>
      )
    }
  },
]

const SubComponent = ({ process }: { process: Process }) => {
  const {organizationId, eventId} = useParams()

  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-xl">
        Logs
      </h1>
      <LogsTable
        organizationId={organizationId as string}
        eventId={eventId as string}
        // @ts-ignore
        data={process.logs}
      />
      <h1 className="font-heading text-xl">
        Requests
      </h1>
      <RequestsTable
        organizationId={organizationId as string}
        eventId={eventId as string}
        // @ts-ignore
        data={process.requests}
      />
    </div>
  )
}

type Props = {
  data: Process[],
  organizationId: string,
  eventId: string
}

export const ProcessEvent = (props: Props) => {
  const [events, setEvents] = useState(props.data)

  useEffect(() => {
    const evtSource = new EventSource(`/api/organization/${props.organizationId}/event/${props.eventId}/sse`, {
      withCredentials: true,
    });

    evtSource.addEventListener('message', ({data: raw}) => {
      try {
        const data = JSON.parse(raw)
        setEvents(data)
      } catch (e) {
        console.error(`Invalid message: ${raw}`)
      }
    })

    return () => {
      evtSource.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.organizationId])

  return (
    <DataTable
      singleExpand
      getRowId={((originalRow) => originalRow.id)}
      getRowCanExpand={({original}) => {
        // TODO REMOVE @ts-ignore
        // @ts-ignore
        return original?.logs?.length > 0 || original?.requests?.length
      }}
      renderSubComponent={({ row: {original }}: any) => <SubComponent process={original} />}
      columns={columnsProcess}
      data={events}
    />
  )
}