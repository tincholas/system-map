const fs = require('fs');
const path = require('path');

const directory = 'src/content/nodes';

const files = fs.readdirSync(directory);

let count = 0;

files.forEach(file => {
    if (file.endsWith('.mdoc')) {
        const filePath = path.join(directory, file);
        let content = fs.readFileSync(filePath, 'utf8');

        if (content.includes('status: concept')) {
            content = content.replace(/^status: concept\r?\n/gm, '');
            fs.writeFileSync(filePath, content);
            console.log(`Cleaned ${file}`);
            count++;
        }
    }
});

console.log(`\nRemoved 'status: concept' from ${count} files.`);
