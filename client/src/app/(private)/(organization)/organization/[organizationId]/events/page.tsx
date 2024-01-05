import * as React from "react";
import {redirect} from "next/navigation";
import Link from "next/link";

import {getCurrentUser} from "@/lib/session";
import {authOptions} from "@/lib/auth";
import {userHasWriteAccessToOrganization} from "@/lib/db/user";
import {getEventsByOrganizationId} from "@/lib/db/event";
import {cn} from "@/lib/utils";
import {buttonVariants} from "@/components/ui/button";
import {Icons} from "@/components/icons";

import {EventsTable} from "./events-table";

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

  const events = await getEventsByOrganizationId(props.params.organizationId, user.id)

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex justify-between">
        <h1 className="font-heading text-xl">
          Realtime
        </h1>
        <Link
          href={`/organization/${props.params.organizationId}/event/new`}
          className={cn(
            buttonVariants({variant: "default"}),
          )}
        >
          <Icons.event className="mr-2 h-4 w-4"/>
          Send an event
        </Link>
      </div>
      <EventsTable events={events} organizationId={props.params.organizationId}/>
    </div>
  )
}