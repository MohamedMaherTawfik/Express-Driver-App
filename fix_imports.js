const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, fileList);
        } else if (fullPath.endsWith('.js')) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

const allFiles = getAllFiles(srcDir);
const fileBasenames = {}; // basename -> array of absolute paths

for (const file of allFiles) {
    const basename = path.basename(file, '.js');
    if (!fileBasenames[basename]) fileBasenames[basename] = [];
    fileBasenames[basename].push(file);
}

let updated = 0;

for (const file of allFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    content = content.replace(/require\(['"]([^'"]+)['"]\)/g, (match, reqPath) => {
        if (!reqPath.startsWith('.')) return match;

        let resolved = path.resolve(path.dirname(file), reqPath);
        if (!resolved.endsWith('.js')) resolved += '.js';

        if (fs.existsSync(resolved)) {
            return match; // It's fine
        }

        // It doesn't exist. Let's find where it is now.
        const reqBasename = path.basename(reqPath, '.js');
        const candidates = fileBasenames[reqBasename];

        if (candidates && candidates.length === 1) {
            const targetAbs = candidates[0];
            let newRel = path.relative(path.dirname(file), targetAbs).replace(/\\/g, '/');
            if (!newRel.startsWith('.')) newRel = './' + newRel;
            // strip .js if it wasn't there
            if (!reqPath.endsWith('.js') && newRel.endsWith('.js')) {
                newRel = newRel.slice(0, -3);
            }
            changed = true;
            updated++;
            return `require("${newRel}")`;
        } else if (candidates && candidates.length > 1) {
            console.log(`Ambiguous require: ${reqPath} in ${file}. Candidates:`, candidates);
        } else {
            // maybe an index.js inside a folder?
            // Actually our project doesn't heavily use index.js based on the file list.
            console.log(`Could not find candidate for: ${reqPath} in ${file}`);
        }

        return match;
    });

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
    }
}

console.log(`Fixed ${updated} imports.`);
