const fs = require('fs');
const path = require('path');

const NODES_DIR = path.join(__dirname, '../src/content/nodes');

function migrateNodes() {
    if (!fs.existsSync(NODES_DIR)) {
        console.error(`Directory not found: ${NODES_DIR}`);
        return;
    }

    const files = fs.readdirSync(NODES_DIR).filter(file => file.endsWith('.mdoc'));

    console.log(`Found ${files.length} files to migrate...`);

    files.forEach(file => {
        const filePath = path.join(NODES_DIR, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // Extract Frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!frontmatterMatch) {
            console.warn(`Skipping ${file}: No frontmatter found`);
            return;
        }

        const frontmatterRaw = frontmatterMatch[1];
        let newFrontmatter = frontmatterRaw;

        // Helper to get value
        const getField = (key) => {
            const match = newFrontmatter.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
            return match ? match[1].trim() : null;
        };

        // Helper to remove field
        const removeField = (key) => {
            const regex = new RegExp(`^${key}:.*$\\n?`, 'm');
            newFrontmatter = newFrontmatter.replace(regex, '');
        };

        // Helper to add/update field
        const setField = (key, value) => {
            const regex = new RegExp(`^${key}:.*$`, 'm');
            if (regex.test(newFrontmatter)) {
                newFrontmatter = newFrontmatter.replace(regex, `${key}: ${value}`);
            } else {
                newFrontmatter += `\n${key}: ${value}`;
            }
        };

        const type = getField('type');
        const experimentUrl = getField('experimentUrl'); // Might be null

        let hasChanges = false;

        if (type === 'project') {
            setField('type', 'article');
            setField('label', 'Project');
            hasChanges = true;
        }
        else if (type === 'experiment') {
            setField('type', 'article');
            setField('label', 'Experiment');
            if (experimentUrl) {
                // Remove old field
                removeField('experimentUrl');
                // Add new complex field manually
                newFrontmatter += `\niframeConfig:\n  url: ${experimentUrl}\n  orientation: desktop`;
            }
            hasChanges = true;
        }
        else if (type === 'mobile-preview') {
            setField('type', 'article');
            setField('label', 'App');
            if (experimentUrl) {
                removeField('experimentUrl');
                newFrontmatter += `\niframeConfig:\n  url: ${experimentUrl}\n  orientation: mobile`;
            }
            hasChanges = true;
        }

        else if (type === 'article') {
            // Already migrated types are fine.
        }
        else if (type === 'category') {
            // RECOVERY LOGIC: If we accidentally converted an article to category in the last run,
            // it will still have the 'label' field (Project/Experiment/App).
            const label = getField('label');
            if (label && (label === 'Project' || label === 'Experiment' || label === 'App')) {
                console.log(`Recovering wrongly converted category in ${file} back to article`);
                setField('type', 'article');
                hasChanges = true;
            }
        }
        else {
            // Unknown or other types -> Category
            console.log(`Converting unknown type '${type}' in ${file} to category`);
            setField('type', 'category');
            hasChanges = true;
        }

        // CLEANUP STEP: Unconditionally remove experimentUrl if it lingers 
        // (e.g. in projects where it was unused, or if previous run missed it)
        if (experimentUrl && type !== 'experiment' && type !== 'mobile-preview') {
            // For experiment/mobile-preview, we handled it above (mapped it).
            // For others (project/article/category), it's garbage. Delete it.
            console.log(`Cleaning garbage experimentUrl from ${file}`);
            removeField('experimentUrl');
            hasChanges = true;
        }

        if (hasChanges) {
            // Clean up multiple newlines if any
            newFrontmatter = newFrontmatter.replace(/\n\n+/g, '\n').trim();

            const newContent = content.replace(frontmatterRaw, newFrontmatter);
            fs.writeFileSync(filePath, newContent);
            console.log(`Migrated ${file}`);
        }
    });

    console.log('Migration complete.');
}

migrateNodes();
