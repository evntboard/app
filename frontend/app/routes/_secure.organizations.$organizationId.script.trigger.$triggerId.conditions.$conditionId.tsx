import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from '@remix-run/node'
import { useFetcher, useLoaderData, useParams } from '@remix-run/react'
import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { ClientResponseError } from 'pocketbase'

import { createSession, getPocketbase, getUser } from '~/utils/pb.server'
import { Collections, EventsResponse, TriggerConditionsResponse, TriggersResponse } from '~/types/pocketbase'
import { triggerConditionDuplicateFormSchema, triggerConditionUpdateFormSchema } from '~/validation/trigger'
import { cn } from '~/utils/cn'
import { Input } from '~/components/ui/input'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Editor } from '~/components/editor'
import { Icons } from '~/components/icons'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'

export async function action(args: ActionFunctionArgs) {
  const pb = getPocketbase(args.request)
  const user = getUser(pb)

  if (!user) {
    return createSession('/login', pb)
  }

  const organizationId = args.params?.organizationId
  const triggerId = args.params?.triggerId
  const conditionId = args.params?.conditionId

  if (!organizationId || !triggerId || !conditionId) {
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
    case 'update': {
      const result = triggerConditionUpdateFormSchema.safeParse(formValues)
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
        return await pb.collection(Collections.TriggerConditions).update(
          conditionId,
          {
            name: result.data.name,
            code: result.data.code,
            timeout: result.data.timeout,
            type: result.data.type,
            enable: result.data.enable,
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
    case 'enable': {
      try {
        await pb.collection(Collections.TriggerConditions).update(
          conditionId,
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
        await pb.collection(Collections.TriggerConditions).update(
          conditionId,
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
    case 'duplicate': {
      const result = triggerConditionDuplicateFormSchema.safeParse(formValues)
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
        const condition = await pb
          .collection(Collections.TriggerConditions)
          .getOne(
            conditionId,
            {
              filter: `organization.id = "${organizationId}"`,
            },
          )

        const created = await pb.collection(Collections.TriggerConditions)
          .create({
            'trigger': triggerId,
            'name': result.data.targetPath ?? `${condition.name}-dup`,
            'code': condition.code,
            'type': condition.type,
            'timeout': condition.timeout,
            'enable': false,
          })

        return redirect(`/organizations/${organizationId}/script/trigger/${triggerId}/conditions/${created.id}`)
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
    case 'delete': {
      try {
        await pb.collection(Collections.TriggerConditions).delete(conditionId)
        return redirect(`/organizations/${organizationId}/script/trigger/${triggerId}`)
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return {
            errors: e.data.data,
          }
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
  const conditionId = args.params?.conditionId

  if (!organizationId || !triggerId || !conditionId) {
    throw new Error('404')
  }

  const pb = getPocketbase(args.request)
  const user = getUser(pb)

  if (!user) {
    return createSession('/login', pb)
  }

  const condition = await pb.collection(Collections.TriggerConditions)
    .getOne<TriggerConditionsResponse<{ trigger_via_trigger: TriggersResponse }>>(
      conditionId,
      {
        expand: 'trigger_via_trigger',
      },
    )

  if (!condition) {
    throw new Error('404')
  }

  let lastEvent: EventsResponse | undefined

  try {
    lastEvent = await pb.collection(Collections.Events)
      .getFirstListItem<EventsResponse>(
        `organization = "${organizationId}" && name = "${condition.name}"`,
      )
  } catch (e) {
    lastEvent = undefined
  }

  return {
    condition,
    lastEvent,
  }
}

export default function OrganizationIdTriggeryId() {
  const { organizationId, triggerId } = useParams()
  const { condition, lastEvent } = useLoaderData<typeof loader>()

  const fetcher = useFetcher<{
    errors?: Record<string, { type: string, message: string }>
  }>()

  const resolver = zodResolver(triggerConditionUpdateFormSchema)
  const form = useForm<z.infer<typeof triggerConditionUpdateFormSchema>>({
    resolver,
    defaultValues: {
      name: condition.name,
      code: condition.code,
      timeout: condition.timeout,
      type: condition.type,
      enable: condition.enable,
    },
  })

  const onSubmit = (data: z.infer<typeof triggerConditionUpdateFormSchema>) => {
    fetcher.submit(
      {
        ...data,
        _action: 'update',
      },
      {
        action: `/organizations/${organizationId}/script/trigger/${triggerId}/conditions/${condition.id}`,
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
      name: condition.name,
      code: condition.code,
      timeout: condition.timeout,
      type: condition.type,
      enable: condition.enable,
    })
  }, [condition, form])

  return (
    <>
      <Form {...form}>
        <fetcher.Form
          key={condition.id}
          className="flex flex-col gap-2 px-1 grow"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {fetcher.data?.errors?.global && (
            <p className={cn('text-sm font-medium text-destructive')}>
              {fetcher.data?.errors?.global?.message}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="increment" {...field} />
                  </FormControl>
                  <FormDescription></FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col gap-2 lg:flex-row">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BASIC">Basic</SelectItem>
                      <SelectItem value="THROTTLE">Throttle</SelectItem>
                      <SelectItem value="DEBOUNCE">Debounce</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription></FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timeout"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Timeout</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => {
                        const number = parseInt(e.target.value, 10)
                        if (isNaN(number)) {
                          field.onChange(e.target.value)
                        } else {
                          field.onChange(number)
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription></FormDescription>
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
                  <Dialog key="last-payload">
                    <DialogTrigger asChild>
                      <Button type="button" size="sm" variant="outline" disabled={!lastEvent}>
                        <Icons.payload className="mr-2  h-4 w-4" />
                        Last Event Payload
                      </Button>
                    </DialogTrigger>
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
                          value={JSON.stringify(lastEvent?.payload, null, 2)}
                        />
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                }
              />
            )}
          />
          <div className="flex justify-end gap-2">
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