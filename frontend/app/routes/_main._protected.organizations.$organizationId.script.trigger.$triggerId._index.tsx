import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from '@remix-run/node'
import { createSession, getPocketbase, getUser } from '~/utils/pb.server'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { ClientResponseError } from 'pocketbase'
import { Collections, EventsResponse, TriggerConditionsResponse, TriggersResponse } from '~/types/pocketbase'
import { triggerDuplicateFormSchema, triggerFormSchema } from '~/validation/trigger'
import { cn } from '~/utils/cn'
import { Button } from '~/components/ui/button'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { useEffect, useState } from 'react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Editor } from '~/components/editor'
import { Icons } from '~/components/icons'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

export async function action(args: ActionFunctionArgs) {
  const pb = getPocketbase(args.request)
  const user = getUser(pb)

  if (!user) {
    return createSession('/login', pb)
  }

  const organizationId = args.params?.organizationId
  const triggerId = args.params?.triggerId

  if (!organizationId || !triggerId) {
    return new Error('404')
  }

  let formValues: { _action?: string } = {}

  if (args.request.headers.get('content-type') === 'application/json') {
    formValues = await args.request.json()
  } else {
    const formData = await args.request.formData()
    formValues = Object.fromEntries(formData.entries())
  }

  switch (formValues?._action) {
    case 'enable': {
      try {
        await pb.collection(Collections.Triggers).update(
          triggerId,
          {
            enable: true,
          })
        return null
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return {
            error: e.data.message,
            errors: e.data.data,
          }
        }
      }
      break
    }
    case 'disable': {
      try {
        await pb.collection(Collections.Triggers).update(
          triggerId,
          {
            enable: false,
          })
        return null
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return {
            error: e.data.message,
            errors: e.data.data,
          }
        }
      }
      break
    }
    case 'update': {
      const result = triggerFormSchema.safeParse(formValues)
      if (!result.success) {
        const errorsFormatted = result.error.issues.reduce((acc, currentValue) => {
          return {
            ...acc,
            [currentValue.path.join('.')]: {
              type: currentValue.code,
              message: currentValue.message,
            },
          }
        }, {})
        return json({ errors: errorsFormatted })
      }

      try {
        return await pb.collection(Collections.Triggers).update(
          triggerId,
          {
            'name': result.data.name,
            'code': result.data.code,
            'channel': result.data.channel,
          },
          {
            expand: 'trigger_conditions_via_trigger',
          })

      } catch (e) {
        if (e instanceof ClientResponseError) {
          return {
            error: e.data.message,
            errors: e.data.data,
          }
        }
      }
      break
    }
    case 'delete': {
      try {
        await pb.collection(Collections.Triggers).delete(triggerId)
        return redirect(`/organizations/${organizationId}/script`)
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return {
            errors: e.data.data,
          }
        }
      }
      break
    }
    case 'duplicate': {
      const result = triggerDuplicateFormSchema.safeParse(formValues)
      if (!result.success) {
        const errorsFormatted = result.error.issues.reduce((acc, currentValue) => {
          return {
            ...acc,
            [currentValue.path.join('.')]: {
              type: currentValue.code,
              message: currentValue.message,
            },
          }
        }, {})
        return json({ errors: errorsFormatted })
      }
      try {
        const trigger = await pb
          .collection(Collections.Triggers)
          .getOne<TriggersResponse<{ trigger_conditions_via_trigger: TriggerConditionsResponse[] }>>(
            triggerId,
            {
              filter: `organization.id = "${organizationId}"`,
              expand: 'trigger_conditions_via_trigger',
            },
          )

        const created = await pb.collection(Collections.Triggers)
          .create({
            'organization': trigger.organization,
            'name': result.data.targetPath ?? `${trigger.name}-dup`,
            'code': trigger.code,
            'channel': trigger.channel,
            'enable': false,
          })

        for (const condition of trigger.expand?.trigger_conditions_via_trigger ?? []) {
          await new Promise(r => setTimeout(r, 50))
          await pb.collection(Collections.TriggerConditions)
            .create({
              'trigger': created.id,
              'name': condition.name,
              'code': condition.code,
              'timeout': condition.timeout,
              'type': condition.type,
              'enable': false,
            })
        }

        return {
          data: created,
        }
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return json({
            errors: {
              ...e.data.data,
              global: {
                message: e.data.message,
              },
            },
          })
        }
      }
      break
    }
  }
  return json({
    errors: {
      global: {
        message: 'Unknown error ...',
      },
    },
  })
}

export async function loader(args: LoaderFunctionArgs) {
  const organizationId = args.params?.organizationId
  const triggerId = args.params?.triggerId

  if (!organizationId || !triggerId) {
    throw new Error('404')
  }

  const pb = getPocketbase(args.request)
  const user = getUser(pb)

  if (!user) {
    return createSession('/login', pb)
  }

  const trigger = await pb.collection(Collections.Triggers)
    .getOne<TriggersResponse<{ trigger_conditions_via_trigger: TriggerConditionsResponse[] }>>(
      triggerId,
      {
        expand: 'trigger_conditions_via_trigger',
      },
    )

  if (!trigger) {
    throw new Error('404')
  }

  const lastEvents: Record<string, EventsResponse | null> = {}

  await Promise.all(
    trigger.expand?.trigger_conditions_via_trigger.map(async (condition) => {
      try {
        lastEvents[condition.name] = await pb.collection(Collections.Events)
          .getFirstListItem<EventsResponse>(
            `organization = "${organizationId}" && name = "${condition.name}"`,
          )
      } catch (e) {
        lastEvents[condition.name] = null
      }
    }) ?? [],
  )

  return {
    trigger,
    lastEvents,
  }
}

export default function OrganizationIdTriggeryId() {
  const { trigger, lastEvents } = useLoaderData<typeof loader>()
  const [open, setOpen] = useState<string | undefined>(undefined)

  const fetcher = useFetcher<{
    errors?: Record<string, { type: string, message: string }>
  }>({ key: 'save-trigger' })

  const resolver = zodResolver(triggerFormSchema)
  const form = useForm<z.infer<typeof triggerFormSchema>>({
    resolver,
    defaultValues: {
      name: trigger.name ?? '',
      channel: trigger.channel ?? '',
      code: trigger.code ?? '',
    },
  })

  const onSubmit = (data: z.infer<typeof triggerFormSchema>) => {
    fetcher.submit(
      {
        ...data,
        _action: 'update',
      },
      {
        action: `/organizations/${trigger.organization}/script/trigger/${trigger.id}`,
        method: 'post',
        encType: 'application/json',
      },
    )
  }

  useEffect(() => {
    if (fetcher.data?.errors) {
      Object.entries(fetcher.data?.errors)
        .forEach(([name, error]) => {
          form.setError(name as never, { message: error.message })
        })
    }
  }, [fetcher.data, form])

  useEffect(() => {
    form.reset({
      name: trigger.name,
      channel: trigger.channel,
      code: trigger.code,
    })
  }, [trigger, form])

  return (
    <>
      <Dialog open={open != undefined} onOpenChange={() => setOpen(undefined)}>
        <DialogContent className="h-full w-full max-w-full max-h-full">
          <DialogHeader>
            <DialogTitle>Editor</DialogTitle>
            <DialogDescription />
            <Editor
              title="Last event payload"
              noFullScreen
              options={{
                readOnly: true,
              }}
              height="100%"
              language="json"
              value={JSON.stringify(lastEvents[open ?? '']?.payload ?? undefined, null, 2)}
            />
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <Form {...form}>
        <fetcher.Form
          key={trigger.id}
          className="flex flex-col gap-2 px-1 grow"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {fetcher.data?.errors?.global && (
            <p className={cn('text-sm font-medium text-destructive')}>
              {fetcher.data?.errors?.global?.message}
            </p>
          )}
          <div className="flex flex-col gap-2 md:flex-row">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="/constants" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="channel"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Channel</FormLabel>
                  <FormControl>
                    <Input placeholder="animations" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <Editor
                language="javascript"
                height="100%"
                onChange={field.onChange}
                value={field.value}
                toolbar={
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" size="sm" variant="outline">
                        <Icons.payload className="mr-2  h-4 w-4" />
                        Last Events Payload
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {
                        Object
                          .entries(lastEvents)
                          .map(([name, event]) => {
                            return (
                              <DropdownMenuItem
                                key={name}
                                disabled={!event}
                                className="flex gap-2 cursor-pointer"
                                onClick={() => setOpen(name)}
                              >
                                <Icons.payload className="mr-2  h-4 w-4" />
                                {name}
                              </DropdownMenuItem>
                            )
                          })
                      }
                    </DropdownMenuContent>
                  </DropdownMenu>
                }
              />
            )}
          />
          <div className="flex items-center justify-end">
            <Button type="submit" className="flex gap-2">
              Update
              <Icons.loader
                className={cn('animate-spin', { hidden: fetcher.state === 'idle' })}
              />
            </Button>
          </div>
        </fetcher.Form>
      </Form>
    </>
  )
}