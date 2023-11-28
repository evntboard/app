'use client'

import Link from "next/link";
import {cn} from "@/lib/utils";
import {usePathname} from "next/navigation";
import {Icons} from "@/components/icons";
import {Organization} from "@prisma/client";

type Props = {
  organization: Organization
}

export const OrgaNav = ({organization}: Props) => {

  const path = usePathname()

  return (
    <>
      <div className="text-lg font-semibold p-2">
        {organization.name}
      </div>
      <nav className="grid items-start gap-2">
        <Link href={`/organization/${organization.id}`}>
          <div
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              path === `/organization/${organization.id}` ? "bg-accent" : "transparent",
            )}
          >
            <Icons.settings className="mr-2 h-4 w-4"/>
            <span>General</span>
          </div>
        </Link>
        <Link href={`/organization/${organization.id}/script`}>
          <div
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              path.startsWith(`/organization/${organization.id}/script`) ? "bg-accent" : "transparent",
            )}
          >
            <Icons.script className="mr-2 h-4 w-4"/>
            <span>Script</span>
          </div>
        </Link>
        <Link href={`/organization/${organization.id}/realtime-events`}>
          <div
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              path.startsWith(`/organization/${organization.id}/realtime-event`) ? "bg-accent" : "transparent",
            )}
          >
            <Icons.realtime className="mr-2 h-4 w-4"/>
            <span>Realtime</span>
          </div>
        </Link>
        <Link href={`/organization/${organization.id}/events`}>
          <div
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              path.startsWith(`/organization/${organization.id}/event`) ? "bg-accent" : "transparent",
            )}
          >
            <Icons.event className="mr-2 h-4 w-4"/>
            <span>Events</span>
          </div>
        </Link>
        <Link href={`/organization/${organization.id}/storages`}>
          <div
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              path.startsWith(`/organization/${organization.id}/storage`) ? "bg-accent" : "transparent",
            )}
          >
            <Icons.storage className="mr-2 h-4 w-4"/>
            <span>Storage</span>
          </div>
        </Link>
        <Link href={`/organization/${organization.id}/modules`}>
          <div
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              path.startsWith(`/organization/${organization.id}/module`) ? "bg-accent" : "transparent",
            )}
          >
            <Icons.module className="mr-2 h-4 w-4"/>
            <span>Module</span>
          </div>
        </Link>
        <Link href={`/organization/${organization.id}/session`}>
          <div
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              path.startsWith(`/organization/${organization.id}/session`) ? "bg-accent" : "transparent",
            )}
          >
            <Icons.session className="mr-2 h-4 w-4"/>
            <span>Session</span>
          </div>
        </Link>
      </nav>
    </>
  )
}