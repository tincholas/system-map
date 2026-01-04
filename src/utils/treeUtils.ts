import { Node } from '../types/types';

/**
 * Helper to find a node by ID in the tree
 */
export function findNode(root: Node, id: string): Node | null {
    if (root.id === id) return root;
    if (root.children) {
        for (const child of root.children) {
            const found = findNode(child, id);
            if (found) return found;
        }
    }
    return null;
}

/**
 * Collects all descendant IDs of a given node
 */
export function getDescendantIds(node: Node): string[] {
    let ids: string[] = [];
    if (node.children) {
        node.children.forEach(child => {
            ids.push(child.id);
            ids = [...ids, ...getDescendantIds(child)];
        });
    }
    return ids;
}
