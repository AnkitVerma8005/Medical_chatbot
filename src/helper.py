from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings

from typing import List
from langchain_core.documents import Document


# extracted data from the pdf file 
def load_pdf_files(data):
    loader = DirectoryLoader(
        data,
        glob="*.pdf",
        loader_cls=PyPDFLoader
    )

    documents = loader.load()
    return documents

def filter_to_minimal_docs(docs:List[Document])->List[Document]:
    """
    function takes list of documents and return a new list of objects 
    containg only 'source' in metadata and the original page_content.
    """
    minimal_docs: List[Document] = []

    for doc in docs:
        src = doc.metadata.get("source")
        minimal_docs.append(
            Document(
                page_content = doc.page_content,
                metadata = {"source":src}
            )
        )
    return minimal_docs

# Splitting the documents into smaller chunks

def text_split(minimal_docs):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size = 500,
        chunk_overlap = 20,
    )
    texts_chunk = text_splitter.split_documents(minimal_docs)
    return texts_chunk

def load_embeddings():
    # Download HuggingFace embedding model

    model_name = "sentence-transformers/all-MiniLM-L6-v2"
    embeddings = HuggingFaceEmbeddings(
        model_name = model_name
    )
    return embeddings
