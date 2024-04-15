import { TreeNodeType } from '~/types/tree'
import { TreeNode } from './TreeNode'

type TreeViewProps = {
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

  onContextMenuClick?: (eventData: any, node: TreeNodeType) => void,

  node: TreeNodeType,
}

export const TreeView = ({
  isOpenable = false,
  open,
  onOpen,
  onClose,

  isSelectable = false,
  selectedId,
  selectedType,
  onItemSelect,

  isCheckable = false,
  checked,
  onItemCheck,

  onContextMenuClick,

  node
}: TreeViewProps) => {
  return (
    <div>
      <TreeNode
        path={[]}
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
        node={node}
      />
    </div>
  )
}
