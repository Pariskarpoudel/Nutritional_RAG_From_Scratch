# embedding_server.py
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import uvicorn

app = FastAPI()

# Load the EXACT same model
model = SentenceTransformer(
    "nomic-ai/nomic-embed-text-v1.5",
    trust_remote_code=True
)

class EmbeddingRequest(BaseModel):
    text: str

@app.post("/embed")
async def embed(request: EmbeddingRequest):
    # IMPORTANT: Add the prefix for queries (just like Nomic recommends)
    prefixed_text = "search_query: " + request.text
    
    embedding = model.encode(
        prefixed_text,
        normalize_embeddings=True,  # Must match ingest.py
        batch_size=1
    ).tolist()
    
    return {"embedding": embedding}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)