"use client"

import * as React from "react";
import {ReactElement, useEffect, useState} from "react";
import {differenceInMilliseconds, format, parseISO} from "date-fns";
import {ColumnDef} from "@tanstack/react-table";

import {jsonParse} from "@/lib/utils";
import {TriggerWithProcessData} from "@/types/trigger-process";
import {Button} from "@/components/ui/button";
import {Icons} from "@/components/icons";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {DataTable} from "@/components/data-table";
import {Badge} from "@/components/ui/badge";
import {Editor} from "@/components/editor";

const columnsProcess: ColumnDef<TriggerWithProcessData>[] = [
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
    accessorKey: "exec",
    header: "Reaction executed",
    cell: ({row: {original}}) => {
      if (original?.process?.exec === "true") {
        return (<Badge>YES</Badge>)
      }
      return (<Badge variant="destructive">NO</Badge>)
    }
  },
  {
    id: "process",
    header: "Info",
    cell: ({row: {original}}) => {
      if (!original?.process?.start) {
        return null
      }

      const parsedStart = parseISO(original.process.start)
      const startDate = format(parsedStart, 'dd/MM/yyyy HH:mm:ss.SSSS')

      if (!original?.process?.end) {
        return (
          <div className="flex items-center gap-2 justify-between">
            <p>{startDate}</p>
            <Icons.spinner className="h-4 w-4 animate-spin"/>
          </div>
        )
      }

      const parsedEnd = parseISO(original.process.end)

      return (
        <div className="flex items-center gap-2 justify-between">
          <p>{startDate} + {differenceInMilliseconds(parsedEnd, parsedStart)} ms</p>
          {original?.process?.error && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="destructive"><Icons.error className="mx-auto h-5 w-5"/></Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-lg">
                {original.process.error}
              </TooltipContent>
            </Tooltip>

          )}
        </div>
      )
    }
  },
]

const subComponent = ({row: {original}}: any) => {
  let component: null | ReactElement
  try {
    let value = JSON.stringify(original.logs.map((data: string) => JSON.parse(data)), null, 2)
    component = (
      <Editor
        options={{
          readOnly: true
        }}
        height={400}
        language="json"
        value={value}
      />
    )
  } catch (e) {
    component = (
      <div className="w-[400px] h-[400px] overflow-auto">
        {original.logs.join('\n')}
      </div>
    )
  }

  return (
    <>
      <h1 className="font-heading text-xl">
        Logs
      </h1>
      {component}
    </>
  )
}

type Props = {
  data: TriggerWithProcessData[],
  organizationId: string,
  eventId: string
}

export const ProcessEvent = (props: Props) => {
  const [events, setEvents] = useState(props.data)

  useEffect(() => {
    const evtSource = new EventSource(`/api/organization/${props.organizationId}/realtime-event/${props.eventId}/sse`, {
      withCredentials: true,
    });

    evtSource.addEventListener('message', ({data: raw}) => {
      try {
        const data = jsonParse(raw)
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
      getRowId={((originalRow) => originalRow.trigger.id)}
      getRowCanExpand={({original}) => original.logs.length > 0}
      renderSubComponent={subComponent}
      columns={columnsProcess}
      data={events}
    />
  )
}