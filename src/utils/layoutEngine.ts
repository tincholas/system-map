import { Node, LayoutNode } from '../types/types';

const CONFIG = {
    NODE_WIDTH: 250,
    NODE_HEIGHT: 150,
    EXPANDED_WIDTH: 800,
    EXPANDED_HEIGHT: 600,
    MOBILE_WIDTH: 450,
    MOBILE_HEIGHT: 800,
    HORIZONTAL_GAP: 100,
    VERTICAL_GAP: 50,
};

/**
 * Calculates layout for a tree of nodes.
 * ...
 */
export function calculateLayout(
    root: Node,
    expandedIds: Set<string>
): Map<string, LayoutNode> {
    const layoutMap = new Map<string, LayoutNode>();
    const rootWithHeight = enrichWithHeight(root, expandedIds);
    assignCoordinates(rootWithHeight, 0, 0, 0, layoutMap, expandedIds);
    return layoutMap;
}

interface NodeWithDimensions extends Omit<Node, 'children'> {
    children?: NodeWithDimensions[];
    branchHeight: number;
    width: number;
    height: number;
}

function enrichWithHeight(node: Node, expandedIds: Set<string>): NodeWithDimensions {
    const isExpanded = expandedIds.has(node.id);

    // Node Types
    const isArticle = node.type === 'article';
    const isVirtualFrame = node.type === 'virtual-frame';

    let width = CONFIG.NODE_WIDTH;
    let height = CONFIG.NODE_HEIGHT;

    if (isExpanded && isArticle) {
        width = CONFIG.EXPANDED_WIDTH;
        height = CONFIG.EXPANDED_HEIGHT;
    } else if (isVirtualFrame) {
        // Virtual frames are sized based on their config (passed via data or inferred)
        // For now, we need to pass this data down.
        // Actually, the virtual node created below will carry the size info needed for rendering,
        // but here we set physical layout dimensions.
        if (node.iframeConfig?.orientation === 'mobile') {
            width = CONFIG.MOBILE_WIDTH;
            height = CONFIG.MOBILE_HEIGHT;
        } else {
            width = CONFIG.EXPANDED_WIDTH;
            height = CONFIG.EXPANDED_HEIGHT;
        }
    }

    // Logic to inject virtual child for expanded articles with iframes
    let processedChildren = node.children || [];

    if (isExpanded && node.iframeConfig && node.iframeConfig.url) {
        const previewNode: Node = {
            id: `${node.id}-preview`,
            type: 'virtual-frame',
            title: node.title,
            iframeConfig: node.iframeConfig,
            label: 'Preview'
        };
        processedChildren = [...processedChildren, previewNode];
    }

    // Check implies we treat the injected child as real for layout purposes
    const hasChildren = processedChildren.length > 0;

    if (!isExpanded || !hasChildren) {
        const { children, ...rest } = node;
        return { ...rest, children: undefined, branchHeight: height, width, height };
    }

    const enrichedChildren = processedChildren.map(child => enrichWithHeight(child, expandedIds));
    const totalChildrenHeight = enrichedChildren.reduce((sum, child) => sum + child.branchHeight, 0);
    const totalGap = (enrichedChildren.length - 1) * CONFIG.VERTICAL_GAP;
    const branchHeight = Math.max(height, totalChildrenHeight + totalGap);

    const { children: _, ...nodeParams } = node;
    return { ...nodeParams, children: enrichedChildren, branchHeight, width, height };
}

function assignCoordinates(
    node: NodeWithDimensions,
    leftX: number,
    centerY: number,
    level: number,
    map: Map<string, LayoutNode>,
    expandedIds: Set<string>,
    parentId?: string
) {
    const isExpanded = expandedIds.has(node.id);

    // Store node with x=LeftEdge, y=CenterY
    map.set(node.id, {
        ...node,
        parentId,
        x: leftX,
        y: centerY,
        width: node.width,
        height: node.height,
        level,
        branchHeight: node.branchHeight,
        isExpanded,
    });

    if (isExpanded && node.children && node.children.length > 0) {
        // Children start to the right of this node
        const childrenLeftX = leftX + node.width + CONFIG.HORIZONTAL_GAP;

        // Calculate the total height of the children stack
        const totalChildrenStackHeight = node.children.reduce((sum, c) => sum + c.branchHeight, 0) +
            (node.children.length - 1) * CONFIG.VERTICAL_GAP;

        // Start placing children so their stack is centered on parent's center Y
        let currentTop = centerY - (totalChildrenStackHeight / 2);

        node.children.forEach((child) => {
            // Each child is centered within its branch slot
            const childCenterY = currentTop + (child.branchHeight / 2);

            assignCoordinates(child, childrenLeftX, childCenterY, level + 1, map, expandedIds, node.id);

            currentTop += child.branchHeight + CONFIG.VERTICAL_GAP;
        });
    }
}
