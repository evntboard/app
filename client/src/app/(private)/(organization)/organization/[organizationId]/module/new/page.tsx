import * as React from "react";
import Link from "next/link";
import {redirect} from "next/navigation";

import {getCurrentUser} from "@/lib/session";
import authOptions from "@/lib/auth.config";
import {cn} from "@/lib/utils";
import {Icons} from "@/components/icons";
import {buttonVariants} from "@/components/ui/button";
import {ModuleForm} from "../module-form";


type Props = {
  params: {
    organizationId: string,
  }
}

export default async function OrganizationModuleNewPage(props: Props) {
  const user = await getCurrentUser()

  if (!user) {
    redirect(authOptions?.pages?.signIn || "/login")
  }

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex justify-between">
        <h1 className="font-heading text-xl">
          New module
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/organization/${props.params.organizationId}/modules`}
            className={cn(
              buttonVariants({variant: "ghost"}),
            )}
          >
            <Icons.chevronLeft className="mr-2 h-4 w-4"/>
            Back
          </Link>
        </div>
      </div>
      <ModuleForm
        defaultValues={{
          code: 'sample',
          name: 'sample',
          params: [],
        }}
        organizationId={props.params.organizationId}
      />
    </div>
  )
}