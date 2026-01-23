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

function estimateContentHeight(contentStr: string | undefined, width: number, isMobile: boolean, hasGallery: boolean): number {
    // Chrome Height Calculation (approximate px):
    // P-4 (32) + 20 (top bar) + mt-2 (8) + h3 (32+4) + Desc (40) + mt-4 (16) + pt-4 (16) = ~168px
    // Let's use 160 as base chrome.
    let height = 160;

    // Add Gallery Height if present (16:9 aspect ratio + margin)
    if (hasGallery) {
        height += (width * 0.5625) + 30; // 30px for margin/border
    }

    if (!contentStr) return height;

    try {
        const content = JSON.parse(contentStr);
        if (!Array.isArray(content)) return height;

        // Font Metrics based on Tailwind stats (prose-base vs prose-sm)
        // Mobile: prose-base (16px), line-height 1.75 (28px)
        // Desktop: prose-sm (14px), line-height 1.714 (~24px)
        const fontSize = isMobile ? 16 : 14;
        const lineHeight = isMobile ? 28 : 24;
        const avgCharWidth = fontSize * 0.5; // Average char width ~0.5em (conservative)

        // Width available for text (padding 32px + scroll/safe buffer 20px)
        const textWidth = Math.max(200, width - 50);

        // Wrapping Inefficiency Factor:
        // Text doesn't wrap perfectly due to word boundaries.
        // 0.92 factor is a reasonable estimate for normal prose.
        const wrappingFactor = 0.92;
        const charsPerLine = (textWidth / avgCharWidth) * wrappingFactor;

        // Recursive text extractor for nested marks (bold, italic, links)
        const extractText = (children: any[]): string => {
            if (!children) return '';
            return children.map(child => {
                if (child.text) return child.text;
                if (child.children) return extractText(child.children);
                return '';
            }).join('');
        };

        for (const block of content) {
            switch (block.type) {
                case 'paragraph':
                    const text = extractText(block.children);
                    if (text.length === 0) {
                        height += lineHeight; // Empty paragraph
                    } else {
                        const lines = Math.ceil(text.length / charsPerLine);
                        height += lines * lineHeight + 16; // content + margin-bottom
                    }
                    break;
                case 'heading':
                    // h1-h4
                    const hText = extractText(block.children);
                    const hLines = Math.ceil(hText.length / (charsPerLine * 0.7)); // Headings are wider/larger
                    height += hLines * (lineHeight * 1.5) + 24;
                    break;
                case 'image':
                    height += 300 + 20; // Fixed image height assumption
                    break;
                case 'list':
                    const items = block.children || [];
                    for (const item of items) {
                        const itemText = extractText(item.children); // List items usually wrap content in a paragraph-like structure or just text
                        if (itemText.length === 0) {
                            height += lineHeight;
                        } else {
                            // List items have bullet indentation, effectively reducing width slightly more? 
                            // Prose default: pl-5 (20px). We already have conservative charsPerLine.
                            const itemLines = Math.ceil(itemText.length / charsPerLine);
                            height += itemLines * lineHeight + 8; // 8px margin between list items
                        }
                    }
                    height += 16; // Extra margin for the whole list
                    break;
                case 'code':
                    const codeLines = block.content?.split('\n').length || 1;
                    height += codeLines * 20 + 30;
                    break;
                case 'blockquote':
                    const bText = extractText(block.children);
                    const bLines = Math.ceil(bText.length / charsPerLine);
                    height += bLines * lineHeight + 24;
                    break;
                case 'unordered-list':
                case 'ordered-list':
                    // Handle Keystatic's list type names
                    const listItems = block.children || [];
                    for (const item of listItems) {
                        const itemText = extractText(item.children);
                        if (itemText.length === 0) {
                            height += lineHeight;
                        } else {
                            const itemLines = Math.ceil(itemText.length / charsPerLine);
                            height += itemLines * lineHeight + 8;
                        }
                    }
                    height += 16;
                    break;
                default:
                    console.log('[LayoutEngine] Unknown block type:', block.type);
                    height += 40; // Fallback
            }
        }
        return height;
    } catch (e) {
        return height;
    }
}

/**
 * Calculates layout for a tree of nodes.
 * ...
 */
export interface LayoutContext {
    isMobile?: boolean;
    viewportWidth?: number;
    viewportHeight?: number;
}

/**
 * Calculates layout for a tree of nodes.
 * ...
 */
export function calculateLayout(
    root: Node,
    expandedIds: Set<string>,
    context: LayoutContext = {}
): Map<string, LayoutNode> {
    const layoutMap = new Map<string, LayoutNode>();
    const rootWithHeight = enrichWithHeight(root, expandedIds, context);
    assignCoordinates(rootWithHeight, 0, 0, 0, layoutMap, expandedIds);
    return layoutMap;
}

interface NodeWithDimensions extends Omit<Node, 'children'> {
    children?: NodeWithDimensions[];
    branchHeight: number;
    width: number;
    height: number;
}

function enrichWithHeight(node: Node, expandedIds: Set<string>, context: LayoutContext): NodeWithDimensions {
    const isExpanded = expandedIds.has(node.id);

    // Node Types
    const isArticle = node.type === 'article';
    const isVirtualFrame = node.type === 'virtual-frame';

    let width = CONFIG.NODE_WIDTH;
    let height = CONFIG.NODE_HEIGHT;

    if (isExpanded && isArticle) {
        const hasGallery = !!(node.gallery && node.gallery.length > 0);

        if (context.isMobile && context.viewportWidth && context.viewportHeight) {
            // Mobile: Expanded article takes up nearly FULL screen width
            width = context.viewportWidth * 0.95;
            width = Math.max(350, Math.min(width, 1000));

            // Mobile Height
            const estimated = estimateContentHeight(node.content, width, true, hasGallery);
            // Height is estimated, but at least 400px (to avoid tiny nodes) 
            // and at MOST 5x viewport (to avoid insane layout breaking if error)
            // We NO LONGER force it to 85% of viewport if content is smaller.
            height = Math.max(estimated, 400);

        } else {
            width = CONFIG.EXPANDED_WIDTH;
            // ESTIMATE HEIGHT for Desktop
            height = estimateContentHeight(node.content, width, false, hasGallery);
            // Ensure min height is at least the default expanded height
            height = Math.max(height, CONFIG.EXPANDED_HEIGHT);
        }
    } else if (isVirtualFrame) {
        // Virtual frames are sized based on their config (passed via data or inferred)
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

    const enrichedChildren = processedChildren.map(child => enrichWithHeight(child, expandedIds, context));

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
