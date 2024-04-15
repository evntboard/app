import { TreeNodeAction, TreeNodeType } from '~/types/tree'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TreeViewModals } from '~/components/tree/modals/all'
import { TreeView } from '~/components/tree/TreeView'
import { useFetcher } from '@remix-run/react'


type Props = {
  node: TreeNodeType,
  organizationId: string,
  scriptType?: 'trigger' | 'condition' | 'shared' | undefined
  scriptId?: string | undefined
  defaultOpen: string[]
  hasWriteAccess: boolean
}

export const TreeViewGlobal = ({ node, organizationId, scriptId, scriptType, defaultOpen, hasWriteAccess }: Props) => {
  const fetcher = useFetcher()
  const navigate = useNavigate()
  const [openFolders, setOpenFolders] = useState<string[]>(defaultOpen)
  const [openModal, setOpenModal] = useState<{ action: TreeNodeAction, entity: TreeNodeType } | undefined>()
  const handleOpenFolder = ({ slug }: TreeNodeType) => {
    let newOpenFolder = []
    if (openFolders) {
      newOpenFolder = [
        ...openFolders,
        slug,
      ]
    } else {
      newOpenFolder = [slug]
    }
    setOpenFolders(newOpenFolder)
    sendOpenToServer(newOpenFolder)
  }

  const sendOpenToServer = (newOpenFolder: string[]) => {
    const formData = new FormData()
    formData.append('data', JSON.stringify(newOpenFolder))
    formData.append('_action', 'open')
    fetcher.submit(formData, { action: `/organizations/${organizationId}/script`, method: 'post' })
  }

  const handleCloseFolder = ({ slug }: TreeNodeType) => {
    const newOpenFolder = openFolders.filter((itm) => itm !== slug)
    setOpenFolders(newOpenFolder)
    sendOpenToServer(newOpenFolder)
  }

  const handleItemClick = (entity: TreeNodeType) => {
    if (entity.type === scriptType && entity.id === scriptId) {
      navigate(`/organizations/${organizationId}/script`)
    } else {
      if (entity.type === 'condition') {
        navigate(`/organizations/${organizationId}/script/trigger/${entity.slug}/conditions/${entity.id}`)
      } else {
        navigate(`/organizations/${organizationId}/script/${entity.type}/${entity.id}`)
      }
    }
  }

  const handleContextMenuClick = (action: TreeNodeAction, entity: TreeNodeType) => {
    setOpenModal({ action, entity })
  }

  const handleModalClose = () => {
    setOpenModal(undefined)
  }

  return (
    <>
      <TreeViewModals
        hasWriteAccess={hasWriteAccess}
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