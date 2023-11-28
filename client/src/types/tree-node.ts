export interface TreeNodeType {
    id?: string
    slug: string
    name: string
    type: "folder" | "shared" | "trigger"
    enable?: boolean
    children?: TreeNodeType[]
}