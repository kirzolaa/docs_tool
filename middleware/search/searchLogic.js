const fs = require('fs-extra');
const path = require('path');
const { parseHtmlFile, parseTexFile } = require('./fileParser');

const DEFAULT_SEARCHABLE_EXTENSIONS = ['.html', '.htm', '.tex', '.inp', '.op'];
const MAX_SNIPPET_LENGTH = 300; // Max characters for a snippet
const SNIPPET_CONTEXT_WINDOW = 100; // Characters before/after keyword for context

async function performSearch(options) {
    const {
        query,
        baseRootDir, // e.g., /home/zoltan/mctdh
        exclusions = [],
        targetExtensions = DEFAULT_SEARCHABLE_EXTENSIONS,
        subDirectory = '' // Relative to baseRootDir
    } = options;

    if (!query || !baseRootDir) {
        console.error('Search query and baseRootDir are required.');
        return [];
    }

    const results = [];
    const lowerCaseQuery = query.toLowerCase();
    const effectiveRootDir = subDirectory ? path.join(baseRootDir, subDirectory) : baseRootDir;

    try {
        // Check if effectiveRootDir exists and is a directory
        const rootStat = await fs.stat(effectiveRootDir);
        if (!rootStat.isDirectory()) {
            console.warn(`Effective root directory is not a directory: ${effectiveRootDir}`);
            return [];
        }
    } catch (err) {
        console.warn(`Cannot access effective root directory ${effectiveRootDir}:`, err.message);
        return [];
    }

    async function walkDir(currentPath) {
        const items = await fs.readdir(currentPath);
        for (const item of items) {
            const itemPath = path.join(currentPath, item);
            const relativeItemPath = path.relative(baseRootDir, itemPath); // Relative to the overall project root

            // Check if itemPath (or its root parent if inside an excluded dir) is in exclusions
            if (exclusions.some(ex => itemPath === ex || itemPath.startsWith(ex + path.sep))) {
                // console.log(`Skipping excluded: ${itemPath}`);
                continue;
            }

            const stat = await fs.stat(itemPath);
            if (stat.isDirectory()) {
                await walkDir(itemPath);
            } else if (stat.isFile()) {
                const ext = path.extname(itemPath).toLowerCase();
                if (targetExtensions.map(e => e.toLowerCase()).includes(ext)) {
                    let textContent = '';
                    try {
                        if (ext === '.html' || ext === '.htm') {
                            textContent = await parseHtmlFile(itemPath);
                        } else if (ext === '.tex') {
                            textContent = await parseTexFile(itemPath);
                        } else if (ext === '.inp' || ext === '.op' || targetExtensions.includes(ext)) { // Handle .inp, .op and other specified text files
                            textContent = await fs.readFile(itemPath, 'utf-8');
                        } else {
                            // This case implies the file extension was in targetExtensions but not handled by specific if/else if.
                            // This shouldn't happen if the conditions are comprehensive for all targetExtensions.
                            // However, as a fallback or for unexpected targetExtensions, read as plain text if it was in targetExtensions.
                            // If it wasn't in targetExtensions, the outer check would have skipped it.
                            console.warn(`File extension ${ext} was in targetExtensions but not explicitly handled by parser logic, attempting plain text read for ${itemPath}`);
                            textContent = await fs.readFile(itemPath, 'utf-8'); // Fallback for other targeted text types
                        }

                        const lowerCaseTextContent = textContent.toLowerCase();
                        const queryIndex = lowerCaseTextContent.indexOf(lowerCaseQuery);

                        if (queryIndex !== -1) {
                            let snippet = '';
                            const start = Math.max(0, queryIndex - SNIPPET_CONTEXT_WINDOW);
                            const end = Math.min(textContent.length, queryIndex + lowerCaseQuery.length + SNIPPET_CONTEXT_WINDOW);
                            snippet = textContent.substring(start, end);
                            if (start > 0) snippet = "..." + snippet;
                            if (end < textContent.length) snippet = snippet + "...";
                            if (snippet.length > MAX_SNIPPET_LENGTH) {
                                snippet = snippet.substring(0, MAX_SNIPPET_LENGTH - 3) + "...";
                            }

                            results.push({
                                path: itemPath, 
                                relativePath: relativeItemPath, 
                                fileName: path.basename(itemPath),
                                snippet: snippet
                            });
                        }
                    } catch (parseError) {
                        console.error(`Error processing file ${itemPath}:`, parseError);
                        // Optionally add to a list of files that couldn't be parsed
                    }
                }
            }
        }
    }

    try {
        await walkDir(effectiveRootDir);
    } catch (error) {
        console.error('Error during search execution:', error);
        // Consider how to propagate this error to the UI
    }
    return results;
}

module.exports = {
    performSearch,
};
