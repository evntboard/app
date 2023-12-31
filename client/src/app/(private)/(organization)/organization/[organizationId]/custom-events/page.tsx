import * as React from "react";
import {redirect} from "next/navigation";
import Link from "next/link";

import {getCurrentUser} from "@/lib/session";
import {authOptions} from "@/lib/auth";
import {prisma} from "@/lib/singleton";
import {cn} from "@/lib/utils";
import {buttonVariants} from "@/components/ui/button";
import {Icons} from "@/components/icons";
import {EventTable} from "./event-table";

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

  const events = await prisma.customEvent.findMany({
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
          href={`/organization/${props.params.organizationId}/custom-event/new`}
          className={cn(
            buttonVariants({variant: "default"})
          )}
        >
          <Icons.create className="mr-2 h-4 w-4"/>
          Create
        </Link>
      </div>
      <EventTable events={events} organizationId={props.params.organizationId}/>
    </div>
  )
}