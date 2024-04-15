export interface TreeNodeType {
  id?: string
  slug: string
  name: string
  type: "folder" | "shared" | "trigger" | "condition"
  enable?: boolean
  children?: TreeNodeType[]
}

export type TreeNodeAction =
  'export'
  | 'import'
  | 'move'
  | 'create-trigger'
  | 'create-shared'
  | 'create-condition'
  | 'duplicate'
  | 'disable'
  | 'enable'
  | 'delete'