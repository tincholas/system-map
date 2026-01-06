
import { getSystemMapData } from '../src/lib/keystatic';

async function test() {
    console.log('Fetching data...');
    try {
        const root = await getSystemMapData();

        // Find About node
        function findNode(node: any, id: string): any {
            if (node.id === id) return node;
            if (node.children) {
                for (const child of node.children) {
                    const found = findNode(child, id);
                    if (found) return found;
                }
            }
            return null;
        }

        const about = findNode(root, 'about');
        console.log('ABOUT NODE CONTENT:', about ? about.content : 'Not Found');

    } catch (e) {
        console.error('Error:', e);
    }
}

test();
