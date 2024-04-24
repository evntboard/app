import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect } from 'react';
import { ClientResponseError } from 'pocketbase';
import { ActionFunctionArgs, json, redirect } from '@remix-run/node';
import { Link, useFetcher, useLoaderData } from '@remix-run/react';
import { zodResolver } from '@hookform/resolvers/zod';

import { moduleUpdateFormSchema } from '~/validation/module';
import { createSession, getPocketbase, getUser } from '~/utils/pb.server';
import { cn } from '~/utils/cn';
import { Collections } from '~/types/pocketbase';
import { Button, buttonVariants } from '~/components/ui/button';
import { Icons } from '~/components/icons';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form';
import { Input } from '~/components/ui/input';

export async function loader(args: ActionFunctionArgs) {
  const organizationId = args.params?.organizationId;
  const moduleId = args.params?.moduleId;

  if (!organizationId || !moduleId) {
    throw new Error('404');
  }

  const pb = getPocketbase(args.request);
  const user = getUser(pb);

  if (!user) {
    return createSession('/login', pb);
  }

  const module = await pb
    .collection(Collections.Modules)
    .getOne(
      moduleId,
      {
        filter: `organization.id = "${organizationId}"`
      }
    );

  const organization = await pb
    .collection(Collections.Organizations)
    .getOne(organizationId);

  return json({
    organization,
    module
  });
}

export default function OrganizationIdScriptLayout() {
  const { module } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<{
    errors?: Record<string, { type: string, message: string }>
  }>();

  const resolver = zodResolver(moduleUpdateFormSchema);
  const form = useForm<z.infer<typeof moduleUpdateFormSchema>>({
    resolver,
    defaultValues: {
      code: module.code,
      name: module.name,
      sub: module.sub
    }
  });

  const onSubmit = (data: z.infer<typeof moduleUpdateFormSchema>) => {
    fetcher.submit(
      {
        code: data.code,
        name: data.name,
        sub: data.sub,
        _action: 'update'
      },
      {
        action: `/organizations/${module.organization}/modules/${module.id}`,
        method: 'POST',
        encType: 'application/json'
      }
    );
  };

  useEffect(() => {
    if (fetcher.data?.errors) {
      Object.entries(fetcher.data?.errors)
        .forEach(([name, error]) => {
          form.setError(name as never, { message: error.message });
        });
    }
  }, [fetcher.data, form]);

  useEffect(() => {
    form.reset({
      code: module.code,
      name: module.name,
      sub: module.sub
    });
  }, [module, form]);


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
            Update
            <Icons.loader
              className={cn('animate-spin', { hidden: fetcher.state === 'idle' })}
            />
          </Button>
        </div>
      </fetcher.Form>
    </Form>
  );
}


