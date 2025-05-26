# Project Structure for docs_tool

This document outlines the directory and file structure for the `docs_tool` project.

## Root Directory (`docs_tool/`)

-   **`PLAN.MD`**: The overall project plan, detailing features, technology stack, and development phases.
-   **`STRUCTURE.MD`**: This file, describing the project's folder and file organization.
-   **`package.json`**: Manages project dependencies (Node.js, Electron, React Native related) and defines scripts for building, running, and testing the application. (To be created)
-   **`main.js`**: The entry point for the Electron main process. Responsible for creating browser windows and handling system events. (Placeholder created)
-   **`preload.js`**: A script that runs before web page is loaded in the browser window (renderer process). It has access to both DOM APIs and Node.js environment, and is used to expose privileged APIs from the main process to the renderer process securely. (Placeholder created)

## `src/` - React Native Frontend Application

This directory contains all the code for the React Native frontend application, which will render the UI.

-   **`App.js`**: The root component of the React Native application. (Placeholder created)
-   **`components/`**: Contains reusable UI components used across different screens.
-   **`screens/`**: Contains components that represent different screens or views of the application.
-   **`assets/`**: Stores static assets like images, fonts, etc.
-   **`services/`**: Frontend-specific services, such as functions to communicate with the Node.js middleware.

## `middleware/` - Node.js Backend/Middleware

This directory houses the Node.js code responsible for backend logic, including file system operations, search processing, and communication with external APIs like Gemini.

-   **`index.js`**: The main entry point for the Node.js middleware. It might set up an IPC (Inter-Process Communication) channel with the Electron main process or a local HTTP server for the frontend to communicate with. (Placeholder created)
-   **`search/`**: Modules related to the search functionality.
    -   **`fileParser.js`**: Contains logic for reading and parsing HTML and LaTeX files to extract searchable text content. (Placeholder created)
    -   **`searchLogic.js`**: Implements the core search algorithms (string matching, indexing, result ranking). (Placeholder created)
-   **`gemini/`**: Modules for integrating with the Gemini API (for future chat functionality).
    -   **`chatService.js`**: Handles communication with the Gemini API. (Placeholder created)

## Development Workflow Overview

1.  The Electron `main.js` starts the application and creates a browser window.
2.  The browser window loads the React Native application from the `src/` directory (via `App.js`).
3.  The React Native UI allows the user to input a search query.
4.  Frontend services in `src/services/` send the query to the Node.js `middleware/` (e.g., via IPC exposed through `preload.js`).
5.  The middleware's `searchLogic.js` and `fileParser.js` handle the file searching process across the specified project directories (excluding `docs_tool/`).
6.  Results are sent back to the frontend and displayed.
7.  The `gemini/chatService.js` will handle interactions for the chat feature in a similar manner.

## Final Project Structure

```
docs_tool/
├── PLAN.MD
├── STRUCTURE.MD
├── package.json
├── main.js
├── preload.js
├── src/
│   ├── App.js
│   ├── components/
│   ├── screens/
│   └── services/
├── middleware/
│   ├── index.js
│   ├── search/
│   │   ├── fileParser.js
│   │   └── searchLogic.js
│   └── gemini/
│       └── chatService.js
└── node_modules/
```
