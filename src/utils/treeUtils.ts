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

/**
 * Finds the path of IDs from root to the target node (inclusive)
 */
export function getPathToNode(root: Node, targetId: string): string[] | null {
    if (root.id === targetId) return [root.id];

    if (root.children) {
        for (const child of root.children) {
            const path = getPathToNode(child, targetId);
            if (path) {
                return [root.id, ...path];
            }
        }
    }

    return null;
}
