import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../keystatic.config';
import { Node } from '../types/types';

const reader = createReader(process.cwd(), keystaticConfig);

export async function getSystemMapData(): Promise<Node> {
    // 1. Fetch all nodes from local file system
    const nodesMap = await reader.collections.nodes.all();

    // 2. Convert to our Node interface
    const allNodes: any[] = nodesMap.map((entry) => {
        const slug = entry.slug;
        const data = entry.entry;

        return {
            id: slug,
            parentId: data.parent || undefined,
            title: data.title,
            type: data.type,
            label: data.label,
            status: data.status,
            description: data.description,
            gallery: data.gallery as string[], // Cast to string array
            iframeConfig: data.iframeConfig ? {
                url: data.iframeConfig.url,
                orientation: data.iframeConfig.orientation
            } : undefined,
            content: JSON.stringify(data.content),
            children: []
        };
    });

    // 3. Build Tree Structure
    const nodeLookup = new Map<string, any>();
    allNodes.forEach(node => nodeLookup.set(node.id, node));

    const rootNodes: Node[] = [];

    // Assign children to parents
    allNodes.forEach(node => {
        if (node.parentId && nodeLookup.has(node.parentId)) {
            const parent = nodeLookup.get(node.parentId);
            if (!parent.children) parent.children = [];
            parent.children.push(node);
        } else {
            // No parent, or parent not found -> Root Candidate
            rootNodes.push(node);
        }
    });

    // 4. Return the single Root Node
    const root = rootNodes.find(n => n.id === 'system-map' || n.id === 'root') || rootNodes[0];

    if (!root) {
        return {
            id: 'root',
            type: 'category',
            title: 'System Map',
            description: 'No content found in Keystatic. Visit /keystatic to create nodes.',
            children: []
        };
    }

    return root;
}
