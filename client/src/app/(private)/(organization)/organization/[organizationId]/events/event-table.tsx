"use client"

import * as React from "react";
import {ColumnDef} from "@tanstack/react-table"
import {Event} from "@prisma/client"

import {DataTable} from "@/components/data-table";
import {Button, buttonVariants} from "@/components/ui/button";
import {Icons} from "@/components/icons";
import {Editor} from "@/components/editor";
import {DeleteEvent} from "@/app/(private)/(organization)/organization/[organizationId]/events/delete-event";
import {useParams} from "next/navigation";
import Link from "next/link";
import {cn} from "@/lib/utils";

const columns: ColumnDef<Event>[] = [
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
    accessorKey: "name",
    header: "Name",
  },
  {
    id: "action",
    header: "Action",
    cell: ({row: {original: event}}) => {
      return (
        <div className="flex gap-2 justify-end">
          <Link
            href={`/organization/${event.organizationId}/event/${event.id}`}
            className={cn(
              buttonVariants({variant: "ghost"}),
            )}
          >
            <>
              <Icons.create className="mr-2 h-4 w-4"/>
              Edit
            </>
          </Link>
          <DeleteEvent event={event}/>
        </div>
      )
    }
  },
]

export const EventTable = (props: { events: Event[], organizationId: string }) => {
  return (
    <div className="rounded-md border overflow-auto" style={{height: 'calc(100vh - 200px)'}}>
      <DataTable
        singleExpand
        renderSubComponent={({row: {original}}) => {
          return (
            <>
              <p className="text">Payload</p>
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
        data={props.events}
      />
    </div>
  )
}