import {ReactNode} from "react";
import {redirect} from "next/navigation"
import Link from "next/link";

import {getCurrentUser} from "@/lib/session"
import authConfig from "@/lib/auth.config";
import {getOrganizationByUserId} from "@/lib/db/organization";
import {cn} from "@/lib/utils";
import {buttonVariants} from "@/components/ui/button";
import {Icons} from "@/components/icons";

import {OrgaNav} from "./orga-nav";

interface Props {
  children?: ReactNode,
  params: {
    organizationId: string
  }
}

export default async function DashboardLayout({children, params}: Props) {
  const user = await getCurrentUser()

  if (!user) {
    redirect(authConfig?.pages?.signIn || "/login")
  }

  const organization = await getOrganizationByUserId(user.id, params.organizationId)

  if (!organization) {
    return (
      <div className="grid flex-1 gap-2 md:grid-cols-[200px_1fr]">
        <aside className="hidden w-[200px] flex-col md:flex">
          <Link
            href="/organizations"
            className={cn(
              buttonVariants({variant: "ghost"}),
              "mb-4"
            )}
          >
            <>
              <Icons.chevronLeft className="mr-2 h-4 w-4"/>
              Back
            </>
          </Link>
        </aside>
        <main className="flex w-full flex-1 overflow-hidden">
          This organization doesn&apos;t exist !
        </main>
      </div>
    )
  }

  return (
    <div className="grid flex-1 gap-2 md:grid-cols-[200px_1fr]">
      <aside className="hidden w-[200px] flex-col md:flex">
        <OrgaNav organization={organization}/>
      </aside>
      <main className="flex w-full flex-1 overflow-hidden pb-2">
        {children}
      </main>
    </div>
  )
}
