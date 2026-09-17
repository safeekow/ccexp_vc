import * as path from 'path';

export interface PathTreeNode<T extends { path: string }> {
  label: string;
  path: string;
  children: PathTreeNode<T>[];
  item?: T;
}

export function buildPathTree<T extends { path: string }>(
  items: T[],
  basePath: string
): PathTreeNode<T>[] {
  const root: PathTreeNode<T>[] = [];

  for (const item of items) {
    const relativePath = getRelativePath(basePath, item.path);
    const segments = relativePath.split(path.sep).filter(Boolean);

    if (segments.length === 0) {
      continue;
    }

    let currentLevel = root;
    let currentPath = '';

    for (const [index, segment] of segments.entries()) {
      currentPath = currentPath ? path.join(currentPath, segment) : segment;
      let node = currentLevel.find((currentNode) => currentNode.label === segment);

      if (!node) {
        node = {
          label: segment,
          path: currentPath,
          children: [],
        };
        currentLevel.push(node);
      }

      if (index === segments.length - 1) {
        node.item = item;
      } else {
        currentLevel = node.children;
      }
    }
  }

  return sortNodes(root);
}

function getRelativePath(basePath: string, filePath: string): string {
  const relativePath = path.relative(basePath, filePath);
  if (!relativePath || relativePath.startsWith('..')) {
    return path.basename(filePath);
  }

  return relativePath;
}

function sortNodes<T extends { path: string }>(nodes: PathTreeNode<T>[]): PathTreeNode<T>[] {
  const sorted = nodes
    .map((node) => ({
      ...node,
      children: sortNodes(node.children),
    }))
    .sort((a, b) => {
      const aIsFolder = !a.item;
      const bIsFolder = !b.item;

      if (aIsFolder !== bIsFolder) {
        return aIsFolder ? -1 : 1;
      }

      return a.label.localeCompare(b.label);
    });

  return sorted;
}
