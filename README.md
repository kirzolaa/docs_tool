# Docs Tool

A desktop application for searching local documents and interacting with them using Gemini AI.

## Prerequisites

- Node.js (v16 or later)
- npm (comes with Node.js)
- Python 3.8+ (for virtual environment)

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd docs_tool
   ```

2. **Set up Python virtual environment**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
   ```

3. **Install Node.js dependencies**
   ```bash
   npm install
   ```

4. **Environment Variables**
   Create a `.env` file in the root directory with your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

## Running the Application

1. **Development Mode**
   ```bash
   # In one terminal, start the webpack dev server
   npm run build:web
   
   # In another terminal, start the Electron app
   npm start
   ```

## Building for Production

To create a production build:

```bash
npm run build:web -- --mode production
```

## Project Structure

- `src/` - Main application source code
- `middleware/` - Backend services and utilities
- `dist/` - Compiled and bundled files (created during build)
- `main.js` - Electron main process file
- `preload.js` - Preload script for Electron

## License

ISC

---

## Commit Message

```
feat: add comprehensive README with setup and usage instructions

- Added detailed setup instructions for development environment
- Included prerequisites and environment setup steps
- Added project structure overview
- Added build and run instructions
- Included placeholder for Gemini API key configuration

Resolves: #<issue-number-if-any>
```
