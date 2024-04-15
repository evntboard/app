import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { TreeNodeType, TreeNodeAction } from '~/types/tree'
import { TreeView } from '~/components/tree/TreeView'
import { useFetcher } from 'react-router-dom'
import { cn } from '~/utils/cn'
import { Button, buttonVariants } from '~/components/ui/button'
import { Icons } from '~/components/icons'
import { useEffect, useMemo } from 'react'
import { ScrollArea } from '~/components/ui/scroll-area';

type Props = {
  organizationId: string,
  entity: TreeNodeType,
  action: TreeNodeAction,
  onClose: () => void
}

export const EnableModal = ({ organizationId, entity, action, onClose }: Props) => {
  const fetcher = useFetcher()

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

  useEffect(() => {
    if (fetcher.state === "loading" && !fetcher.data?.errors) {
      onClose();
    }
  }, [fetcher.state, fetcher.data, onClose]);

  return (
    <Dialog open={action === 'enable'} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enable {entity.type}</DialogTitle>
          <DialogDescription>
          </DialogDescription>
        </DialogHeader>
        {entity.type === 'folder' && (
          <ScrollArea className="h-60 my-4">
            <TreeView
              node={entity}
            />
          </ScrollArea>
        )}
        <DialogFooter>
          <fetcher.Form
            method="POST"
            action={formAction}
            className="flex flex-col gap-2 px-1"
          >
            {entity.type === 'folder' && (<input type="hidden" name="path" value={entity.slug} />)}
            <Button type="submit" className={cn(buttonVariants())} variant="destructive" name="_action" value="enable">
              Enable
              <Icons.loader
                className={cn('animate-spin', { hidden: fetcher.state === 'idle' })}
              />
            </Button>
          </fetcher.Form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}