import os
import json
import time

from flask import Flask, Response, jsonify, render_template, request, stream_with_context
from dotenv import load_dotenv
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_pinecone import PineconeVectorStore

from src.helper import load_embeddings
from src.prompt import system_prompt

app =Flask(__name__)

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

embedding = load_embeddings()

index_name = "medical-chatbot"

# Embed each chunk and upsert the embedding into your pinecone index 

docsearch = PineconeVectorStore.from_existing_index(
    index_name = index_name,
    embedding = embedding
)

# create retriever object that retrieve three similar vectors 

retriever = docsearch.as_retriever(search_type="similarity",search_kwargs={"k":3})

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    google_api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0.3
)

prompt = ChatPromptTemplate.from_messages(
    [
        ("system", system_prompt),
        ("human", "{input}"),
    ]
)

question_answer_chain = create_stuff_documents_chain(llm,prompt)

@app.route("/")
def index():
    return render_template("chat.html")

@app.route("/get",methods = ['GET','POST'])
def chat():
    msg = request.form.get("msg", "").strip()
    if not msg:
        return jsonify({"error": "Please enter a question."}), 400

    request_started = time.perf_counter()
    documents = retriever.invoke(msg)
    retrieval_finished = time.perf_counter()
    app.logger.info(
        "Document retrieval completed in %.2f seconds",
        retrieval_finished - request_started,
    )

    def generate():
        generation_started = time.perf_counter()
        first_token_time = None

        try:
            for chunk in question_answer_chain.stream(
                {"input": msg, "context": documents}
            ):
                if not chunk:
                    continue
                if first_token_time is None:
                    first_token_time = time.perf_counter()
                    app.logger.info(
                        "First answer token received %.2f seconds after retrieval",
                        first_token_time - retrieval_finished,
                    )
                yield f"event: token\ndata: {json.dumps(chunk, ensure_ascii=False)}\n\n"

            app.logger.info(
                "Answer generation completed in %.2f seconds",
                time.perf_counter() - generation_started,
            )
            yield "event: done\ndata: \"\"\n\n"
        except Exception:
            app.logger.exception("Failed to stream chatbot answer")
            error = "The answer could not be generated. Please try again."
            yield f"event: error\ndata: {json.dumps(error)}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

if __name__=='__main__':
    app.run(host="0.0.0.0",port=8080,debug=True)
