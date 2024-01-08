import * as React from "react";
import {notFound, redirect} from "next/navigation";
import Link from "next/link";

import {getCurrentUser} from "@/lib/session";
import authOptions from "@/lib/auth.config";
import {getStorageByUserIdAndOrganizationIdAndKey} from "@/lib/db/storage";
import {cn} from "@/lib/utils";
import {Icons} from "@/components/icons";
import {buttonVariants} from "@/components/ui/button";

import {StorageForm} from "../storage-form";

type Props = {
  params: {
    organizationId: string,
    storageKey: string,
  }
}

export default async function OrganizationModuleByIdPage(props: Props) {
  const user = await getCurrentUser()

  if (!user) {
    redirect(authOptions?.pages?.signIn || "/login")
  }

  const decodedKey = decodeURIComponent(props.params.storageKey)

  const storageData = await getStorageByUserIdAndOrganizationIdAndKey(props.params.organizationId, user.id, decodedKey)

  if (!storageData) {
    return notFound()
  }

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex justify-between">
        <h1 className="font-heading text-xl flex gap-2 items-center">
          {
            storageData.key.startsWith('tmp:') ?
              <Icons.storagePersist className="h-5 w-5"/> :
              <Icons.storageTemp className="h-5 w-5"/>
          }
          Storage {decodedKey}
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/organization/${props.params.organizationId}/storages`}
            className={cn(
              buttonVariants({variant: "ghost"}),
            )}
          >
            <Icons.chevronLeft className="mr-2 h-4 w-4"/>
            Back
          </Link>
        </div>
      </div>
      <StorageForm
        defaultValues={storageData}
        organizationId={props.params.organizationId}
      />
    </div>
  )
}