import * as React from "react";
import {redirect} from "next/navigation";

import {getCurrentUser} from "@/lib/session";
import {authOptions} from "@/lib/auth";
import {db} from "@/lib/db";

import {EventTable} from "./event-table";
import {cn} from "@/lib/utils";
import {buttonVariants} from "@/components/ui/button";
import Link from "next/link";

type Props = {
  params: {
    organizationId: string,
  }
}

export default async function OrganizationByIdEvents(props: Props) {
  const user = await getCurrentUser()

  if (!user) {
    redirect(authOptions?.pages?.signIn || "/login")
  }

  const events = await db.event.findMany({
    where: {
      organizationId: props.params.organizationId
    }
  })

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex justify-between">
        <h1 className="font-heading text-xl">
          Events
        </h1>
        <Link
          href={`/organization/${props.params.organizationId}/event/new`}
          className={cn(
            buttonVariants({variant: "default"})
          )}
        >
          Create
        </Link>
      </div>
      <EventTable events={events} organizationId={props.params.organizationId}/>
    </div>
  )
}