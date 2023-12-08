import * as React from "react";
import {redirect} from "next/navigation";
import Link from "next/link";

import {getCurrentUser} from "@/lib/session";
import {authOptions} from "@/lib/auth";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {getModulesByUserIdAndOrganizationId} from "@/lib/db/module";
import {cn} from "@/lib/utils";
import {buttonVariants} from "@/components/ui/button";

import {ModuleTable} from "./module-table";
import {Icons} from "@/components/icons";

type Props = {
  params: {
    organizationId: string
  }
}

export default async function OrganizationModulePage(props: Props) {
  const user = await getCurrentUser()

  if (!user) {
    redirect(authOptions?.pages?.signIn || "/login")
  }

  const entities = await getModulesByUserIdAndOrganizationId(props.params.organizationId, user.id)

  const hasWriteAccess = await userHasWriteAccessToOrganization(props.params.organizationId, user.id,)

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex justify-between">
        <h1 className="font-heading text-xl">
          Module
        </h1>
        <Link
          href={`/organization/${props.params.organizationId}/module/new`}
          className={cn(
            buttonVariants({variant: "default"})
          )}
        >
          <Icons.create className="mr-2 h-4 w-4"/>
          Create
        </Link>
      </div>
      <ModuleTable
        entities={entities}
        organizationId={props.params.organizationId}
      />
    </div>
  )
}