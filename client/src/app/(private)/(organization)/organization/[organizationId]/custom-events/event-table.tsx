"use client"

import * as React from "react";
import {ColumnDef} from "@tanstack/react-table"
import {CustomEvent} from "@prisma/client"
import Link from "next/link"

import {DataTable} from "@/components/data-table";
import {Button, buttonVariants} from "@/components/ui/button";
import {Icons} from "@/components/icons";
import {Editor} from "@/components/editor";
import {DeleteEvent} from "@/app/(private)/(organization)/organization/[organizationId]/custom-events/delete-event";
import {cn} from "@/lib/utils";

const columns: ColumnDef<CustomEvent>[] = [
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
    accessorKey: "description",
    header: "Description",
  },
  {
    id: "action",
    header: "Action",
    cell: ({row: {original: event}}) => {
      return (
        <div className="flex gap-2 justify-end">
          <Link
            href={`/organization/${event.organizationId}/custom-event/${event.id}`}
            className={cn(
              buttonVariants({variant: "secondary"}),
            )}
          >
            <>
              <Icons.edit className="mr-2 h-4 w-4"/>
              Edit
            </>
          </Link>
          <DeleteEvent event={event}/>
        </div>
      )
    }
  },
]

export const EventTable = (props: { events: CustomEvent[], organizationId: string }) => {
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