# Plan for Search Tool

## 1. Project Goal

Develop a desktop application using React Native and Electron, with a Node.js middleware, to search through local HTML and LaTeX files. The tool will also incorporate a chat feature using Gemini 2.0 Flash. This plan focuses primarily on the search functionality.

## 2. Core Search Functionality

### 2.1. File Types to Support:
-   HTML (`.html`, `.htm`)
-   LaTeX (`.tex`)

### 2.2. Search Mechanism:
-   **Query Input**: Users will provide a search query (string).
-   **Content Parsing**:
    -   For HTML files: Extract text content, potentially ignoring HTML tags or selectively including content from specific tags (e.g., `<p>`, `<h1>`, `<body>`).
    -   For LaTeX files: Extract text content, handling LaTeX commands and environments to get meaningful text. This might involve stripping common commands or using a LaTeX-to-text converter.
-   **Indexing (Optional but Recommended for Performance)**:
    -   Consider creating an index of the content of the searchable files to speed up search queries, especially for large numbers of files.
    -   The index could be updated when files change or on demand.
-   **Search Algorithm**:
    -   Initial implementation could use simple string matching (case-insensitive).
    -   Future enhancements could include:
        -   Regular expression support.
        -   Fuzzy search.
        -   Ranking of results based on relevance (e.g., frequency of query term, proximity of terms).
-   **Displaying Results**:
    -   Show a list of files that contain the search query.
    -   For each file, display:
        -   File path.
        -   Snippets of the text where the query was found, with the query term highlighted.
        -   Number of occurrences.

## 3. Directory Scope for Searching

-   **Root Search Directory**: The application will search files within the main project folder (`/home/zoltan/mctdh`).
-   **Included Directories**: All subdirectories within `/home/zoltan/mctdh` will be searched by default.
-   **Excluded Directories**: The `docs_tool` directory (i.e., `/home/zoltan/mctdh/docs_tool`) itself will be excluded from the search to prevent the tool from searching its own development files.
-   **Configuration**: Allow users to configure included/excluded directories in the future.

## 4. Technology Stack Overview

-   **Frontend**: React Native (for UI components, to be wrapped with Electron).
-   **Desktop Container**: Electron (to package the React Native app as a desktop application).
-   **Backend/Middleware**: Node.js (for file system operations, search logic, and communication with the Gemini API).
-   **AI Chat**: Gemini 2.0 Flash (integrated via the Node.js middleware).

## 5. Development Phases (Focus on Search First)

### Phase 1: Basic Search Implementation
-   Set up Electron with a basic React Native view.
-   Implement Node.js module for:
    -   Reading directory structure (excluding `docs_tool`).
    -   Reading and parsing HTML files for text content.
    -   Reading and parsing LaTeX files for text content.
    -   Performing a simple string match search.
-   Display search results (file path and basic match indication).

### Phase 2: Enhanced Search Features
-   Implement snippet generation and highlighting.
-   Improve parsing robustness for HTML and LaTeX.
-   Investigate and implement basic indexing if performance is an issue.

### Phase 3: UI/UX Improvements
-   Refine the search interface in React Native.
-   Add options for case sensitivity, whole word matching, etc.

### Phase 4: Gemini Integration
-   Develop the chat interface.
-   Integrate Node.js middleware with Gemini 2.0 Flash.

## 6. Future Considerations
-   Advanced search options (regex, fuzzy search).
-   More sophisticated relevance ranking.
-   Real-time indexing or file watching for updates.
-   User-configurable search scopes and file types.
-   Support for other document types (e.g., Markdown, plain text).
