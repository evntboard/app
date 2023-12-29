import React from "react";

import {TreeNodeType} from "@/types/tree-node";
import {TreeNodeAction} from "@/components/treeView/TreeNode";
import {DeleteModal} from "@/components/treeView/modals/delete";
import {DisableModal} from "@/components/treeView/modals/disable";
import {DuplicateModal} from "@/components/treeView/modals/duplicate";
import {EnableModal} from "@/components/treeView/modals/enable";
import {ExportModal} from "@/components/treeView/modals/export";
import {ImportModal} from "@/components/treeView/modals/import";
import {MoveModal} from "@/components/treeView/modals/move";

type Props = {
  hasWriteAccess: boolean,
  organizationId: string,
  scriptType?: string,
  scriptId?: string,
  entity?: TreeNodeType,
  action?: TreeNodeAction,
  onClose: () => void
}

export const TreeViewModals = ({organizationId, scriptId, scriptType, entity, action, onClose, hasWriteAccess}: Props) => {

  if (!entity || !action) {
    return null
  }

  return (
    <>
      <DeleteModal
        organizationId={organizationId}
        entity={entity}
        onClose={onClose}
        action={action}
        scriptType={scriptType}
        scriptId={scriptId}
      />
      <DisableModal
        organizationId={organizationId}
        entity={entity}
        onClose={onClose}
        action={action}
      />
      <DuplicateModal
        organizationId={organizationId}
        entity={entity}
        onClose={onClose}
        action={action}
      />
      <EnableModal
        organizationId={organizationId}
        entity={entity}
        onClose={onClose}
        action={action}
      />
      <ExportModal
        organizationId={organizationId}
        entity={entity}
        onClose={onClose}
        action={action}
      />
      <ImportModal
        hasWriteAccess={hasWriteAccess}
        organizationId={organizationId}
        entity={entity}
        onClose={onClose}
        action={action}
      />
      <MoveModal
        organizationId={organizationId}
        entity={entity}
        onClose={onClose}
        action={action}
      />
    </>
  )
}