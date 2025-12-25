# Nutrition RAG Chatbot: Built from Scratch

A fully manual **Retrieval-Augmented Generation (RAG)** system built without any frameworks like LangChain or LangGraph. This chatbot answers nutrition-related questions grounded strictly in:

**Human Nutrition Textbook** (University of Hawai'i at Mānoa)  
📄 [PDF Source]([https://pressbooks.oer.hawaii.edu/humannutrition2/open/download?type=pdf](https://pressbooks.oer.hawaii.edu/humannutrition2/))

---

## 🎯 Project Highlights

- ✅ **No RAG frameworks** – Everything engineered from scratch
- ✅ **Custom chunking strategies** – Sentence-based with overlap
- ✅ **Local embeddings** – Using `nomic-embed-text-v1.5` via Sentence Transformers
- ✅ **PostgreSQL + pgvector** – No external vector databases
- ✅ **Streaming responses** – Real-time generation with inline citations
- ✅ **Full-stack implementation** – Next.js frontend + API backend

---

## 📸 Interface
<img width="1200" height="600" alt="image" src="https://github.com/user-attachments/assets/63e7aa67-e856-4333-b6ba-97665b147cc3" />
<img width="1200" height="600" alt="image" src="https://github.com/user-attachments/assets/16bce67b-efdf-4b1c-8306-662f98066b31" />

---

## 🏗️ System Architecture

```
PDF Document
    ↓
Text Extraction (PyMuPDF)
    ↓
Custom Sentence-based Chunking
    ↓
Local Embedding Generation (nomic-embed-text-v1.5)
    ↓
PostgreSQL + pgvector Storage
    ↓
Cosine Similarity Search
    ↓
LLM Response Generation (Groq)
```

---

## 🔧 Core Components

### **1. Document Ingestion** (`ingest.py`)
- Extracts text from PDF using PyMuPDF
- Implements custom **sentence-based chunking**:
  - 20 sentences per chunk
  - 2-sentence overlap between chunks
  - Token safety cap at 1300 tokens
  - Minimum 50 tokens per chunk
- Generates embeddings locally using Sentence Transformers
- Stores everything in PostgreSQL with pgvector

### **2. Backend API** (`route.ts`)
- Self-hosted embedding endpoint integration
- Vector similarity search via SQL
- Streaming LLM responses with **inline citations**
- Wikipedia-style reference formatting
- Dynamic response formatting (paragraphs vs bullet points)

---

## 📊 Database Architecture

**PostgreSQL with pgvector extension** stores:
- Document chunks with content
- 768-dimensional embedding vectors
- Page metadata for citations
- IVFFlat index for fast cosine similarity search

Custom SQL function enables efficient similarity matching with optional metadata filtering.

---

## 🚀 Setup Instructions

### **Prerequisites**
- Python 3.8+
- PostgreSQL with pgvector extension
- Node.js 18+

### **Installation Steps**

**1. Clone Repository**
```bash
git clone https://github.com/Pariskarpoudel/Nutritional_RAG_From_Scratch
cd Nutritional_RAG_From_Scratch
```

**2. Python Environment Setup**
```bash
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install pymupdf tiktoken supabase sentence-transformers tqdm python-dotenv
```

**3. Configure Environment Variables**

Create `.env` file with:
- Supabase URL and service role key
- Hugging Face embedding API endpoint

**4. Run Document Ingestion**
```bash
python ingest.py
```

**5. Frontend Setup**
```bash
cd rag-chat
npm install
```

Create `.env.local` with database credentials and API keys.

**6. Launch Application**
```bash
npm run dev
```

Access at: `http://localhost:3000`

---

## 📁 Repository Structure

```
.
├── ingest.py                    # Document ingestion & chunking
├── human-nutrition-text.pdf     # Source document
├── rag-chat/
│   ├── src/
│   │   └── app/
│   │       ├── api/
│   │       │   └── chat/
│   │       │       └── route.ts  # Backend API
│   │       └── page.tsx          # Frontend UI
│   └── package.json
├── .env                          # Environment variables
└── README.md
```

---

## 🎨 Key Features

### **Custom Chunking Strategy**
- Sentence-based approach with configurable overlap
- Handles hyphenation and whitespace normalization
- Token-aware chunking with safety caps
- Preserves page metadata for accurate citations

### **Citation System**
- Inline citations with [1], [2] format
- Page numbers displayed for each source
- Similarity scores shown for transparency
- Full source context available on hover

---

## 🧠 How It Works

**Query Processing Pipeline:**

1. **User Query** → Converted to embedding vector using local model
2. **Vector Search** → Top 8 most similar chunks retrieved from database
3. **Context Assembly** → Chunks formatted with numbered citations
4. **LLM Generation** → Groq streams grounded response in real-time
5. **Frontend Display** → Response rendered with interactive citations

The system ensures every factual claim is backed by source material, preventing hallucinations and maintaining accuracy.

---

## 🔮 Future Improvements

- [ ] Implement re-ranking for retrieved chunks
- [ ] Add multi-vector scoring per chunk
- [ ] Enhanced citation UI with expandable sources
- [ ] Support for multiple nutrition documents
- [ ] Docker containerization for easy deployment
- [ ] Evaluation metrics dashboard

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

---

## 👤 Author

**Pariskar Sharma Poudel**  
GitHub: [https://github.com/Pariskarpoudel/]  
Project: [[Repository Link](https://github.com/Pariskarpoudel/Nutritional_RAG_From_Scratch)]

---
