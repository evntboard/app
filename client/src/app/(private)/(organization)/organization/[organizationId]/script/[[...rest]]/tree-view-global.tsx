"use client"

import React, {useState} from "react";
import {useRouter} from "next/navigation";

import {TreeNodeType} from "@/types/tree-node"
import {TreeView} from "@/components/treeView/TreeView";
import {useLocalStorage} from "@/hooks/useLocalStorage";
import {TreeNodeAction} from "@/components/treeView/TreeNode";
import {TreeViewModals} from "@/components/treeView/modals/all";

type Props = {
  node: TreeNodeType,
  organizationId: string,
  scriptType?: 'trigger' | 'shared',
  scriptId?: string
}

export const TreeViewGlobal = ({node, organizationId, scriptId, scriptType}: Props) => {
  const router = useRouter()
  const [openFolders, setOpenFolders] = useLocalStorage<string[]>('open', [])
  const [openModal, setOpenModal] = useState<{ action: TreeNodeAction, entity: TreeNodeType } | undefined>()

  const
    handleOpenFolder = ({slug}: TreeNodeType) => {
      if (openFolders) {
        setOpenFolders([
          ...openFolders,
          slug
        ])
      } else {
        setOpenFolders([
          slug
        ])
      }
    }

  const handleCloseFolder = ({slug}: TreeNodeType) => {
    setOpenFolders(openFolders.filter((itm) => itm !== slug))
  }

  const handleItemClick = (entity: TreeNodeType) => {
    if (entity.type === scriptType && entity.id === scriptId) {
      router.push(`/organization/${organizationId}/script`)
    } else {
      router.push(`/organization/${organizationId}/script/${entity.type}/${entity.id}`)
    }
  }

  const handleContextMenuClick = (action: TreeNodeAction, entity: TreeNodeType) => {
    switch (action) {
      case "create-shared":
        router.push(`/organization/${organizationId}/script/shared/new`)
        break;
      case "create-trigger":
        router.push(`/organization/${organizationId}/script/trigger/new`)
        break;
      default:
        setOpenModal({action, entity})
    }
  }

  const handleModalClose = () => {
    setOpenModal(undefined)
  }

  return (
    <>
      <TreeViewModals
        organizationId={organizationId}
        onClose={handleModalClose}
        action={openModal?.action}
        entity={openModal?.entity}
        scriptType={scriptType}
        scriptId={scriptId}
      />
      <TreeView
        isOpenable
        open={openFolders}
        onClose={handleCloseFolder}
        onOpen={handleOpenFolder}
        isSelectable
        selectedId={scriptId}
        selectedType={scriptType}
        onItemSelect={handleItemClick}
        node={node}
        onContextMenuClick={handleContextMenuClick}
      />
    </>
  )
}