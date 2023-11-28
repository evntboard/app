"use client"

import {ColumnDef} from "@tanstack/react-table"
import Link from "next/link";
import * as React from "react";
import {useState} from "react";

import {cn} from "@/lib/utils";
import {Button, buttonVariants} from "@/components/ui/button";
import {Icons} from "@/components/icons";
import {DataTable} from "@/components/data-table";
import {DeleteModule} from "./delete-module";
import {TokenModule} from "./token-module";

type Props = {
  organizationId: string
  entities: Module[]
}

type ModuleParam = {
  id: string
  key: string
  value: string
}

type Module = {
  id: string
  organizationId: string
  code: string
  name: string
  params: Array<ModuleParam>
}

const columns: ColumnDef<Module>[] = [
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
    accessorKey: "code",
    header: "Code",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    id: "action",
    header: "",
    cell: ({row: {original}}) => {
      return (
        <div className="flex gap-2 justify-end">
          <Link
            href={`/organization/${original.organizationId}/module/${original.id}`}
            className={cn(
              buttonVariants({variant: "ghost"}),
            )}
          >
            <>
              <Icons.create className="mr-2 h-4 w-4"/>
              Edit
            </>
          </Link>
          <TokenModule moduleId={original.id}/>
          <DeleteModule moduleId={original.id}/>
        </div>
      )
    }
  }
]

const columnsParams: ColumnDef<ModuleParam>[] = [
  {
    accessorKey: "id",
    header: "Id",
  },
  {
    accessorKey: "key",
    header: "Key",
  },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({row: {original}}) => <HideValue value={original.value}/>
  }
]

const HideValue = (props: { value: string }) => {
  const [show, setShow] = useState<boolean>(false)

  const handleOnClick = () => {
    setShow((s) => !s)
  }

  return (
    <div className="flex flex-1 items-center justify-between">
      <p className="overflow-auto grow-1 w-[300px]">
        {show ? props.value : '******'}
      </p>
      <Button size="icon" onClick={handleOnClick}>{show ? <Icons.hide/> : <Icons.show/>}</Button>
    </div>
  )
}

const subComponent = ({row: {original}}: any) => {
  return (
    <>
      <h1 className="font-heading text-lg">
        Params
      </h1>
      <DataTable
        columns={columnsParams}
        data={original.params}
      />
    </>
  )
}

export const ModuleTable = (props: Props) => {
  return (
    <div className="rounded-md border overflow-auto" style={{height: 'calc(100vh - 200px)'}}>
      <DataTable
        columns={columns}
        data={props.entities as Module[]}
        getRowId={((originalRow) => originalRow.id)}
        singleExpand
        getRowCanExpand={({original}) => original.params.length > 0}
        renderSubComponent={subComponent}
      />
    </div>
  )
}