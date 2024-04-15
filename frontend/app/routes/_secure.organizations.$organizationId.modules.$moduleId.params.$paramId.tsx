import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { useEffect } from 'react'
import { ClientResponseError } from 'pocketbase'
import { ActionFunctionArgs, json, redirect } from '@remix-run/node'
import { Link, useFetcher, useLoaderData, useParams } from '@remix-run/react';
import { zodResolver } from '@hookform/resolvers/zod'

import { moduleParamUpdateFormSchema } from '~/validation/module';
import { createSession, getPocketbase, getUser } from '~/utils/pb.server'
import { cn } from '~/utils/cn'
import { Collections } from '~/types/pocketbase'
import { Button, buttonVariants } from '~/components/ui/button'
import { Icons } from '~/components/icons'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Editor } from '~/components/editor';

export async function action(args: ActionFunctionArgs) {
  const pb = getPocketbase(args.request)
  const user = getUser(pb)

  if (!user) {
    return createSession('/login', pb)
  }

  const organizationId = args.params?.organizationId
  const moduleId = args.params?.moduleId
  const paramId = args.params?.paramId


  if (!organizationId || !moduleId || !paramId) {
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
        await pb.collection(Collections.ModuleParams).delete(paramId)
        return redirect(`/organizations/${organizationId}/modules/${moduleId}`)
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
      const result = moduleParamUpdateFormSchema.safeParse(formValues)
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
        await pb.collection(Collections.ModuleParams).update(
          paramId,
          {
            key: result.data.key,
            value: result.data.value,
          },
        )
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
  const moduleId = args.params?.moduleId
  const paramId = args.params?.paramId

  if (!organizationId || !moduleId || !paramId) {
    throw new Error('404')
  }

  const pb = getPocketbase(args.request)
  const user = getUser(pb)

  if (!user) {
    return createSession('/login', pb)
  }

  const param = await pb
    .collection(Collections.ModuleParams)
    .getOne(
      paramId,
      {
        filter: `organization.id = "${organizationId}"`,
      },
    )

  return json({
    param,
  })
}

export default function OrganizationIdScriptLayout() {
  const { organizationId, moduleId, paramId } = useParams()
  const { param } = useLoaderData<typeof loader>()
  const fetcher = useFetcher<{
    errors?: Record<string, { type: string, message: string }>
  }>()
  const fetcherDelete = useFetcher<{
    errors?: Record<string, { type: string, message: string }>
  }>()

  const resolver = zodResolver(moduleParamUpdateFormSchema)
  const form = useForm<z.infer<typeof moduleParamUpdateFormSchema>>({
    resolver,
    defaultValues: {
      key: param.key,
      value: JSON.stringify(param.value, null, 2),
    },
  })

  const onSubmit = (data: z.infer<typeof moduleParamUpdateFormSchema>) => {
    fetcher.submit(
      {
        key: data.key,
        value: data.value,
        _action: 'update',
      },
      {
        action: `/organizations/${organizationId}/modules/${moduleId}/params/${paramId}`,
        method: 'POST',
        encType: 'application/json',
      },
    )
  }

  const handleDelete = () => {
    fetcherDelete.submit(
      { _action: 'delete' },
      {
        action: `/organizations/${organizationId}/modules/${moduleId}/params/${paramId}`,
        method: 'post',
        encType: 'application/json'
      }
    );
  };

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
      key: param.key,
      value: JSON.stringify(param.value, null, 2),
    })
  }, [param, form])


  return (
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
        <div className="flex items-center justify-end gap-2">
          <Button variant="destructive" type="button" className="flex gap-2" onClick={handleDelete}>
            Delete
            <Icons.loader
              className={cn('animate-spin', { hidden: fetcherDelete.state === 'idle' })}
            />
          </Button>
          <Button type="submit" className="flex gap-2">
            Update
            <Icons.loader
              className={cn('animate-spin', { hidden: fetcher.state === 'idle' })}
            />
          </Button>
        </div>
      </fetcher.Form>
    </Form>
  )
}


