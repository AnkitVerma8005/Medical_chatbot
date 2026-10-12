# Medical Chatbot

A retrieval-augmented generation (RAG) medical chatbot that answers questions from indexed medical documents using Pinecone vector search and Gemini LLM responses.

## Overview

This project:

- extracts text from medical PDFs stored in `data/`
- chunks and embeds the content
- stores embeddings in a Pinecone index
- retrieves the most relevant context for a user question
- generates a grounded answer using Gemini
- serves a simple web chat interface in Flask

## Tech stack

- Python
- Flask
- LangChain
- Pinecone
- Google Generative AI
- PyMuPDF / PDF extraction utilities

## Project structure

```text
Medical_chatbot/
├── app.py                 # Flask web app entry point
├── src/
│   ├── helper.py          # PDF loading and embedding helpers
│   ├── prompt.py          # System prompt for the chatbot
│   ├── store_index.py     # Creates/populates Pinecone index
│   └── ...
├── data/                  # Medical documents to index
├── templates/             # Front-end HTML templates
├── static/                # Static frontend assets
├── requirements.txt       # Python dependencies
├── README.md
└── setup.py
```

## Prerequisites

- Python 3.10+
- A Pinecone account and API key
- A Google Gemini API key
- A Pinecone index named `medical-chatbot`

## Setup

1. Create and activate a virtual environment (optional but recommended):

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

2. Install dependencies:

   ```powershell
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the project root with the following values:

   ```env
   PINECONE_API_KEY=your_pinecone_api_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Build the Pinecone index by indexing the documents:

   ```powershell
   python -m src.store_index
   ```

   This creates the `medical-chatbot` index if it does not already exist and uploads the document embeddings.

## Run the app

Start the Flask application from the repository root:

```powershell
python app.py
```

The app runs on:

- Web UI: http://localhost:8080/
- Chat endpoint: http://localhost:8080/get

## Chat usage

Open the browser at `http://localhost:8080/` and type a medical question in the chat box.

You can also call the backend endpoint directly:

```powershell
curl -X POST "http://localhost:8080/get" -d "msg=What information does the medical reference provide?"
```

The `/get` route streams a Server-Sent Events (SSE) response, so the browser receives incremental answer tokens rather than a single JSON payload.

## Run with Docker

Build the image from the project root:

```powershell
docker build -t medical-chatbot .
```

Start the container using the `.env` file created during setup:

```powershell
docker run --rm -p 8080:8080 --env-file .env medical-chatbot
```

Open `http://localhost:8080/`. The Pinecone index must already be populated before starting the container.

## Notes

- The app expects your Pinecone index to contain the medical document embeddings before answering questions.
- If the index is empty or missing, re-run `python -m src.store_index`.
- Use the UI or endpoint only after the `.env` file is configured and the index is built.

## License

This project is licensed under the MIT license. See `LICENSE` for details.

## ECR repo to store Docker image

`441412733074.dkr.ecr.us-east-1.amazonaws.com/medicalchatbot`
