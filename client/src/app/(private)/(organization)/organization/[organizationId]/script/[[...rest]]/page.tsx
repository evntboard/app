import {redirect} from "next/navigation";

import {authOptions} from "@/lib/auth";
import {generateTree} from "@/lib/tree";
import {getCurrentUser} from "@/lib/session";
import {getScriptsForUserIdAndOrganizationId} from "@/lib/db/scripts";
import {getSharedByIdAndOrganization} from "@/lib/db/shared";
import {getTriggerByIdAndOrganization} from "@/lib/db/trigger";
import {getFromCookie} from "@/lib/cookie/get";
import {Panel} from "./panel";

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

  const defaultLayout = getFromCookie("evntboard:layout", [33, 67]);

  const defaultOpen = getFromCookie("evntboard:open", []);

  const organizationId = props.params.organizationId

  const [triggers, shareds] = await getScriptsForUserIdAndOrganizationId(user.id, organizationId)

  const tree = generateTree('/', triggers, shareds)

  const scriptType = props.params.rest?.[0]
  const scriptId = props.params.rest?.[1]

  let entity: unknown = null

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
    <Panel
      defaultOpen={defaultOpen}
      defaultLayout={defaultLayout}
      tree={tree}
      entity={entity}
      organizationId={organizationId}
      scriptId={scriptId}
      scriptType={scriptType}
    />
  )
}