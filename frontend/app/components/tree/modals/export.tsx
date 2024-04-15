import { TreeNodeType, TreeNodeAction } from '~/types/tree'
import { TreeView } from '~/components/tree/TreeView'
import { Button } from '~/components/ui/button'
import { ScrollArea } from '~/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

type Props = {
  organizationId: string,
  entity: TreeNodeType,
  action: TreeNodeAction,
  onClose: () => void
}

export const ExportModal = ({ organizationId, entity, action, onClose }: Props) => {
  const handleOnClick = () => {
    const searchParams = new URLSearchParams()
    searchParams.set('path', entity.slug)
    window.open(`/organizations/${organizationId}/script/export/?${searchParams.toString()}`, '_blank')
    //  TODO TOAST
    onClose()
  }

  return (
    <Dialog open={action === 'export'} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export {entity.type}</DialogTitle>
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
        <DialogFooter className="flex flex-col gap-2 px-1">
          <Button
            onClick={handleOnClick}
            className="cursor-pointer"
          >
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}