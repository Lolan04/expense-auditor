from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

CHROMA_PATH = "./chroma_db"

def load_policy():
    """Load policy PDF and store in ChromaDB (FREE, no API key needed)"""
    loader = PyPDFLoader("policy/policy.pdf")
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(documents)

    # FREE local embeddings - no OpenAI needed!
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    
    Chroma.from_documents(
        chunks, embeddings, persist_directory=CHROMA_PATH
    )
    print(f"✅ Loaded {len(chunks)} policy chunks into ChromaDB (FREE!)")

def search_policy(query: str) -> str:
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)
    results = db.similarity_search(query, k=3)
    return "\n\n".join([r.page_content for r in results])