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
    COLUMN_THRESHOLD: 4, // Split into 2 columns if children count exceeds this
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

    // Calculate effective height based on layout strategy (Single vs Multi Column)
    let totalChildrenHeight = 0;
    const useTwoColumns = enrichedChildren.length > CONFIG.COLUMN_THRESHOLD;

    if (useTwoColumns) {
        const midPoint = Math.ceil(enrichedChildren.length / 2);
        const col1 = enrichedChildren.slice(0, midPoint);
        const col2 = enrichedChildren.slice(midPoint);

        const col1Height = col1.reduce((sum, child) => sum + child.branchHeight, 0) + (Math.max(0, col1.length - 1) * CONFIG.VERTICAL_GAP);
        const col2Height = col2.reduce((sum, child) => sum + child.branchHeight, 0) + (Math.max(0, col2.length - 1) * CONFIG.VERTICAL_GAP);

        totalChildrenHeight = Math.max(col1Height, col2Height);
    } else {
        totalChildrenHeight = enrichedChildren.reduce((sum, child) => sum + child.branchHeight, 0) + (Math.max(0, enrichedChildren.length - 1) * CONFIG.VERTICAL_GAP);
    }

    const branchHeight = Math.max(height, totalChildrenHeight);

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
        // Standard Orthogonal Anchors
        const childrenLeftX = leftX + node.width + CONFIG.HORIZONTAL_GAP;
        const count = node.children.length;
        const useTwoColumns = count > CONFIG.COLUMN_THRESHOLD;

        if (useTwoColumns) {
            const midPoint = Math.ceil(count / 2);
            const col1 = node.children.slice(0, midPoint);
            const col2 = node.children.slice(midPoint);

            // Calculate heights for both columns
            const col1Height = col1.reduce((sum, c) => sum + (c as NodeWithDimensions).branchHeight, 0) + (col1.length - 1) * CONFIG.VERTICAL_GAP;
            const col2Height = col2.reduce((sum, c) => sum + (c as NodeWithDimensions).branchHeight, 0) + (col2.length - 1) * CONFIG.VERTICAL_GAP;

            let col1Top = centerY - (col1Height / 2);
            let col2Top = centerY - (col2Height / 2);

            // CRITICAL: Calculate max width of Col 1 to safely place Col 2
            const maxCol1Width = col1.reduce((max, node) => {
                let effectiveWidth = (node as NodeWithDimensions).width;
                if (expandedIds.has(node.id) && node.children && node.children.length > 0) {
                    const widestChild = node.children.reduce((w, child) => Math.max(w, (child as NodeWithDimensions).width), 0);
                    effectiveWidth += CONFIG.HORIZONTAL_GAP + widestChild;
                }
                return Math.max(max, effectiveWidth);
            }, 0);

            const col2LeftX = childrenLeftX + maxCol1Width + CONFIG.HORIZONTAL_GAP;

            col1.forEach(child => {
                const childCenterY = col1Top + ((child as NodeWithDimensions).branchHeight / 2);
                assignCoordinates(child as NodeWithDimensions, childrenLeftX, childCenterY, level + 1, map, expandedIds, node.id);
                col1Top += (child as NodeWithDimensions).branchHeight + CONFIG.VERTICAL_GAP;
            });

            col2.forEach(child => {
                const childCenterY = col2Top + ((child as NodeWithDimensions).branchHeight / 2);
                assignCoordinates(child as NodeWithDimensions, col2LeftX, childCenterY, level + 1, map, expandedIds, node.id);
                col2Top += (child as NodeWithDimensions).branchHeight + CONFIG.VERTICAL_GAP;
            });

        } else {
            // --- Standard Single Column ---
            const totalChildrenStackHeight = node.children.reduce((sum, c) => sum + (c as NodeWithDimensions).branchHeight, 0) +
                (node.children.length - 1) * CONFIG.VERTICAL_GAP;

            let currentTop = centerY - (totalChildrenStackHeight / 2);

            node.children.forEach((child) => {
                // Each child is centered within its branch slot
                const childCenterY = currentTop + ((child as NodeWithDimensions).branchHeight / 2);

                assignCoordinates(child as NodeWithDimensions, childrenLeftX, childCenterY, level + 1, map, expandedIds, node.id);

                currentTop += (child as NodeWithDimensions).branchHeight + CONFIG.VERTICAL_GAP;
            });
        }
    }
}
