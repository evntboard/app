"use client"

import * as React from "react";
import {ColumnDef} from "@tanstack/react-table";
import {ProcessRequest} from "@prisma/client";

import {DataTable} from "@/components/data-table";
import {differenceInMilliseconds, format} from "date-fns";
import {Icons} from "@/components/icons";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {Button} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {Editor} from "@/components/editor";

const columnsLogs: ColumnDef<ProcessRequest>[] = [
  {
    accessorKey: "notification",
    header: "Type",
    cell: ({row: {original}}) => {
      if (original.notification) {
        return 'notify'
      }
      return 'request'
    }
  },
  {
    accessorKey: "module.code",
    header: "Module code",
  },
  {
    accessorKey: "module.name",
    header: "Module name",
  },
  {
    accessorKey: "method",
    header: "Method",
  },
  {
    accessorKey: "params",
    header: "Params",
    cell: ({row: {original}}) => (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary" size="icon">
            <Icons.payload className="mx-auto h-4 w-4"/>
          </Button>
        </DialogTrigger>
        <DialogContent className="h-full w-full max-w-[80%] max-h-[80%]">
          <DialogHeader>
            <DialogTitle>Log</DialogTitle>
            <DialogDescription>
            </DialogDescription>
            <Editor
              fullscreen={false}
              options={{
                readOnly: true
              }}
              height='100%'
              language="json"
              value={JSON.stringify(original?.params, null, 2)}
            />
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  },
  {
    id: "process",
    header: "Info",
    cell: ({row: {original}}) => {
      if (!original?.requestDate) {
        return null
      }

      const startDate = format(original?.requestDate, 'dd/MM/yyyy HH:mm:ss.SSSS')

      if (original.notification) {
        return (
          <div className="flex items-center gap-2 justify-between">
            <p>{startDate}</p>
          </div>
        )
      }

      if (!original?.responseDate) {
        return (
          <div className="flex items-center gap-2 justify-between">
            <p>{startDate}</p>
            <Icons.spinner className="h-4 w-4 animate-spin"/>
          </div>
        )
      }

      return (
        <div className="flex items-center gap-2 justify-between">
          <p>{startDate} + {differenceInMilliseconds(original?.responseDate, original?.requestDate)} ms</p>
          {original?.error && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="icon" variant="destructive"><Icons.error className="mx-auto h-5 w-5"/></Button>
              </DialogTrigger>
              <DialogContent className="h-full w-full max-w-[80%] max-h-[80%]">
                <DialogHeader>
                  <DialogTitle>Error</DialogTitle>
                  <DialogDescription>
                  </DialogDescription>
                  <Editor
                    fullscreen={false}
                    options={{
                      readOnly: true
                    }}
                    height='100%'
                    language="json"
                    value={JSON.stringify(original?.error, null, 2)}
                  />
                </DialogHeader>
              </DialogContent>
            </Dialog>
          )}
          {original?.result && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="icon" variant="secondary"><Icons.check className="mx-auto h-5 w-5"/></Button>
              </DialogTrigger>
              <DialogContent className="h-full w-full max-w-[80%] max-h-[80%]">
                <DialogHeader>
                  <DialogTitle>Result</DialogTitle>
                  <DialogDescription>
                  </DialogDescription>
                  <Editor
                    fullscreen={false}
                    options={{
                      readOnly: true
                    }}
                    height='100%'
                    language="json"
                    value={JSON.stringify(original?.result, null, 2)}
                  />
                </DialogHeader>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )
    }
  },
]

type Props = {
  data: ProcessRequest[],
  organizationId: string,
  eventId: string
}

export const RequestsTable = (props: Props) => {
  return (
    <DataTable
      getRowId={((originalRow) => originalRow.id)}
      columns={columnsLogs}
      data={props.data}
    />
  )
}