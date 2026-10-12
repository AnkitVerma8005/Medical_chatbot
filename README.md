# Medical_chatbot

## Run the RAG API

1. Install the dependencies:

   ```powershell
   pip install -r requirements.txt
   ```

2. Set `PINECONE_API_KEY` and `GEMINI_API_KEY` in `.env`. The Pinecone
   `medical-chatbot` index must already contain the documents for retrieval.
   If it has not been populated yet, run `python -m src.store_index` once.
3. Start the API from the repository root:

   ```powershell
   python -m uvicorn main:app --reload
   ```

The interactive API documentation is available at <http://127.0.0.1:8000/docs>.
Send a `POST` request to `/ask` with a JSON body:

```json
{
  "question": "What information does the medical reference provide?"
}
```

The response contains the generated answer:

```json
{
  "answer": "..."
}
```