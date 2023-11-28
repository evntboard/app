import {Shared, Trigger} from "@prisma/client";
import {TreeNodeType} from "@/types/tree-node";

type ReduceData = {
  data: TreeNodeType[],
  slug: string[]
}

function recursiveSort(nodes: TreeNodeType[]) {
  nodes.sort((a, b) => {
    if ((a.type === "folder" && b.type === "folder") ||
      (a.type === "shared" && b.type === "shared") ||
      (a.type === "trigger" && b.type === "trigger")) {
      return a.slug < b.slug ? -1 : 1;
    }

    if (a.type === "folder" && b.type !== "folder") {
      return -1;
    }

    if (a.type !== "folder" && b.type === "folder") {
      return 1;
    }

    if (a.type === "shared" && b.type === "trigger") {
      return -1;
    }

    if (a.type === "trigger" && b.type === "shared") {
      return 1;
    }

    return 0;
  });

  for (const node of nodes) {
    if (node.type === "folder" && node.children) {
      node.children = recursiveSort(node.children);
    }
  }

  return nodes;
}

const generateNode = (root: TreeNodeType, entityType: "shared" | "trigger") => {
  return (currentEntity: Shared | Trigger) => {
    const pathSplit = currentEntity.name.substring(1).split('/') // example ['test', 'test']

    pathSplit.reduce<ReduceData>((pathData, current, index, array): ReduceData => {
      const isFolder = index !== (array.length - 1)

      if (isFolder) {
        const slug = pathData.slug.join('/') + `/${current}/`

        let newDataIndex = pathData.data.findIndex((item) => item.slug === slug && Object.hasOwn(item, 'children'))

        if (newDataIndex === -1) {
          newDataIndex = pathData.data.length

          const newNode: TreeNodeType = {
            type: 'folder',
            slug,
            name: current,
            children: []
          }

          pathData.data.push(newNode)
        }

        return {
          slug: [
            ...pathData.slug,
            current
          ],
          data: pathData.data[newDataIndex].children ?? []
        }
      }

      const slug = pathData.slug.join('/') + `/${current}`

      pathData.data.push({
        id: currentEntity.id ?? undefined,
        slug,
        name: current,
        type: entityType,
        enable: currentEntity.enable ?? false
      })

      return pathData
    }, {slug: [''], data: root.children ?? []})
  }
}

export function generateTree(path: string, triggers: Trigger[], shareds: Shared[]) {
  let rootName = "root";

  if (path !== "/") {
    rootName = path;
  }

  const root: TreeNodeType = {
    slug: path,
    name: rootName,
    type: "folder",
    children: [],
  };


  triggers
    .filter((data) => !!data.name)
    .forEach(generateNode(root, 'trigger'))

  shareds
    .filter((data) => !!data.name)
    .forEach(generateNode(root, 'shared'))

  return {
    ...root,
    children: recursiveSort(root.children ?? [])
  }
}


export function generateOptions(path: string, triggers: Trigger[], shareds: Shared[]) {
  return [
    ...triggers.map(({id, name}) => ({
      key: `trigger:${id}`,
      label: name
    })),
    ...shareds.map(({id, name}) => ({
      key: `shared:${id}`,
      label: name
    }))
  ]
}
