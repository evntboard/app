import { useEffect, useMemo } from 'react';
import { useFetcher } from 'react-router-dom';

import { TreeNodeAction, TreeNodeType } from '~/types/tree';
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
import { TreeView } from '~/components/tree/TreeView';
import { Input } from '~/components/ui/input';
import { cn } from '~/utils/cn';
import { zodResolver } from '@hookform/resolvers/zod';
import { sharedDuplicateFormSchema } from '~/validation/shared';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form';
import { triggerConditionDuplicateFormSchema, triggerDuplicateFormSchema } from '~/validation/trigger';
import { folderDuplicateFormSchema } from '~/validation/folder';
import { ScrollArea } from '~/components/ui/scroll-area';

type Props = {
  organizationId: string,
  entity: TreeNodeType,
  action: TreeNodeAction,
  onClose: () => void
}

type duplicateFormSchema =
  z.infer<typeof folderDuplicateFormSchema>
  | z.infer<typeof sharedDuplicateFormSchema>
  | z.infer<typeof triggerDuplicateFormSchema>
  | z.infer<typeof triggerConditionDuplicateFormSchema>

export const DuplicateModal = ({ organizationId, entity, action, onClose }: Props) => {
  const fetcher = useFetcher<{
    errors?: Record<string, { type: string, message: string }>
  }>();

  const formAction = useMemo(() => {
    switch (entity.type) {
      case 'folder':
        return `/organizations/${organizationId}/script/folder`
      case 'condition':
        return `/organizations/${organizationId}/script/trigger/${entity.slug}/conditions/${entity.id}`;
      case 'trigger':
      case 'shared':
      default:
        return `/organizations/${organizationId}/script/${entity.type}/${entity.id}`;
    }
  }, [entity, organizationId])

  const resolver = useMemo(() => {
    switch (entity.type) {
      case 'folder':
        return zodResolver(folderDuplicateFormSchema);
      case 'shared':
        return zodResolver(sharedDuplicateFormSchema);
      case 'trigger':
        return zodResolver(triggerDuplicateFormSchema);
      case 'condition':
        return zodResolver(triggerConditionDuplicateFormSchema);
    }
  }, [entity.type]);

  const defaultValues = useMemo(() => {
    switch (entity.type) {
      case 'folder':
        return ({
          path: entity.slug,
          targetPath: `${entity.slug.slice(0, -1)}-new/`
        });
      case 'shared':
        return ({
          targetPath: `${entity.slug}-dup`
        });
      case 'trigger':
        return ({
          targetPath: `${entity.slug}-dup`
        });
      case 'condition':
        return ({
          targetPath: `${entity.name}-dup`
        });
    }
  }, [entity]);

  const form = useForm<duplicateFormSchema>({
    resolver,
    defaultValues
  });

  const onSubmit = (data: duplicateFormSchema) => {
    fetcher.submit(
      {
        ...data,
        _action: 'duplicate'
      },
      {
        action: formAction,
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
    <Dialog open={action === 'duplicate'} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <fetcher.Form
            className="flex flex-col gap-2 px-1"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <DialogHeader>
              <DialogTitle>Duplicate a {entity.type}</DialogTitle>
              <DialogDescription>
              </DialogDescription>
            </DialogHeader>
            <FormField
              control={form.control}
              name="targetPath"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target path</FormLabel>
                  <FormControl>
                    <Input placeholder="/new/" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {entity.type === 'folder' && (
              <ScrollArea className="h-60 my-4">
                <TreeView
                  node={entity}
                />
              </ScrollArea>
            )}
            {fetcher.data?.errors?.global && (
              <p className={cn('text-sm font-medium text-destructive')}>
                {fetcher.data?.errors?.global?.message}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" className="flex gap-2">
                Duplicate
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