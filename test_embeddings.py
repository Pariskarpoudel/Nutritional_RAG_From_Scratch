# test_embeddings.py
# Quick script to test if your RAG retrieval is working end-to-end

import os
import textwrap
import requests
from supabase import create_client, Client
from dotenv import load_dotenv, find_dotenv

# ---- Load environment variables ----
load_dotenv(find_dotenv(usecwd=True))

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
API_URL = os.getenv("HF_EMBEDDING_API_URL")  # http://localhost:8000/embed

# ---- Your project config ----
PDF_SOURCE = "human-nutrition-text.pdf"   # exact value stored in metadata.source
# DOC_ID = "nutrition-v1"                   # safer to filter by doc_id
TOP_K = 5

queries = [
    "How often should infants be breastfed?",
    "What are symptoms of pellagra?",
    "How does saliva help with digestion?",
    "What is the RDI for protein?",
    "water soluble vitamins",
    # "What are micronutrients?",
    # "sources of vitamin D",
    # "role of fiber in digestion"
]

def get_embedding(text: str):
    """Call your local embedding server and return the vector"""
    if not API_URL:
        print("❌ HF_EMBEDDING_API_URL not set in .env")
        return None

    try:
        response = requests.post(
            API_URL,
            json={"text": text},
            timeout=30
        )
        response.raise_for_status()
        data = response.json()

        # Your server returns {"embedding": [...]}
        embedding = data.get("embedding")
        if not embedding or not isinstance(embedding, list):
            print("❌ Unexpected response format:", data)
            return None

        return embedding

    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to embedding server. Is 'python embedding_server.py' running?")
    except requests.exceptions.Timeout:
        print("❌ Embedding request timed out.")
    except requests.exceptions.HTTPError as e:
        print(f"❌ HTTP error: {e}")
        print("Response:", response.text)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

    return None

def main():
    # Connect to Supabase
    sb: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    print("Testing RAG retrieval...\n")

    for q in queries:
        print("=" * 100)
        print(f"QUERY: {q}\n")

        # Get query embedding
        embedding = get_embedding(q)

        if not embedding:
            print("Skipping Supabase search due to embedding failure.\n")
            continue

        print(f"Got embedding (dim={len(embedding)})\n")

        # Search in Supabase – use doc_id filter (most reliable)
        try:
            resp = sb.rpc("match_documents", {
                "query_embedding": embedding,
                "match_count": TOP_K,
                "filter": {"source": PDF_SOURCE}   # or {"source": PDF_SOURCE}
            }).execute()

            rows = resp.data or []

            if not rows:
                print("No matches found.\n")
                continue

            print(f"Found {len(rows)} relevant chunks:\n")

            for rank, row in enumerate(rows, 1):
                page = row.get("metadata", {}).get("page", "?")
                sim = row.get("similarity", 0)
                content = row.get("content", "").replace("\n", " ")
                preview = textwrap.shorten(content, width=200)

                print(f"[{rank}] Page {page} | Similarity: {sim:.3f} | Chunk {row.get('chunk_index')}")
                print(f"    {preview}\n")

        except Exception as e:
            print(f"Supabase RPC error: {e}\n")

if __name__ == "__main__":
    main()