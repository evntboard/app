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
  organizationId: string,
  entity: TreeNodeType,
  action: TreeNodeAction,
  onClose: () => void
}

export const EnableModal = ({organizationId, entity, action, onClose}: Props) => {
  const router = useRouter()
  const [isSaving, setIsSaving] = React.useState<boolean>(false)

  const handleOk = async () => {
    setIsSaving(true)
    try {
      switch (entity.type) {
        case "shared": {
          await ky.get(`/api/organization/${organizationId}/shared/${entity?.id}/enable`)
          break;
        }
        case "trigger": {
          await ky.get(`/api/organization/${organizationId}/trigger/${entity?.id}/enable`)
          break;
        }
        case "folder":
          await ky.get(`/api/organization/${organizationId}/tree/enable?path=${entity.slug}`)
          break;
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
    <Dialog open={action === 'enable'} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enable {entity.type}</DialogTitle>
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