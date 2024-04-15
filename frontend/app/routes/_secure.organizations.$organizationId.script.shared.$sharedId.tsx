import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { ClientResponseError } from 'pocketbase';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Input } from '~/components/ui/input';
import { Editor } from '~/components/editor';
import { Button } from '~/components/ui/button';
import { Icons } from '~/components/icons';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form';
import { sharedDuplicateFormSchema, sharedFormSchema } from '~/validation/shared';
import { createSession, getPocketbase, getUser } from '~/utils/pb.server';
import { cn } from '~/utils/cn';
import { Collections } from '~/types/pocketbase';

export async function action(args: ActionFunctionArgs) {
  const pb = getPocketbase(args.request);
  const user = getUser(pb);

  if (!user) {
    return createSession('/login', pb);
  }

  const organizationId = args.params?.organizationId;
  const sharedId = args.params?.sharedId;

  if (!organizationId || !sharedId) {
    throw new Error('404');
  }

  let formValues: { _action?: string } = {};

  if (args.request.headers.get('content-type') === 'application/json') {
    formValues = await args.request.json();
  } else {
    const formData = await args.request.formData();
    formValues = Object.fromEntries(formData.entries());
  }

  switch (formValues?._action) {
    case 'enable': {
      try {
        await pb.collection(Collections.Shareds).update(
          sharedId,
          {
            enable: true
          });
        return null;
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return json({
            errors: {
              ...e.data.data,
              global: {
                message: e.data.message
              }
            }
          });
        }
      }
      break;
    }
    case 'disable': {
      try {
        await pb.collection(Collections.Shareds).update(
          sharedId,
          {
            enable: false
          });
        return null;
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return json({
            errors: {
              ...e.data.data,
              global: {
                message: e.data.message
              }
            }
          });
        }
      }
      break;
    }
    case 'update': {
      const result = sharedFormSchema.safeParse(formValues);
      if (!result.success) {
        const errorsFormatted = result.error.issues.reduce((acc, currentValue) => {
          return {
            ...acc,
            [currentValue.path.join('.')]: {
              type: currentValue.code,
              message: currentValue.message
            }
          };
        }, {});
        return json({ errors: errorsFormatted });
      }
      try {
        const updated = await pb.collection(Collections.Shareds).update(
          sharedId,
          {
            'name': result.data.name,
            'code': result.data.code
          }
        );
        return {
          data: updated
        };
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return json({
            errors: {
              ...e.data.data,
              global: {
                message: e.data.message
              }
            }
          });
        }
      }
      break;
    }
    case 'delete': {
      try {
        await pb.collection(Collections.Shareds).delete(sharedId);
        return redirect(`/organizations/${organizationId}/script`);
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return json({
            errors: {
              ...e.data.data,
              global: {
                message: e.data.message
              }
            }
          });
        }
      }
      break;
    }
    case 'duplicate': {
      const result = sharedDuplicateFormSchema.safeParse(formValues);
      if (!result.success) {
        const errorsFormatted = result.error.issues.reduce((acc, currentValue) => {
          return {
            ...acc,
            [currentValue.path.join('.')]: {
              type: currentValue.code,
              message: currentValue.message
            }
          };
        }, {});
        return json({ errors: errorsFormatted });
      }
      try {
        const shared = await pb
          .collection(Collections.Shareds)
          .getOne(
            sharedId,
            {
              filter: `organization.id = "${organizationId}"`
            }
          );

        const created = await pb.collection(Collections.Shareds)
          .create({
            'organization': shared.organization,
            'name': result.data.targetPath ?? `${shared.name}-dup`,
            'code': shared.code,
            'enable': false
          });

        return redirect(`/organizations/${organizationId}/script/shared/${created.id}`);
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return json({
            errors: {
              ...e.data.data,
              global: {
                message: e.data.message
              }
            }
          });
        }
      }
      break;
    }
  }

  return json({
    errors: {
      global: {
        message: 'Unknown error ...'
      }
    }
  });
}

export async function loader(args: LoaderFunctionArgs) {
  const organizationId = args.params?.organizationId;
  const sharedId = args.params?.sharedId;

  if (!organizationId || !sharedId) {
    throw new Error('404');
  }

  const pb = getPocketbase(args.request);
  const user = getUser(pb);

  if (!user) {
    return createSession('/login', pb);
  }

  const shared = await pb.collection(Collections.Shareds).getOne(sharedId);

  if (!shared) {
    throw new Error('404');
  }

  return {
    shared
  };
}

export default function OrganizationIdSharedById() {
  const { shared } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<{
    errors?: Record<string, { type: string, message: string }>
  }>();

  const resolver = zodResolver(sharedFormSchema);
  const form = useForm<z.infer<typeof sharedFormSchema>>({
    resolver,
    defaultValues: {
      name: shared.name,
      code: shared.code
    }
  });

  const onSubmit = (data: z.infer<typeof sharedFormSchema>) => {
    fetcher.submit(
      {
        ...data,
        _action: 'update'
      },
      {
        action: `/organizations/${shared.organization}/script/shared/${shared.id}`,
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
      name: shared.name,
      code: shared.code
    });
  }, [shared, form]);

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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="/constants" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col flex-1 mb-2">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <Editor
                language="javascript"
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
  );
}