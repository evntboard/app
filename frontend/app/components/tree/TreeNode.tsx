import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '~/components/ui/context-menu'
import { Icons } from '~/components/icons'
import { cn } from '~/utils/cn'
import { TreeNodeAction, TreeNodeType } from '~/types/tree'

import styles from './treenode.module.scss'

type TreeNodeProps = {
  isOpenable?: boolean,
  open?: string[],
  onOpen?: (node: TreeNodeType) => void,
  onClose?: (node: TreeNodeType) => void,

  isSelectable?: boolean,
  selectedId?: string,
  selectedType?: string,
  onItemSelect?: (node: TreeNodeType) => void,

  isCheckable?: boolean,
  checked?: string[],
  onItemCheck?: (check: boolean, node: TreeNodeType) => void,

  onContextMenuClick?: (action: TreeNodeAction, node: TreeNodeType) => void,

  node: TreeNodeType,
  path: string[]
}

export const TreeNode = ({
                           node,
                           path,

                           isOpenable,
                           open,
                           onOpen,
                           onClose,

                           isCheckable,
                           checked,
                           onItemCheck,

                           isSelectable,
                           selectedId,
                           selectedType,
                           onItemSelect,

                           onContextMenuClick,
                         }: TreeNodeProps) => {
  const isFolder = node?.type === 'folder'
  const isTrigger = node?.type === 'trigger'
  const isShared = node?.type === 'shared'
  const isCondition = node?.type === 'condition'
  const hasChildren = (node?.children?.length ?? 0) > 0

  const isOpen = isOpenable ? open?.includes?.(node?.slug) || false : true
  const isChecked = isCheckable && (checked?.includes(node?.slug) || false)
  const isSelected = isSelectable && ((selectedId === node?.id && selectedType === node?.type) || false)

  const handleOnContext = (eventData: TreeNodeAction) => {
    onContextMenuClick?.(eventData, node)
  }

  const openMe = (e: React.MouseEvent<unknown>) => {
    e.stopPropagation()
    if (isOpenable) {
      if (!isTrigger || (isTrigger && (node?.children?.length ?? 0) > 0)) {
        onOpen?.(node)
      }
    }
  }
  const closeMe = (e: React.MouseEvent<unknown>) => {
    e.stopPropagation()
    if (isOpenable) {
      if (!isTrigger || (isTrigger && (node?.children?.length ?? 0) > 0)) {
        onClose?.(node)
      }
    }
  }

  const handleOnItemSelect = (e: React.MouseEvent<unknown>) => {
    switch (node?.type) {
      case 'trigger':
      case 'condition':
      case 'shared':
        if (isSelectable) {
          onItemSelect?.(node)
        } else if (isCheckable) {
          onItemCheck?.(!isChecked, node)
        }
        break
      case 'folder':
      default:
        if (isOpenable) {
          if (isOpen) {
            closeMe(e)
          } else {
            openMe(e)
          }
        } else if (isCheckable) {
          onItemCheck?.(!isChecked, node)
        }
        break
    }
  }

  const handleOnItemCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isCheckable) {
      e.preventDefault()
      e.stopPropagation()
      onItemCheck?.(e.target.checked, node)
    }
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger className="h-full w-full">
          <div className={cn(styles.treeNode, { ['bg-primary/10']: isSelected })} onClick={handleOnItemSelect}>
            {isCheckable && (<input type="checkbox" checked={isChecked} onChange={handleOnItemCheck} />)}
            {path?.map((_, idx) => <div key={idx} className={styles.path} />)}
            {isFolder && (
              <div className={styles.icon}>
                {isOpen && <Icons.down onClick={closeMe} />}
                {!isOpen && <Icons.right onClick={openMe} />}
              </div>
            )}
            <div className={styles.fileIcon}>
              {isFolder && isOpen && <Icons.folderOpen className="h-5" />}
              {isFolder && !isOpen && <Icons.folder className="h-5" />}
              {!isFolder && (
                <div className={styles.container}>
                  <div
                    className={cn(styles.icon, {
                      [styles.enable]: node?.enable,
                      [styles.disable]: !node?.enable,
                    })}
                  />
                  {isShared && <Icons.shared className="h-5" />}
                  {isTrigger && <Icons.trigger className="h-5" />}
                  {isCondition && <Icons.triggerCondition className="h-5" />}
                </div>
              )}
              {isTrigger && (
                <div className={cn(styles.iconTrigger, { [styles.disabled]: !hasChildren })}>
                  {isOpen && hasChildren && <Icons.down onClick={closeMe} />}
                  {(!isOpen || !hasChildren) && <Icons.right onClick={openMe} />}
                </div>
              )}
            </div>
            <div className={styles.name}>
              {node?.name}
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          {!isCondition && (<ContextMenuItem onClick={() => handleOnContext('export')}>
              <div className="flex flex-1 gap-2 items-center cursor-pointer">
                <div><Icons.export className="h-5" /></div>
                Export
              </div>
            </ContextMenuItem>
          )}
          {!isCondition && (<ContextMenuItem onClick={() => handleOnContext('import')}>
              <div className="flex flex-1 gap-2 items-center cursor-pointer">
                <div><Icons.import className="h-5" /></div>
                Import
              </div>
            </ContextMenuItem>
          )}
          {isFolder && (
            <ContextMenuItem onClick={() => handleOnContext('move')}>
              <div className="flex flex-1 gap-2 items-center cursor-pointer">
                <div><Icons.move className="h-5" /></div>
                Move
              </div>
            </ContextMenuItem>
          )}
          {isFolder && (
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <div className="flex flex-1 gap-2 items-center cursor-pointer">
                  <div><Icons.create className="h-5" /></div>
                  Create
                </div>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuItem onClick={() => handleOnContext('create-trigger')}>
                  <div className="flex flex-1 gap-2 items-center cursor-pointer">
                    <div><Icons.createScript className="h-5" /></div>
                    Trigger
                  </div>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleOnContext('create-shared')}>
                  <div className="flex flex-1 gap-2 items-center cursor-pointer">
                    <div><Icons.createScript className="h-5" /></div>
                    Shared
                  </div>
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}
          {isTrigger && (
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <div className="flex flex-1 gap-2 items-center cursor-pointer">
                  <div><Icons.create className="h-5" /></div>
                  Create
                </div>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuItem onClick={() => handleOnContext('create-condition')}>
                  <div className="flex flex-1 gap-2 items-center cursor-pointer">
                    <div><Icons.createScript className="h-5" /></div>
                    Condition
                  </div>
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}
          <ContextMenuItem onClick={() => handleOnContext('duplicate')}>
            <div className="flex flex-1 gap-2 items-center cursor-pointer">
              <div><Icons.duplicate className="h-5" /></div>
              Duplicate
            </div>
          </ContextMenuItem>
          {!isFolder && node?.enable && (
            <ContextMenuItem onClick={() => handleOnContext('disable')}>
              <div className="flex flex-1 gap-2 items-center cursor-pointer">
                <div><Icons.disable className="h-5" /></div>
                Disable
              </div>
            </ContextMenuItem>
          )}
          {!isFolder && !node?.enable && (
            <ContextMenuItem onClick={() => handleOnContext('enable')}>
              <div className="flex flex-1 gap-2 items-center cursor-pointer">
                <div><Icons.enable className="h-5" /></div>
                Enable
              </div>
            </ContextMenuItem>
          )}
          {isFolder && (
            <ContextMenuItem onClick={() => handleOnContext('disable')}>
              <div className="flex flex-1 gap-2 items-center cursor-pointer">
                <div><Icons.disable className="h-5" /></div>
                Disable folder
              </div>
            </ContextMenuItem>
          )}
          {isFolder && (
            <ContextMenuItem onClick={() => handleOnContext('enable')}>
              <div className="flex flex-1 gap-2 items-center cursor-pointer">
                <div><Icons.enable className="h-5" /></div>
                Enable folder
              </div>
            </ContextMenuItem>
          )}
          <ContextMenuItem onClick={() => handleOnContext('delete')}>
            <div className="flex flex-1 gap-2 items-center cursor-pointer">
              <div><Icons.delete className="h-5" /></div>
              Delete
            </div>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {(isFolder || isTrigger) && isOpen && node?.children?.map((nodeChildren, idx) => (
        <TreeNode
          key={nodeChildren?.id ? `${nodeChildren?.type}:${nodeChildren?.id}` : nodeChildren?.slug}
          path={[...path, '' + idx]}
          node={nodeChildren}
          isOpenable={isOpenable}
          open={open}
          onOpen={onOpen}
          onClose={onClose}
          isSelectable={isSelectable}
          selectedId={selectedId}
          selectedType={selectedType}
          onItemSelect={onItemSelect}
          isCheckable={isCheckable}
          checked={checked}
          onItemCheck={onItemCheck}
          onContextMenuClick={onContextMenuClick}
        />
      ))}
    </>
  )
}
