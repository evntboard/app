import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect } from 'react';
import { ActionFunctionArgs } from '@remix-run/node';
import { useFetcher, useParams } from '@remix-run/react';
import { zodResolver } from '@hookform/resolvers/zod';

import { moduleParamCreateFormSchema } from '~/validation/module';
import { createSession, getPocketbase, getUser } from '~/utils/pb.server';
import { cn } from '~/utils/cn';
import { Button } from '~/components/ui/button';
import { Icons } from '~/components/icons';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { Editor } from '~/components/editor';

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

  return null;
}

export default function OrganizationIdScriptLayout() {
  const { organizationId, moduleId } = useParams();
  const fetcher = useFetcher<{
    errors?: Record<string, { type: string, message: string }>
  }>();

  const resolver = zodResolver(moduleParamCreateFormSchema);
  const form = useForm<z.infer<typeof moduleParamCreateFormSchema>>({
    resolver,
    defaultValues: {
      key: '',
      value: JSON.stringify(null)
    }
  });

  const onSubmit = (data: z.infer<typeof moduleParamCreateFormSchema>) => {
    fetcher.submit(
      {
        key: data.key,
        value: data.value,
        _action: 'create'
      },
      {
        action: `/organizations/${organizationId}/modules/${moduleId}/params`,
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
  );
}


