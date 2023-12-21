"use client"

import * as React from "react";
import {useEffect, useState} from "react";
import Link from "next/link";
import {format, parseISO} from "date-fns";
import {ColumnDef} from "@tanstack/react-table"
import {useParams} from "next/navigation";
import { Event as EvntBoardEvent} from '@prisma/client'

import {cn, jsonParse} from "@/lib/utils";
import {DataTable} from "@/components/data-table";
import {Button, buttonVariants} from "@/components/ui/button";
import {Icons} from "@/components/icons";
import {Editor} from "@/components/editor";
import {SaveEvent} from "./save-event";

const columns: ColumnDef<EvntBoardEvent>[] = [
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
    accessorKey: "emitterCode",
    header: "Emitter code",
  },
  {
    accessorKey: "emitterName",
    header: "Emitter name",
  },
  {
    accessorKey: "emittedAt",
    header: "Emitted at",
    cell: ({ row: { original: event }}) => {

      if (!event?.emittedAt) {
        return null
      }

      return  format(event?.emittedAt, 'dd/MM/yyyy HH:mm:ss.SSSS')
    }
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    id: "action",
    header: "Action",
    cell: ({row: {original: event}}) => <ActionComponent event={event} />
  },
]

const ActionComponent = ({ event }: { event: EvntBoardEvent}) => {
  const { organizationId } = useParams()

  return (
    <div className="flex gap-2">
      <Link
        href={`/organization/${organizationId}/event/${event.id}`}
        className={cn(
          buttonVariants({size: "icon", variant: "secondary"}),
        )}
      >
        <Icons.search className="h-5 w-5"/>
      </Link>
      <SaveEvent event={event}/>
    </div>
  )
}

export const EventsTable = (props: { events: EvntBoardEvent[], organizationId: string }) => {
  const [events, setEvents] = useState(props.events)

  useEffect(() => {
    const evtSource = new EventSource(`/api/organization/${props.organizationId}/event/sse`, {
      withCredentials: true,
    });

    evtSource.addEventListener('message', ({data: raw}) => {
      try {
        const data = jsonParse(raw)
        setEvents((old) => [
          {
            ...data,
            emittedAt: parseISO(data.emittedAt)
          },
          ...old
        ])
      } catch (e) {
        console.error(`Invalid message: ${raw}`)
      }
    })

    return () => {
      evtSource.close()
    }
  }, [props.organizationId])

  return (
    <div className="rounded-md border overflow-auto" style={{height: 'calc(100vh - 200px)'}}>
      <DataTable
        singleExpand
        renderSubComponent={({row: {original}}) => {
          return (
            <>
              <p>Payload</p>
              <Editor
                options={{
                  readOnly: true
                }}
                height={350}
                language="json"
                value={JSON.stringify(original?.payload, null, 2)}
              />
            </>
          )
        }}
        getRowId={((originalRow) => originalRow.id)}
        getRowCanExpand={({original}) => !!original.payload}
        columns={columns}
        data={events}
        defaultSorting={[
          {
            "id": "emittedAt",
            "desc": true
          }
        ]}
      />
    </div>
  )
}