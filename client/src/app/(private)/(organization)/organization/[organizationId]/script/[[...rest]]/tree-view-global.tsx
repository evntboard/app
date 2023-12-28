"use client"

import React, {useState} from "react";
import {useRouter} from "next/navigation";

import {TreeNodeType} from "@/types/tree-node"
import {TreeView} from "@/components/treeView/TreeView";
import {TreeNodeAction} from "@/components/treeView/TreeNode";
import {TreeViewModals} from "@/components/treeView/modals/all";
import {setToCookie} from "@/lib/cookie/set";

type Props = {
  node: TreeNodeType,
  organizationId: string,
  scriptType?: 'trigger' | 'shared',
  scriptId?: string
  defaultOpen: string[]
}

export const TreeViewGlobal = ({node, organizationId, scriptId, scriptType, defaultOpen}: Props) => {
  const router = useRouter()
  const [openFolders, setOpenFolders] = useState<string[]>(defaultOpen)
  const [openModal, setOpenModal] = useState<{ action: TreeNodeAction, entity: TreeNodeType } | undefined>()

  const handleOpenFolder = ({slug}: TreeNodeType) => {
      if (openFolders) {
        const newOpenFolder = [
          ...openFolders,
          slug
        ]
        setToCookie("evntboard:open", newOpenFolder)
        setOpenFolders(newOpenFolder)
      } else {
        const newOpenFolder = [slug]
        setToCookie("evntboard:open", newOpenFolder)
        setOpenFolders(newOpenFolder)
      }
    }

  const handleCloseFolder = ({slug}: TreeNodeType) => {
    const newOpenFolder = openFolders.filter((itm) => itm !== slug)
    setToCookie("evntboard:open", newOpenFolder)
    setOpenFolders(newOpenFolder)
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