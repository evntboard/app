import { useEffect } from 'react';
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
import { cn } from '~/utils/cn';
import { Input } from '~/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { folderMoveFormSchema } from '~/validation/folder';
import { ScrollArea } from '~/components/ui/scroll-area';


type Props = {
  organizationId: string,
  entity: TreeNodeType,
  action: TreeNodeAction,
  onClose: () => void
}

export const MoveModal = ({ organizationId, entity, action, onClose }: Props) => {
  const fetcher = useFetcher<{
    errors?: Record<string, { type: string, message: string }>
  }>();

  const resolver = zodResolver(folderMoveFormSchema);
  const form = useForm<z.infer<typeof folderMoveFormSchema>>({
    resolver,
    defaultValues: {
      path: entity.slug,
      targetPath: `${entity.slug}-new/`
    }
  });

  const onSubmit = (data: z.infer<typeof folderMoveFormSchema>) => {
    fetcher.submit(
      {
        ...data,
        _action: 'move'
      },
      {
        action: `/organizations/${organizationId}/script/folder`,
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
    <Dialog open={action === 'move'} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <fetcher.Form
            className="flex flex-col gap-2 px-1"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <DialogHeader>
              <DialogTitle>Move a folder</DialogTitle>
              <DialogDescription>
              </DialogDescription>
            </DialogHeader>
            <FormField
              control={form.control}
              name="targetPath"
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
            <ScrollArea className="h-60 my-4">
              <TreeView
                node={entity}
              />
            </ScrollArea>
            {fetcher.data?.errors?.global && (
              <p className={cn('text-sm font-medium text-destructive')}>
                {fetcher.data?.errors?.global?.message}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" className="flex gap-2">
                Move
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