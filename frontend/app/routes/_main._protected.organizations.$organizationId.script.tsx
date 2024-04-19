import { Outlet, useFetcher, useLoaderData, useParams } from '@remix-run/react'
import { ActionFunctionArgs, json } from '@remix-run/node'
import { useDebounceCallback } from 'usehooks-ts'
import { useMemo } from 'react'

import { createSession, getPocketbase, getUser } from '~/utils/pb.server'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '~/components/ui/resizable'
import { TreeViewGlobal } from '~/components/tree-view-global'
import { cookieTreeOpen, cookieTreeSplit } from '~/utils/cookies.server'
import { Collections } from '~/types/pocketbase'

export async function action(args: ActionFunctionArgs) {
  const pb = getPocketbase(args.request)
  const user = getUser(pb)

  if (!user) {
    return createSession('/login', pb)
  }

  const organizationId = args.params?.organizationId

  if (!organizationId) {
    throw new Error('404')
  }

  const formData = await args.request.formData()
  const data = Object.fromEntries(formData.entries())

  switch (data?._action) {
    case 'open': {
      const oldCookie = args.request.headers.get('Cookie')
      const value = await cookieTreeOpen.parse(oldCookie) || {}

      value[organizationId] = JSON.parse(String(data?.data) ?? [])

      return json(
        null,
        {
          headers: {
            'Set-Cookie': await cookieTreeOpen.serialize(value),
          },
        },
      )
    }
    case 'split': {
      const oldCookie = args.request.headers.get('Cookie')
      const value = await cookieTreeSplit.parse(oldCookie) || {}

      value[organizationId] = JSON.parse(String(data?.data) ?? [])

      return json(
        null,
        {
          headers: {
            'Set-Cookie': await cookieTreeSplit.serialize(value),
          },
        },
      )
    }
  }
  return null
}

export async function loader(args: ActionFunctionArgs) {
  const organizationId = args.params?.organizationId
  const sharedId = args.params?.sharedId
  const triggerId = args.params?.triggerId
  const conditionId = args.params?.conditionId

  if (!organizationId) {
    throw new Error('404')
  }

  const pb = getPocketbase(args.request)
  const user = getUser(pb)

  if (!user) {
    return createSession('/login', pb)
  }

  const tree = await pb.send(`/api/organization/${organizationId}/tree`, {
    query: {
      path: '/',
    },
  })

  if (!tree) {
    throw new Error('404')
  }

  const oldCookie = args.request.headers.get('Cookie')
  const valueTreeOpen = await cookieTreeOpen.parse(oldCookie) || {}
  const valueTreeSplit = await cookieTreeSplit.parse(oldCookie) || {}

  const defaultOpen = valueTreeOpen[organizationId] ?? []

  if (defaultOpen.length === 0) {
    defaultOpen.push('/')
  }

  if (sharedId) {
    const shared = await pb.collection(Collections.Shareds).getOne(
      sharedId,
      {
        fields: 'name',
      },
    )
    shared.name
      .split('/')
      .forEach((v, i, arr) => {
        if (v != '' && !defaultOpen.includes(v)) {
          defaultOpen.push(`${arr.slice(0, i).join('/')}/`)
        }
      })
  }
  if (triggerId) {
    const trigger = await pb.collection(Collections.Triggers).getOne(
      triggerId,
      {
        fields: 'name',
      },
    )
    trigger.name
      .split('/')
      .forEach((v, i, arr) => {
        if (v != '' && !defaultOpen.includes(v)) {
          defaultOpen.push(`${arr.slice(0, i).join('/')}/`)
        }
      })

    if (conditionId) {
      defaultOpen.push(trigger.name)
    }
  }

  return {
    tree,
    defaultOpen,
    defaultSplit: valueTreeSplit[organizationId],
  }
}

export default function OrganizationIdScriptLayout() {
  const { organizationId, sharedId, triggerId, conditionId } = useParams()
  const { tree, defaultOpen, defaultSplit } = useLoaderData<typeof loader>()
  const fetcher = useFetcher()

  const onLayout = useDebounceCallback(
    (sizes: number[]) => {
      const formData = new FormData()
      formData.append('data', JSON.stringify(sizes))
      formData.append('_action', 'split')
      fetcher.submit(formData, { action: `/organizations/${organizationId}/script`, method: 'post' })
    }, 300,
  )

  const { scriptType, scriptId } = useMemo<{
    scriptType: 'trigger' | 'condition' | 'shared' | undefined,
    scriptId: string | undefined
  }>(() => {
    if (sharedId) {
      return {
        scriptType: 'shared',
        scriptId: sharedId,
      }
    }
    if (triggerId) {
      if (conditionId) {
        return {
          scriptType: 'condition',
          scriptId: conditionId,
        }
      }
      return {
        scriptType: 'trigger',
        scriptId: triggerId,
      }
    }
    return {
      scriptType: undefined,
      scriptId: undefined,
    }
  }, [triggerId, conditionId, sharedId])

  return (
    <ResizablePanelGroup
      direction="horizontal"
      onLayout={onLayout}
      className="flex-grow"
    >
      <ResizablePanel
        minSize={5}
        defaultSize={defaultSplit?.[0] || 33}
        className="p-2 w-full h-full"
      >
        <div className="w-full h-full flex flex-col overflow-auto">
          <TreeViewGlobal
            hasWriteAccess={false}
            defaultOpen={defaultOpen}
            node={tree}
            organizationId={organizationId ?? ''}
            scriptType={scriptType}
            scriptId={scriptId}
          />
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel
        defaultSize={defaultSplit?.[1] || 67}
        minSize={25}
        className="p-2 w-full h-full flex flex-col"
      >
        <Outlet />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}


