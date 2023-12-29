import React from "react";
import {saveAs} from 'file-saver';
import ky, {HTTPError} from "ky";
import {useRouter} from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {TreeNodeType} from "@/types/tree-node";
import {TreeNodeAction} from "@/components/treeView/TreeNode";
import {toast} from "@/components/ui/use-toast";
import {Icons} from "@/components/icons";
import {TreeView} from "@/components/treeView/TreeView";

type Props = {
  organizationId: string,
  entity: TreeNodeType,
  action: TreeNodeAction,
  onClose: () => void
}

export const ExportModal = ({organizationId, entity, action, onClose}: Props) => {
  const router = useRouter()
  const [isSaving, setIsSaving] = React.useState<boolean>(false)

  const handleOk = async () => {
    setIsSaving(true)
    try {
      switch (entity.type) {
        case "shared": {
          const response = await ky.get(`/api/organization/${organizationId}/shared/${entity?.id}/export`)
          const data = await response.json()
          const blob = new Blob([JSON.stringify(data)], {type: "application/json;charset=utf-8"});
          saveAs(blob, `export-evntboard-shared-${new Date().toISOString()}.json`);
          break;
        }
        case "trigger": {
          const response = await ky.get(`/api/organization/${organizationId}/trigger/${entity?.id}/export`)
          const data = await response.json()
          const blob = new Blob([JSON.stringify(data)], {type: "application/json;charset=utf-8"});
          saveAs(blob, `export-evntboard-trigger-${new Date().toISOString()}.json`);
          break;
        }
        case "folder":
          const response = await ky.get(`/api/organization/${organizationId}/tree/export?path=${entity.slug}`)
          const data = await response.json()
          const blob = new Blob([JSON.stringify(data)], {type: "application/json;charset=utf-8"});
          saveAs(blob, `export-evntboard-${new Date().toISOString()}.json`);
          break;
      }
      onClose()
    } catch (e) {
      if (e instanceof HTTPError) {
        toast({
          title: "Something went wrong.",
          description: "Your export was not effective. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSaving(false)
      router.refresh()
    }
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
          <TreeView
            node={entity}
          />
        )}
        {entity.type === 'trigger' && (
          <span>Trigger {entity.name} going to be exported</span>
        )}
        {entity.type === 'shared' && (
          <span>Shared {entity.name} going to be exported</span>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="default"
            onClick={handleOk}
            disabled={isSaving}
          >
            {isSaving && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin"/>
            )}
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}