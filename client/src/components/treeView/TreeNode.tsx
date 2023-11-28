'use client'

import React from 'react'
import cx from 'clsx'

import {TreeNodeType} from "@/types/tree-node";

import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger
} from "@/components/ui/context-menu";
import {Icons} from "@/components/icons";

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

export type TreeNodeAction =
    'export'
    | 'import'
    | 'move'
    | 'create-trigger'
    | 'create-shared'
    | 'duplicate'
    | 'disable'
    | 'enable'
    | 'delete'

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

                             onContextMenuClick
                         }: TreeNodeProps) => {
    const t = (r: string): string => r
    const isFolder = node?.type === "folder"
    const isTrigger = node?.type === "trigger"
    const isShared = node?.type === "shared"

    const isOpen = isOpenable ? open?.includes?.(node?.slug) || false : true
    const isChecked = isCheckable && (checked?.includes(node?.slug) || false)
    const isSelected = isSelectable && ((selectedId === node?.id && selectedType === node?.type) || false)

    const handleOnContext = (eventData: TreeNodeAction) => {
        onContextMenuClick?.(eventData, node)
    }

    const openMe = () => {
        if (isOpenable) {
            onOpen?.(node)
        }
    }
    const closeMe = () => {
        if (isOpenable) {
            onClose?.(node)
        }
    }

    const handleOnItemSelect = () => {
        switch (node?.type) {
            case "trigger":
            case "shared":
                if (isSelectable) {
                    onItemSelect?.(node)
                } else if (isCheckable) {
                    onItemCheck?.(!isChecked, node)
                }
                break
            case "folder":
            default:
                if (isOpenable) {
                    if (isOpen) {
                        closeMe()
                    } else {
                        openMe()
                    }
                } else if (isCheckable) {
                    onItemCheck?.(!isChecked, node)
                }
                break
        }
    }

    const handleOnItemCheck = (e: any) => {
        if (isCheckable) {
            e.preventDefault()
            e.stopPropagation()
            onItemCheck?.(e.target.checked, node)
        }
    }

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger
                    className="h-full w-full"
                >
                    <div className={cx(styles.treeNode, {["bg-primary/10"]: isSelected})} onClick={handleOnItemSelect}>
                        {isCheckable && (<input type="checkbox" checked={isChecked} onChange={handleOnItemCheck}/>)}
                        {path?.map((_, idx) => <div key={idx} className={styles.path}/>)}
                        {isFolder && (
                            <div className={styles.icon}>
                                {isOpen && <Icons.down onClick={closeMe}/>}
                                {!isOpen && <Icons.right onClick={openMe}/>}
                            </div>
                        )}
                        <div className={styles.fileIcon}>
                            {isFolder && isOpen && <Icons.folderOpen className='h-5'/>}
                            {isFolder && !isOpen && <Icons.folder className='h-5'/>}
                            {!isFolder && (
                                <div className={styles.container}>
                                    <div
                                        className={cx(styles.icon, {
                                            [styles.enable]: node?.enable,
                                            [styles.disable]: !node?.enable
                                        })}
                                    />
                                    {isShared && <Icons.shared className='h-5'/>}
                                    {isTrigger && <Icons.trigger className='h-5'/>}
                                </div>
                            )}
                        </div>
                        <div className={styles.name}>
                            {node?.name}
                        </div>
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-64">
                    <ContextMenuItem onClick={() => handleOnContext('export')}>
                        <div className='flex flex-1 gap-2 items-center cursor-pointer'>
                            <div><Icons.export className="h-5"/></div>
                            Export
                        </div>
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleOnContext('import')}>
                        <div className='flex flex-1 gap-2 items-center cursor-pointer'>
                            <div><Icons.import className="h-5"/></div>
                            Import
                        </div>
                    </ContextMenuItem>
                    {isFolder && (
                        <ContextMenuItem onClick={() => handleOnContext('move')}>
                            <div className='flex flex-1 gap-2 items-center cursor-pointer'>
                                <div><Icons.move className="h-5"/></div>
                                Move
                            </div>
                        </ContextMenuItem>
                    )}
                    {isFolder && (
                        <ContextMenuSub>
                            <ContextMenuSubTrigger>
                                <div className='flex flex-1 gap-2 items-center cursor-pointer'>
                                    <div><Icons.create className="h-5"/></div>
                                    Create
                                </div>
                            </ContextMenuSubTrigger>
                            <ContextMenuSubContent className="w-48">
                                <ContextMenuItem onClick={() => handleOnContext('create-trigger')}>
                                    <div className='flex flex-1 gap-2 items-center cursor-pointer'>
                                        <div><Icons.create className="h-5"/></div>
                                        Trigger
                                    </div>
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => handleOnContext('create-shared')}>
                                    <div className='flex flex-1 gap-2 items-center cursor-pointer'>
                                        <div><Icons.create className="h-5"/></div>
                                        Shared
                                    </div>
                                </ContextMenuItem>
                            </ContextMenuSubContent>
                        </ContextMenuSub>
                    )}
                    <ContextMenuItem onClick={() => handleOnContext('duplicate')}>
                        <div className='flex flex-1 gap-2 items-center cursor-pointer'>
                            <div><Icons.duplicate className="h-5"/></div>
                            Duplicate
                        </div>
                    </ContextMenuItem>
                    {!isFolder && node?.enable && (
                        <ContextMenuItem onClick={() => handleOnContext('disable')}>
                            <div className='flex flex-1 gap-2 items-center cursor-pointer'>
                                <div><Icons.disable className="h-5"/></div>
                                Disable
                            </div>
                        </ContextMenuItem>
                    )}
                    {!isFolder && !node?.enable && (
                        <ContextMenuItem onClick={() => handleOnContext('enable')}>
                            <div className='flex flex-1 gap-2 items-center cursor-pointer'>
                                <div><Icons.enable className="h-5"/></div>
                                Enable
                            </div>
                        </ContextMenuItem>
                    )}
                    {isFolder && (
                        <ContextMenuItem onClick={() => handleOnContext('disable')}>
                            <div className='flex flex-1 gap-2 items-center cursor-pointer'>
                                <div><Icons.disable className="h-5"/></div>
                                Disable folder
                            </div>
                        </ContextMenuItem>
                    )}
                    {isFolder && (
                        <ContextMenuItem onClick={() => handleOnContext('enable')}>
                            <div className='flex flex-1 gap-2 items-center cursor-pointer'>
                                <div><Icons.enable className="h-5"/></div>
                                Enable folder
                            </div>
                        </ContextMenuItem>
                    )}
                    <ContextMenuItem onClick={() => handleOnContext('delete')}>
                        <div className='flex flex-1 gap-2 items-center cursor-pointer'>
                            <div><Icons.delete className="h-5"/></div>
                            Delete
                        </div>
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
            {isFolder && isOpen && node?.children?.map((nodeChildren, idx) => (
                <TreeNode
                    key={nodeChildren?.id ? `${nodeChildren?.type}:${nodeChildren?.id}` : nodeChildren?.slug}
                    path={[...path, "" + idx]}
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
