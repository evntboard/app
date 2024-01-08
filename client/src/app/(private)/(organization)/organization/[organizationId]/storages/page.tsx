import * as React from "react";
import {redirect} from "next/navigation";

import {getCurrentUser} from "@/lib/session";
import authOptions from "@/lib/auth.config";
import {getStoragesByUserIdAndOrganizationId} from "@/lib/db/storage";

import {StorageTable} from "./storage-table";
import Link from "next/link";
import {cn} from "@/lib/utils";
import {buttonVariants} from "@/components/ui/button";
import {Icons} from "@/components/icons";

type Props = {
  params: {
    organizationId: string
  }
}

export default async function OrganizationStoragePage(props: Props) {
  const user = await getCurrentUser()

  if (!user) {
    redirect(authOptions?.pages?.signIn || "/login")
  }

  const entities = await getStoragesByUserIdAndOrganizationId(props.params.organizationId, user.id)

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex justify-between">
        <h1 className="font-heading text-xl">
          Storage
        </h1>
        <Link
          href={`/organization/${props.params.organizationId}/storage/new`}
          className={cn(
            buttonVariants({variant: "default"})
          )}
        >
          <Icons.create className="mr-2 h-4 w-4"/>
          Create
        </Link>
      </div>
      <StorageTable
        organizationId={props.params.organizationId}
        entities={entities}
      />
    </div>
  )
}