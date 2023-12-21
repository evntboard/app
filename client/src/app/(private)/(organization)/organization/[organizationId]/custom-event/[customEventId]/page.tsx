import * as React from "react";
import {notFound, redirect} from "next/navigation";
import Link from "next/link";

import {getCurrentUser} from "@/lib/session";
import {authOptions} from "@/lib/auth";
import {cn} from "@/lib/utils";
import {Icons} from "@/components/icons";
import {buttonVariants} from "@/components/ui/button";
import {EventForm} from "../event-form";
import {getEventByIdAndOrganization} from "@/lib/db/customEvent";


type Props = {
  params: {
    organizationId: string,
    customEventId: string,
  }
}

export default async function OrganizationEventByIdPage(props: Props) {
  const user = await getCurrentUser()

  if (!user) {
    redirect(authOptions?.pages?.signIn || "/login")
  }

  const eventData = await getEventByIdAndOrganization(props.params.organizationId, user.id, props.params.customEventId)

  if (!eventData) {
    return notFound()
  }

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex justify-between">
        <h1 className="font-heading text-xl">
          Custom Event
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
        defaultValues={eventData}
        organizationId={props.params.organizationId}
      />
    </div>
  )
}