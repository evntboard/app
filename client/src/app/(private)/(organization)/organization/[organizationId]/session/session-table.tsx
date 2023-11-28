"use client"

import {ColumnDef} from "@tanstack/react-table";

import {DataTable} from "@/components/data-table";
import * as React from "react";
import {Button} from "@/components/ui/button";

const columnsProcess: ColumnDef<any>[] = [
  {
    accessorKey: "sessionId",
    header: "Session",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "code",
    header: "Code",
  },
  {
    id: "action",
    header: "",
    cell: ({ row: { original }}) => {
      const handleOnClick = () => {
        console.log("EJECT", original)
      }

      return (
        <Button
          variant="destructive"
          onClick={handleOnClick}
        >
          Eject
        </Button>
      )
    }
  }
]

type Props = {
  data: any[],
  organizationId: string,
}

export const SessionTable = (props: Props) => {

  return (
    <DataTable
      singleExpand
      columns={columnsProcess}
      data={props.data}
    />
  )
}