import * as React from "react";
import {redirect} from "next/navigation";
import Link from "next/link";

import {getCurrentUser} from "@/lib/session";
import authOptions from "@/lib/auth.config";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {cn} from "@/lib/utils";
import {getEventsByIdAndOrganization} from "@/lib/db/customEvent";
import {buttonVariants} from "@/components/ui/button";
import {Icons} from "@/components/icons";

import {AddEvent} from "./add-event";

type Props = {
  params: {
    organizationId: string
  }
}

export default async function OrganizationEventPage(props: Props) {
  const user = await getCurrentUser()

  if (!user) {
    redirect(authOptions?.pages?.signIn || "/login")
  }

  const hasWriteAccess = await userHasWriteAccessToOrganization(props.params.organizationId, user.id)

  const eventsSaved = await getEventsByIdAndOrganization(props.params.organizationId, user.id)

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex justify-between">
        <h1 className="font-heading text-xl">
          New event
        </h1>
        <Link
          href={`/organization/${props.params.organizationId}/events`}
          className={cn(
            buttonVariants({variant: "ghost"}),
          )}
        >
          <Icons.chevronLeft className="mr-2 h-4 w-4"/>
          Back
        </Link>
      </div>
      <AddEvent
        events={eventsSaved}
        hasWriteAccess={hasWriteAccess}
        organizationId={props.params.organizationId}
      />
    </div>
  )
}