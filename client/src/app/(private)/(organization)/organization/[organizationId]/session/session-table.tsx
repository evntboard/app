"use client"

import * as React from "react";
import {ColumnDef} from "@tanstack/react-table";

import {DataTable} from "@/components/data-table";

import {EjectModule} from "./eject-module";

const columnsProcess: ColumnDef<any>[] = [
  {
    accessorKey: "module.code",
    header: "Code",
  },
  {
    accessorKey: "module.name",
    header: "Name",
  },
  {
    id: "action",
    header: "",
    cell: ({row: {original}}) => <EjectModule session={original} />
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