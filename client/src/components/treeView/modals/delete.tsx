import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import React from "react";
import {TreeNodeType} from "@/types/tree-node";
import {TreeNodeAction} from "@/components/treeView/TreeNode";
import ky, {HTTPError} from "ky";
import {toast} from "@/components/ui/use-toast";
import {Icons} from "@/components/icons";
import {useRouter} from "next/navigation";
import {TreeView} from "@/components/treeView/TreeView";

type Props = {
  scriptType?: string,
  scriptId?: string,
  organizationId: string,
  entity: TreeNodeType,
  action: TreeNodeAction,
  onClose: () => void
}

export const DeleteModal = ({organizationId, scriptId, scriptType, entity, action, onClose}: Props) => {
  const router = useRouter()
  const [isSaving, setIsSaving] = React.useState<boolean>(false)

  const handleOk = async () => {
    setIsSaving(true)
    try {
      switch (entity.type) {
        case "shared": {
          await ky.delete(`/api/organization/${organizationId}/shared/${entity?.id}`)
          break;
        }
        case "trigger": {
          await ky.delete(`/api/organization/${organizationId}/trigger/${entity?.id}`)
          break;
        }
        case "folder":
          await ky.delete(`/api/organization/${organizationId}/tree?path=${entity.slug}`)
          break;
      }

      if (entity.type !== 'folder') {
        if (scriptType && scriptType === entity.type && scriptId && scriptId === entity.id) {
          router.push(`/organization/${organizationId}/script`)
        }
      } else {
        if (scriptType && scriptId) {
          router.push(`/organization/${organizationId}/script`)
        }
      }

      onClose()
    } catch (e) {
      if (e instanceof HTTPError) {
        toast({
          title: "Something went wrong.",
          description: "Your organization was not created. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSaving(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={action === 'delete'} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete {entity.type}</DialogTitle>
          <DialogDescription>
          </DialogDescription>
        </DialogHeader>
        {entity.type === 'folder'&& (
          <TreeView
            node={entity}
          />
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            onClick={handleOk}
            disabled={isSaving}
          >
            {isSaving && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin"/>
            )}
            Do it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}