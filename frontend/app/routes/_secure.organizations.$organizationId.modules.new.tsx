import { ActionFunctionArgs, json } from '@remix-run/node'
import { Link, useFetcher, useLoaderData } from '@remix-run/react'

import { createSession, getPocketbase, getUser } from '~/utils/pb.server'
import { Collections } from '~/types/pocketbase'
import { cn } from '~/utils/cn'
import { Button, buttonVariants } from '~/components/ui/button'
import { Icons } from '~/components/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { moduleCreateFormSchema } from '~/validation/module'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { useEffect } from 'react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'

export async function loader(args: ActionFunctionArgs) {
  const organizationId = args.params?.organizationId

  if (!organizationId) {
    throw new Error('404')
  }

  const pb = getPocketbase(args.request)
  const user = getUser(pb)

  if (!user) {
    return createSession('/login', pb)
  }

  const organization = await pb
    .collection(Collections.Organizations)
    .getOne(organizationId)

  return json({
    organization,
  })
}

export default function OrganizationIdScriptLayout() {
  const { organization } = useLoaderData<typeof loader>()
  const fetcher = useFetcher<{
    errors?: Record<string, { type: string, message: string }>
  }>()

  const resolver = zodResolver(moduleCreateFormSchema)
  const form = useForm<z.infer<typeof moduleCreateFormSchema>>({
    resolver,
    defaultValues: {
      code: '',
      name: '',
      sub: '',
    },
  })

  const onSubmit = (data: z.infer<typeof moduleCreateFormSchema>) => {
    fetcher.submit(
      {
        ...data,
        code: data.code,
        name: data.name,
        sub: data.sub,
        _action: 'create',
      },
      {
        action: `/organizations/${organization.id}/modules`,
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

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex justify-between">
        <h1 className="font-heading text-xl">
          New module
        </h1>
        <Link
          to={`/organizations/${organization.id}/modules`}
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
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input placeholder="constants" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="constants" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sub"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sub</FormLabel>
                <FormControl>
                  <Input placeholder="constants" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-center justify-end">
            <Button type="submit" className="flex gap-2">
              Create
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


