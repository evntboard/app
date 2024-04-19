import { ActionFunctionArgs, json } from '@remix-run/node'
import { Link, useFetcher, useLoaderData } from '@remix-run/react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { useEffect } from 'react'
import { ClientResponseError } from 'pocketbase'
import { zodResolver } from '@hookform/resolvers/zod'

import { storageUpdateFormSchema } from '~/validation/storage'
import { cn } from '~/utils/cn'
import { createSession, getPocketbase, getUser } from '~/utils/pb.server'
import { Collections } from '~/types/pocketbase'
import { Button, buttonVariants } from '~/components/ui/button'
import { Icons } from '~/components/icons'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Editor } from '~/components/editor'

export async function action(args: ActionFunctionArgs) {
  const pb = getPocketbase(args.request)
  const user = getUser(pb)

  if (!user) {
    return createSession('/login', pb)
  }

  const organizationId = args.params?.organizationId
  const storageId = args.params?.storageId


  if (!organizationId || !storageId) {
    throw new Error('404')
  }

  let formValues: { _action?: string } = {}

  if (args.request.headers.get('content-type') === 'application/json') {
    formValues = await args.request.json()
  } else {
    const formData = await args.request.formData()
    formValues = Object.fromEntries(formData.entries())
  }

  switch (formValues?._action) {
    case 'delete': {
      try {
        await pb.collection(Collections.Storages).delete(storageId)
        return null
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
    case 'update': {
      const result = storageUpdateFormSchema.safeParse(formValues)
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
        const updated = await pb.collection(Collections.Storages).update(
          storageId,
          {
            key: result.data.key,
            value: JSON.parse(result.data.value),
          },
        )
        return {
          data: updated,
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

export async function loader(args: ActionFunctionArgs) {
  const organizationId = args.params?.organizationId
  const storageId = args.params?.storageId

  if (!organizationId || !storageId) {
    throw new Error('404')
  }

  const pb = getPocketbase(args.request)
  const user = getUser(pb)

  if (!user) {
    return createSession('/login', pb)
  }

  const storage = await pb
    .collection(Collections.Storages)
    .getOne(
      storageId,
      {
        filter: `organization.id = "${organizationId}"`,
      },
    )

  const organization = await pb
    .collection(Collections.Organizations)
    .getOne(organizationId)

  return json({
    organization,
    storage,
  })
}

export default function OrganizationIdScriptLayout() {
  const { storage } = useLoaderData<typeof loader>()
  const fetcher = useFetcher<{
    errors?: Record<string, { type: string, message: string }>
  }>()

  const resolver = zodResolver(storageUpdateFormSchema)
  const form = useForm<z.infer<typeof storageUpdateFormSchema>>({
    resolver,
    defaultValues: {
      key: storage.key,
      value: JSON.stringify(storage.value ?? null, null, 2),
    },
  })

  const onSubmit = (data: z.infer<typeof storageUpdateFormSchema>) => {
    fetcher.submit(
      {
        ...data,
        key: data.key,
        value: data.value,
        _action: 'update',
      },
      {
        action: `/organizations/${storage.organization}/storages/${storage.id}`,
        method: 'POST',
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
      key: storage.key,
      value: JSON.stringify(storage.value ?? null, null, 2),
    })
  }, [storage, form])


  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex justify-between">
        <h1 className="font-heading text-xl">
          Storage {storage.key}
        </h1>
        <Link
          to={`/organizations/${storage.organization}/storages`}
          className={cn(
            'flex gap-2',
            buttonVariants({ variant: 'default' }),
          )}
        >
          <Icons.back className="h-4 w-4" />
          Back
        </Link>
      </div>

      <Form {...form}>
        <fetcher.Form
          className="flex flex-col gap-2 px-1 grow"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {fetcher.data?.errors?.global && (
            <p className={cn('text-sm font-medium text-destructive')}>
              {fetcher.data?.errors?.global?.message}
            </p>
          )}
          <FormField
            control={form.control}
            name="key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Key</FormLabel>
                <FormControl>
                  <Input placeholder="constants" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col flex-1 mb-2">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <Editor
                  language="json"
                  height="100%"
                  onChange={field.onChange}
                  value={field.value}
                />
              )}
            />
          </div>
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
    </div>
  )
}


