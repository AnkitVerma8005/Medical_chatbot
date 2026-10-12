from dotenv import load_dotenv
import os
from src.helper import load_pdf_files , filter_to_minimal_docs, load_embeddings , text_split
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

extracted_data = load_pdf_files(data="data/")
filter_data = filter_to_minimal_docs(extracted_data)
text_chunks = text_split(filter_data)

embedding = load_embeddings()

pinecone_api_key = PINECONE_API_KEY
pc = Pinecone(pinecone_api_key)



index_name = "medical-chatbot"

if not pc.has_index(index_name):
    pc.create_index(
        name = index_name,
        dimension = 384,    # Dimention of embeddings
        metric = "cosine" ,  # cosine similairty
        spec = ServerlessSpec(cloud="aws",region="us-east-1")        
    )

index = pc.Index(index_name)


docsearch = PineconeVectorStore.from_documents(
    documents = text_chunks,
    embedding = embedding,
    index_name = index_name
)