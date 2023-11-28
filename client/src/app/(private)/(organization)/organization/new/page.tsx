import {redirect} from "next/navigation";
import Link from "next/link";

import {getCurrentUser} from "@/lib/session";
import {authOptions} from "@/lib/auth";
import {cn} from "@/lib/utils";

import {buttonVariants} from "@/components/ui/button";
import {Icons} from "@/components/icons";

import {OrganizationNewForm} from "./organization-new-form";

export default async function NewOrganizationPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect(authOptions?.pages?.signIn || "/login")
  }

  return (
    <>
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
      <OrganizationNewForm/>
    </>
  )
}