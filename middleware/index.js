// Middleware main entry point
const { performSearch } = require('./search/searchLogic');
const { sendChatMessageToGemini } = require('./gemini/chatService');
const path = require('path');

console.log('Middleware index.js loaded. Ready to search.');

// This function will be called via IPC from the Electron main process or renderer process.
async function handleSearchQuery(query) {
    // Resolve paths:
    // rootDir should be /home/zoltan/mctdh
    // docsToolDir should be /home/zoltan/mctdh/docs_tool
    const rootDir = path.resolve(__dirname, '..', '..'); 
    const docsToolDir = path.resolve(__dirname, '..');   
    
    console.log(`Searching for "${query}" in root: ${rootDir}`);
    console.log(`Excluding directory: ${docsToolDir}`);
    
    if (!query || typeof query !== 'string' || query.trim() === '') {
        console.log('Search query is empty or invalid.');
        return []; // Return empty if no query
    }

    try {
        const results = await performSearch(query, rootDir, [docsToolDir]);
        console.log(`Found ${results.length} results for "${query}":`);
        results.forEach(result => {
            console.log(`  - ${result.relativePath}`);
        });
        return results;
    } catch (error) {
        console.error(`Error in handleSearchQuery for query "${query}":`, error);
        return { error: 'Search failed', details: error.message };
    }
}

// --- Example Usage for direct testing ---
// This allows you to test the search logic by running `node middleware/index.js "your query"`
// or by uncommenting the IIFE below and running `node middleware/index.js`
/*
if (require.main === module) {
    (async () => {
        const testQuery = process.argv[2] || "electron"; // Default test query if no arg
        console.log(`\n--- Initiating test search for: "${testQuery}" ---`);
        await handleSearchQuery(testQuery);
        console.log("--- Test search complete ---");
    })();
}
*/

module.exports = {
    handleSearchQuery,
    sendChatMessageToGemini
};
