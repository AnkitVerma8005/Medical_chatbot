# Medical Chatbot

A Flask-based medical Q&A chatbot that retrieves information from a Pinecone index and generates answers with Gemini.

## Requirements

- Python 3.10
- Pinecone API key and a Pinecone index named `medical-chatbot`
- Gemini API key

## Local setup

Install the dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a `.env` file in the project root:

```env
PINECONE_API_KEY=your_pinecone_api_key
GEMINI_API_KEY=your_gemini_api_key
```

To create/populate the Pinecone index from the PDFs in `data/`, run:

```powershell
python -m src.store_index
```

Start the app:

```powershell
python app.py
```

Open [http://localhost:8080](http://localhost:8080).

## Deploy on Render

1. Connect this repository to Render and create a **Blueprint** using the `render.yaml` file in the repository root.
2. Set `PINECONE_API_KEY` and `GEMINI_API_KEY` when prompted, or add them as environment variables in the Render service settings.
3. Ensure the `medical-chatbot` Pinecone index has been populated before using the deployed app.

Render installs dependencies from `requirements.txt` and starts the Flask app with Gunicorn. The app uses the `PORT` provided by Render.
