import * as React from "react";
import {redirect} from "next/navigation";
import Link from "next/link";

import {getCurrentUser} from "@/lib/session";
import {authOptions} from "@/lib/auth";
import {getEventProcessAndLogById} from "@/lib/db/event";
import {cn} from "@/lib/utils";
import {Icons} from "@/components/icons";
import {buttonVariants} from "@/components/ui/button";

import {ProcessEvent} from "./process-event";

type Props = {
  params: {
    organizationId: string,
    eventId: string,
  }
}

export default async function OrganizationEventByIdPage(props: Props) {
  const user = await getCurrentUser()

  if (!user) {
    redirect(authOptions?.pages?.signIn || "/login")
  }

  const data = await getEventProcessAndLogById(props.params.organizationId, user.id, props.params.eventId)

  if (!data) {
    return null
  }

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex justify-between">
        <h1 className="font-heading text-xl">
          Event {data.name}
        </h1>
        <div className="flex items-center gap-2">
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
      </div>
      <div>
        <ProcessEvent
          data={data.processes}
          eventId={props.params.eventId}
          organizationId={props.params.organizationId}
        />
      </div>
    </div>
  )
}