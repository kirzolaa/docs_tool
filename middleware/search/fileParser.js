const fs = require('fs-extra');
const cheerio = require('cheerio');

async function parseHtmlFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const $ = cheerio.load(content);
        // Remove script and style tags to avoid searching their content
        $('script, style').remove();
        // Get text from the body, or root if no body
        const textContent = $('body').length ? $('body').text() : $.text();
        return textContent.replace(/\s\s+/g, ' ').trim(); // Normalize whitespace
    } catch (error) {
        console.error(`Error parsing HTML file ${filePath}:`, error);
        return '';
    }
}

async function parseTexFile(filePath) {
    try {
        let content = await fs.readFile(filePath, 'utf-8');
        // Basic LaTeX cleanup:
        // 1. Remove comments (lines starting with %)
        content = content.replace(/^%.*$/gm, '');
        // 2. Remove common commands (very basic, can be expanded)
        content = content.replace(/\\[a-zA-Z]+(\s*\{[^}]*\})?(\s*\[[^\]]*\])?/g, '');
        // 3. Remove environments like \\begin{...} ... \\end{...}
        content = content.replace(/\\begin\{[a-zA-Z*]+\}(?:.|\n)*?\\end\{[a-zA-Z*]+\}/g, '');
        // 4. Remove math mode content ($...$, $$...$$, \\\[...\\\])
        content = content.replace(/\$(?:(?!\$).)*\$/g, '');
        content = content.replace(/\$\$[\s\S]*?\$\$/g, '');
        content = content.replace(/\\\[[\s\S]*?\\\]/g, ''); // Corrected escaping for JSON
        // Normalize multiple spaces and trim
        return content.replace(/\s\s+/g, ' ').trim();
    } catch (error) {
        console.error(`Error parsing LaTeX file ${filePath}:`, error);
        return '';
    }
}

module.exports = {
    parseHtmlFile,
    parseTexFile,
};