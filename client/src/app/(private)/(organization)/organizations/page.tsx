import Link from "next/link";
import {redirect} from "next/navigation";

import {getCurrentUser} from "@/lib/session";
import {cn} from "@/lib/utils";
import authOptions from "@/lib/auth.config";
import {getOrganizationsByUserId} from "@/lib/db/organization";
import {DashboardHeader} from "@/components/header";
import {buttonVariants} from "@/components/ui/button";

import {OrganizationCard} from "./organization-card";
import {Icons} from "@/components/icons";

export default async function OrganizationsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect(authOptions?.pages?.signIn || "/login")
  }

  const organizations = await getOrganizationsByUserId(user.id)

  return (
    <main className="flex w-full flex-1 flex-col overflow-hidden gap-4">
      <DashboardHeader heading="Organizations" text="Create and manage organizations.">
        <Link
          href="/organization/new"
          className={cn(
            buttonVariants({variant: "default"})
          )}
        >
          <Icons.create className="mr-2 h-4 w-4"/>
          Create
        </Link>
      </DashboardHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {
          organizations?.map((organization) => (
            <OrganizationCard
              key={organization.id}
              id={organization.id}
              name={organization.name}
              user={organization.creator}
            />
          ))
        }
      </div>
    </main>
  )
}