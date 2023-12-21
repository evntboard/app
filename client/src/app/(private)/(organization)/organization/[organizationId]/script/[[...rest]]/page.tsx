import React from "react";
import {redirect} from "next/navigation";
import {Shared, Trigger} from "@prisma/client";

import {authOptions} from "@/lib/auth";
import {generateOptions, generateTree} from "@/lib/tree";
import {getCurrentUser} from "@/lib/session";
import {getScriptsForUserIdAndOrganizationId} from "@/lib/db/scripts";
import {getSharedByIdAndOrganization} from "@/lib/db/shared";
import {getTriggerByIdAndOrganization} from "@/lib/db/trigger";

import {SharedForm} from "./shared-form";
import {TriggerForm} from "./trigger-form";
import {TreeViewGlobal} from "./tree-view-global";
import {TreeViewMobile} from "./tree-view-mobile";

type Props = {
  params: {
    organizationId: string,
    rest: ['trigger' | 'shared', string] | undefined
  },
  searchParams: Record<string, string> | null | undefined
}

export default async function OrganizationScriptPage(props: Props) {
  const user = await getCurrentUser()

  if (!user) {
    redirect(authOptions?.pages?.signIn || "/login")
  }

  const organizationId = props.params.organizationId

  const [triggers, shareds] = await getScriptsForUserIdAndOrganizationId(user.id, organizationId)

  const tree = generateTree('/', triggers, shareds)
  const items = generateOptions('/', triggers, shareds)

  const scriptType = props.params.rest?.[0]
  const scriptId = props.params.rest?.[1]

  let entity = null

  if (scriptType && scriptId) {
    switch (scriptType) {
      case "shared":
        entity = await getSharedByIdAndOrganization(organizationId, user.id, scriptId)
        break;
      case "trigger":
        entity = await getTriggerByIdAndOrganization(organizationId, user.id, scriptId)
        break;
    }
  }

  return (
    <>
      <aside className="hidden flex-col md:flex w-[200px] overflow-auto">
        <TreeViewGlobal
          node={tree}
          organizationId={organizationId}
          scriptType={scriptType}
          scriptId={scriptId}
        />
      </aside>
      <aside className="flex flex-col md:hidden">
        <TreeViewMobile
          options={items}
          organizationId={organizationId}
          scriptType={scriptType}
          scriptId={scriptId}
        />
      </aside>
      <main className="flex flex-1 flex-col">
        {!scriptType && (
          <div>Nothing selected</div>
        )}
        {scriptType === 'shared' && <SharedForm entity={entity as unknown as Shared} organizationId={organizationId}/>}
        {scriptType === 'trigger' &&
          <TriggerForm entity={entity as unknown as Trigger} organizationId={organizationId}/>}
      </main>
    </>
  )
}