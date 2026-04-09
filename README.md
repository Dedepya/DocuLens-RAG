# DocuLens - AI Document Insights

DocuLens is an intelligent document analysis tool powered by Google's Gemini 3 Flash model. It allows users to upload documents (PDF, DOCX, TXT, Images) to extract structured data, generate summaries, and chat with their content.

## Features

- **Multi-format Support**: Analyze PDFs, Word documents, Text files, and Images.
- **AI-Powered Analysis**: Uses Gemini 3 Flash for deep understanding of document content.
- **Interactive Chat**: Ask questions about your documents and get instant answers.
- **Data Extraction**: Automatically extracts key information and structured data.
- **Summarization**: Get concise summaries of long documents.

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS
- **AI Model**: Google Gemini 3 Flash (@google/genai)
- **Document Processing**: Mammoth (DOCX), Native File API

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A API Key

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/doculens.git
    cd doculens
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    - Create a `.env` file in the root directory.
    - Add your  API key:
    ```env
    VITE_API_KEY=your_api_key_here
    ```

4.  Start the development server:
    ```bash
    npm run dev
    ```


## Deployment

### GitHub Pages

This project is configured for deployment to GitHub Pages.

1.  Update `vite.config.ts`:
    - Set `base` to your repository name (e.g., `/doculens/`).

2.  Update `package.json`:
    - Set `homepage` to your GitHub Pages URL (e.g., `https://yourusername.github.io/doculens`).

3.  Deploy:
    ```bash
    npm run deploy
    ```

## License

MIT
