"use client"

import * as React from "react";
import {useEffect, useState} from "react";
import {ColumnDef} from "@tanstack/react-table"

import {DataTable} from "@/components/data-table";
import {Icons} from "@/components/icons";
import Link from "next/link";
import {cn} from "@/lib/utils";
import {buttonVariants} from "@/components/ui/button";
import {useParams} from "next/navigation";
import {DeleteStorage} from "./delete-storage";

type Props = {
  entities: { key: string, value: any, type: string }[],
  organizationId: string,
}

const columns: ColumnDef<{ key: string, value: any }>[] = [
  {
    accessorKey: "key",
    header: "key",
    cell: ({row: {original: storage}}) => {
      return (
        <div className="flex items-center gap-2">
          {
            storage.key.startsWith('tmp:') ?
              <Icons.storageTemp className="h-4 w-4"/> :
              <Icons.storagePersist className="h-4 w-4"/>
          }
          <p>{storage.key}</p>
        </div>
      )
    }
  },
  {
    accessorKey: "value",
    header: "value",
  },
  {
    id: "action",
    header: "",
    cell: ({row: {original}}) => {
      return (
        <div className="flex gap-2 justify-end">
          <OrgaStorageLink storage={original}/>
          <DeleteStorage storageKey={original.key}/>
        </div>
      )
    }
  }
]

const OrgaStorageLink = ({storage}: { storage: { key: string, value: any } }) => {
  const {organizationId} = useParams()

  return (
    <Link
      href={`/organization/${organizationId}/storage/${storage.key}`}
      className={cn(
        buttonVariants({variant: "ghost"}),
      )}
    >
      <>
        <Icons.create className="mr-2 h-4 w-4"/>
        Edit
      </>
    </Link>
  )
}

export const StorageTable = (props: Props) => {
  const [entities, setEntities] = useState(props.entities)

  useEffect(() => {
    const evtSource = new EventSource(`/api/organization/${props.organizationId}/storage/sse`, {
      withCredentials: true,
    });

    evtSource.addEventListener('message', ({data: raw}) => {
      try {
        const data: { key: string, value: string } = JSON.parse(raw)
        console.log(data)
        // setEntities((old) => {
        //   // console.log(old.filter(({id}) => id !== data.id))
        //   // return [
        //   //   ...old.filter(({id}) => id !== data.id),
        //   //   {
        //   //     ...data,
        //   //     organizationId: "null"
        //   //   }
        //   // ]
        // })
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
      <DataTable columns={columns} data={entities}/>
    </div>
  )
}