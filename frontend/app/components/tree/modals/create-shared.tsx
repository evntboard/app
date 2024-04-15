import { useFetcher } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Icons } from '~/components/icons';
import { Input } from '~/components/ui/input';
import { cn } from '~/utils/cn';
import { TreeNodeAction, TreeNodeType } from '~/types/tree';
import { zodResolver } from '@hookform/resolvers/zod';
import { sharedCreateFormSchema } from '~/validation/shared';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form';

type Props = {
  organizationId: string,
  entity: TreeNodeType,
  action: TreeNodeAction,
  onClose: () => void
}

export const CreateSharedModal = ({ entity, organizationId, action, onClose }: Props) => {
  const fetcher = useFetcher<{
    errors?: Record<string, { type: string, message: string }>
  }>();
  const resolver = zodResolver(sharedCreateFormSchema);
  const form = useForm<z.infer<typeof sharedCreateFormSchema>>({
    resolver,
    defaultValues: {
      name: `${entity.slug}new-shared`
    }
  });

  const onSubmit = (data: z.infer<typeof sharedCreateFormSchema>) => {
    fetcher.submit(
      {
        ...data,
        _action: 'create'
      },
      {
        action: `/organizations/${organizationId}/script/shared`,
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
    if (fetcher.state === "loading" && !fetcher.data?.errors) {
      onClose();
    }
  }, [fetcher.state, fetcher.data, onClose]);

  return (
    <Dialog open={action === 'create-shared'} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <fetcher.Form
            className="flex flex-col gap-2 px-1"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <DialogHeader>
              <DialogTitle>Create a new shared</DialogTitle>
              <DialogDescription>
              </DialogDescription>
            </DialogHeader>
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
            {fetcher.data?.errors?.global && (
              <p className={cn('text-sm font-medium text-destructive')}>
                {fetcher.data?.errors?.global?.message}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" className="flex gap-2">
                Create
                <Icons.loader
                  className={cn('animate-spin', { hidden: fetcher.state === 'idle' })}
                />
              </Button>
            </DialogFooter>
          </fetcher.Form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};