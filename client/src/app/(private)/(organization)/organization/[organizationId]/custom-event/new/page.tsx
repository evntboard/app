import * as React from "react";
import Link from "next/link";
import {redirect} from "next/navigation";

import {getCurrentUser} from "@/lib/session";
import {authOptions} from "@/lib/auth";
import {cn} from "@/lib/utils";
import {Icons} from "@/components/icons";
import {buttonVariants} from "@/components/ui/button";
import {EventForm} from "../event-form";

type Props = {
  params: {
    organizationId: string,
  }
}

export default async function OrganizationEventNewPage(props: Props) {
  const user = await getCurrentUser()

  if (!user) {
    redirect(authOptions?.pages?.signIn || "/login")
  }

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex justify-between">
        <h1 className="font-heading text-xl">
          New custom event
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/organization/${props.params.organizationId}/custom-events`}
            className={cn(
              buttonVariants({variant: "ghost"}),
            )}
          >
            <Icons.chevronLeft className="mr-2 h-4 w-4"/>
            Back
          </Link>
        </div>
      </div>
      <EventForm
        defaultValues={{
          name: 'an-event',
          payload: "",
          description: ""
        }}
        organizationId={props.params.organizationId}
      />
    </div>
  )
}