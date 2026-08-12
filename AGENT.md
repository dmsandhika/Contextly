# AI Knowledge Base — Project Specification

## 1. Overview

AI Knowledge Base adalah aplikasi web berbasis **Next.js** yang memungkinkan pengguna mengunggah dokumen, mengelola knowledge base, melakukan pencarian semantik, dan bertanya melalui interface chat.

Tujuan project:

- Menunjukkan kemampuan full-stack development dengan Next.js dan TypeScript.
- Mengimplementasikan document processing.
- Mengimplementasikan semantic/vector search.
- Mengintegrasikan LLM secara modular.
- Menampilkan sumber dokumen pada setiap jawaban AI.
- Tetap dapat dikembangkan dengan biaya rendah/gratis menggunakan free-tier atau model lokal sebagai opsi.

---

## 2. Target User

### Admin / Knowledge Owner

Dapat:

- Membuat knowledge base.
- Upload dokumen.
- Melihat status processing dokumen.
- Menghapus dokumen.
- Melihat daftar dokumen.
- Mengelola knowledge base.

### End User

Dapat:

- Memilih knowledge base.
- Melakukan pencarian.
- Bertanya melalui chat.
- Melihat jawaban AI.
- Melihat sumber/citation dokumen yang digunakan.

---

## 3. Core Features

### 3.1 Authentication

Implementasi:

- Register
- Login
- Logout
- Protected routes
- Session management

Pilihan:

- Auth.js
- OAuth provider sebagai opsi tambahan

---

### 3.2 Dashboard

Dashboard menampilkan:

- Total knowledge base
- Total documents
- Total indexed documents
- Total queries
- Recent activity
- Processing status

Contoh:

```text
Knowledge Bases       5
Documents            128
Indexed              121
Queries              1,284

Recent Activity
- Product Catalog.pdf indexed
- FAQ.pdf uploaded
- 12 questions asked today
```

---

### 3.3 Knowledge Base

User dapat membuat beberapa knowledge base.

Contoh:

```text
Company Knowledge
├── FAQ
├── Product Documentation
└── Internal SOP

Laravel Knowledge
├── Authentication
├── Routing
└── Eloquent
```

Data minimal:

- Name
- Description
- Visibility
- Owner
- Created date
- Updated date

---

## 4. Document Management

### Supported Files

MVP:

- PDF
- DOCX
- TXT
- Markdown

Opsional:

- CSV
- XLSX

### Upload Flow

```text
Upload
  ↓
Validate file
  ↓
Store file
  ↓
Extract text
  ↓
Clean text
  ↓
Split into chunks
  ↓
Generate embeddings
  ↓
Store vectors
  ↓
Mark document as indexed
```

### Document Status

```text
uploaded
processing
indexed
failed
deleted
```

UI harus menampilkan status secara jelas.

Contoh:

```text
Product Catalog.pdf

Status: ● Indexed
Chunks: 142
Uploaded: 12 Aug 2026
```

---

## 5. Document Processing

Processing sebaiknya dilakukan secara asynchronous agar upload tidak menunggu seluruh proses.

Pipeline:

```text
File
 ↓
Text Extraction
 ↓
Text Cleaning
 ↓
Chunking
 ↓
Embedding
 ↓
Vector Storage
```

### Chunking

Dokumen dibagi menjadi potongan teks.

Contoh:

```text
Document
  ├── Chunk 001
  ├── Chunk 002
  ├── Chunk 003
  └── Chunk 004
```

Setiap chunk menyimpan:

- document_id
- content
- chunk_index
- token/character count
- embedding
- metadata

---

## 6. Search System

Project menggunakan **hybrid search**.

### Full Text Search

Digunakan untuk pencarian keyword yang spesifik.

Contoh:

```text
"Laravel Sanctum"
```

### Vector Search

Digunakan untuk mencari dokumen berdasarkan makna.

Contoh:

```text
"Bagaimana cara mengamankan API?"
```

Bisa menemukan dokumen yang membahas:

```text
Laravel Sanctum
API Authentication
Bearer Token
Authentication Middleware
```

meskipun keyword tidak sama persis.

### Hybrid Search

Hasil akhir menggabungkan:

```text
Keyword Score
+
Vector Similarity Score
=
Final Relevance Score
```

---

## 7. PostgreSQL + pgvector

Database utama:

**PostgreSQL**

Extension:

**pgvector**

Contoh struktur:

```text
users
knowledge_bases
documents
document_chunks
conversations
messages
search_logs
```

### document_chunks

Field utama:

```text
id
document_id
chunk_index
content
embedding
metadata
created_at
updated_at
```

---

## 8. AI Chat

User dapat bertanya melalui chat interface.

Contoh:

```text
User:
Bagaimana cara melakukan authentication pada API Laravel?

AI:
Berdasarkan knowledge base yang tersedia,
authentication API dapat menggunakan Laravel Sanctum...

Sources:
[1] Laravel Authentication Guide
[2] API Documentation
```

AI **tidak boleh mengarang sumber**.

Setiap citation harus berasal dari chunk yang benar-benar digunakan dalam retrieval.

---

## 9. RAG Architecture

Implementasikan Retrieval-Augmented Generation.

Flow:

```text
User Question
      ↓
Generate Query Embedding
      ↓
Hybrid Search
      ↓
Top Relevant Chunks
      ↓
Build Context
      ↓
Send Context + Question to LLM
      ↓
Generate Answer
      ↓
Attach Sources
```

Contoh:

```text
Question
   ↓
Search Top 5 Chunks
   ↓
Chunk #12
Chunk #41
Chunk #08
Chunk #77
Chunk #19
   ↓
LLM
   ↓
Answer
   ↓
Citations
```

---

## 10. LLM Provider Abstraction

LLM tidak boleh dibuat tightly coupled dengan satu provider.

Buat abstraction:

```text
LLM Provider
├── Gemini
├── OpenAI
└── Ollama
```

Contoh interface secara konsep:

```text
generateAnswer(question, context)
```

Tujuannya:

- Mudah mengganti provider.
- Bisa menggunakan free-tier.
- Bisa menggunakan local LLM jika diperlukan.
- Tidak perlu mengubah business logic utama.

---

## 11. Embedding Provider

Embedding juga dibuat modular.

Contoh:

```text
Embedding Provider
├── API Embedding
└── Local Embedding
```

Embedding digunakan untuk:

- Document indexing
- Semantic search
- Query similarity

---

## 12. Chat Interface

UI harus terasa seperti modern AI application.

Fitur:

- Streaming response
- Markdown rendering
- Code block
- Copy answer
- Regenerate answer
- Source citations
- Conversation history
- Clear conversation
- Loading state
- Error state

Contoh:

```text
┌──────────────────────────────────────────┐
│ Knowledge Base: Laravel Docs             │
├──────────────────────────────────────────┤
│                                          │
│ User                                     │
│ How does Laravel authentication work?    │
│                                          │
│ AI                                       │
│ Laravel provides several authentication  │
│ mechanisms...                            │
│                                          │
│ Sources                                  │
│ [Laravel Auth Guide] [API Docs]          │
│                                          │
├──────────────────────────────────────────┤
│ Ask anything...                    [→]   │
└──────────────────────────────────────────┘
```

---

## 13. Citation System

Citation menjadi salah satu fitur utama.

Setiap jawaban menampilkan:

- Document name
- Page number jika tersedia
- Chunk
- Relevant text preview
- Link ke document detail

Contoh:

```text
Sources

[1] Laravel Authentication Guide
Page 12

[2] API Security Documentation
Page 8
```

---

## 14. Search Page

Selain chat, tersedia halaman search.

Contoh:

```text
Search:
"API authentication"

Results

94%  Laravel Sanctum Guide
     "...API token authentication..."

87%  Authentication Documentation
     "...protecting API routes..."

79%  Security Guidelines
     "...authentication middleware..."
```

User dapat membuka hasil dan melihat context dokumen.

---

## 15. Analytics

Dashboard analytics:

### Usage

- Total questions
- Questions per day
- Most active knowledge base
- Most searched keywords
- Average response time

### Search Quality

- Average relevance score
- No-result searches
- Frequently retrieved documents
- Most useful documents

Contoh:

```text
QUESTIONS
1,284

AVG RESPONSE
1.8s

NO RESULT
4.2%

TOP KNOWLEDGE BASE
Laravel Documentation
```

---

## 16. Admin Features

Admin dapat:

- Manage users
- Manage knowledge bases
- Manage documents
- Re-index documents
- Delete documents
- View processing errors
- View usage statistics

---

## 17. Tech Stack

### Frontend

- Next.js
- TypeScript
- React
- Tailwind CSS
- shadcn/ui

### Backend

Next.js App Router:

- Route Handlers
- Server Actions where appropriate
- Server Components
- API endpoints

### Database

- PostgreSQL
- pgvector

### Authentication

- Auth.js

### Background Processing

MVP:

- Next.js server-side processing

Production-oriented version:

- Redis
- BullMQ
- Worker process

### Storage

Development:

- Local filesystem

Production:

- S3-compatible object storage

### AI

- Embedding provider
- LLM provider abstraction
- Optional Ollama

### Deployment

Possible options:

- Vercel
- Cloudflare
- VPS
- Railway
- Render

---

## 18. Recommended Project Structure

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   │
│   ├── dashboard/
│   │
│   ├── knowledge-bases/
│   │   ├── [id]/
│   │   └── new/
│   │
│   ├── documents/
│   │
│   ├── chat/
│   │
│   ├── search/
│   │
│   └── api/
│       ├── chat/
│       ├── search/
│       ├── documents/
│       └── embeddings/
│
├── components/
│   ├── ui/
│   ├── chat/
│   ├── documents/
│   ├── knowledge-base/
│   └── dashboard/
│
├── lib/
│   ├── ai/
│   ├── embeddings/
│   ├── search/
│   ├── documents/
│   ├── database/
│   └── auth/
│
├── server/
│   ├── services/
│   └── repositories/
│
└── types/
```

---

## 19. Database Schema

### users

```text
id
name
email
password_hash
created_at
updated_at
```

### knowledge_bases

```text
id
user_id
name
description
created_at
updated_at
```

### documents

```text
id
knowledge_base_id
name
original_name
mime_type
file_size
storage_path
status
page_count
created_at
updated_at
```

### document_chunks

```text
id
document_id
chunk_index
content
embedding
metadata
created_at
updated_at
```

### conversations

```text
id
user_id
knowledge_base_id
title
created_at
updated_at
```

### messages

```text
id
conversation_id
role
content
created_at
```

### search_logs

```text
id
user_id
knowledge_base_id
query
results_count
top_score
response_time
created_at
```

---

## 20. Security Requirements

Wajib:

- Authentication
- Authorization
- Validate uploaded files
- Limit file size
- Sanitize extracted content
- Protect API endpoints
- Rate limiting
- Prevent users from accessing another user's knowledge base
- Never expose API keys to client
- Validate LLM output where necessary

Important:

```text
User A
  ↓
Knowledge Base A ✓

User A
  ↓
Knowledge Base B ✗
```

---

## 21. Free / Low-Cost Development Strategy

Untuk menghindari biaya tinggi:

### Development

Gunakan:

- PostgreSQL lokal
- pgvector lokal
- Local file storage
- Free-tier AI API jika tersedia

### Optional Local AI

Ollama dapat digunakan sebagai optional provider.

Namun **LLM lokal bukan requirement utama**.

Aplikasi harus tetap bisa berjalan tanpa menjalankan model besar di laptop.

---

## 22. MVP Scope

Versi pertama cukup memiliki:

### Authentication

- Login
- Register

### Knowledge Base

- Create
- List
- Delete

### Documents

- Upload PDF/TXT
- Extract text
- Chunk text
- Generate embedding
- Store vector

### Search

- Semantic search
- Result ranking
- Source preview

### Chat

- Ask question
- Retrieve relevant chunks
- Generate answer
- Show citations

### Dashboard

- Document count
- Query count
- Recent documents

---

## 23. Phase 2

Setelah MVP selesai:

- DOCX support
- Streaming AI response
- Conversation history
- Re-index document
- Hybrid search
- Advanced analytics
- Multiple LLM providers
- Multiple embedding providers
- Background jobs
- Redis
- Rate limiting
- Team collaboration

---

## 24. Phase 3 — Production Grade

Tambahkan:

- Multi-tenant architecture
- Team members
- Role & permissions
- API keys
- Webhooks
- Usage limits
- Subscription simulation
- Audit logs
- Queue workers
- Observability
- Error tracking
- Automated tests
- CI/CD

---

## 25. Portfolio Value

Project ini harus ditampilkan sebagai **real software product**, bukan sekadar chatbot.

Skill yang dapat ditunjukkan:

```text
✓ Next.js
✓ TypeScript
✓ React
✓ PostgreSQL
✓ pgvector
✓ Authentication
✓ File processing
✓ Semantic search
✓ RAG
✓ LLM integration
✓ API design
✓ Background processing
✓ Security
✓ Analytics
✓ Modern UI/UX
```

### Portfolio Case Study

Jelaskan:

1. Problem
2. Solution
3. Architecture
4. Technical Challenges
5. Search & RAG Pipeline
6. Security
7. Performance
8. Screenshots
9. Live Demo
10. Source Code

---

## 26. Definition of Done

Project dianggap selesai apabila:

- [ ] User dapat register/login.
- [ ] User dapat membuat knowledge base.
- [ ] User dapat upload dokumen.
- [ ] Dokumen berhasil diproses.
- [ ] Text berhasil dipecah menjadi chunks.
- [ ] Embeddings tersimpan di PostgreSQL.
- [ ] Semantic search berjalan.
- [ ] User dapat bertanya melalui chat.
- [ ] Jawaban menggunakan context hasil retrieval.
- [ ] Citation ditampilkan.
- [ ] User tidak dapat mengakses data user lain.
- [ ] Dashboard menampilkan statistik.
- [ ] Error handling tersedia.
- [ ] Responsive UI.
- [ ] README lengkap.
- [ ] Demo deployment tersedia.
- [ ] Automated tests untuk fitur utama.

---

## 27. Suggested MVP Pages

```text
/login
/register

/dashboard

/knowledge-bases
/knowledge-bases/new
/knowledge-bases/[id]

/documents/[id]

/chat/[conversationId]

/search

/settings
```

---

## 28. Product Name Ideas

Beberapa nama untuk project:

- **Knowly**
- **ContextAI**
- **DocMind**
- **Recall**
- **Nexa Knowledge**
- **Brainbase**
- **ContextHub**
- **KnowStack**
- **QueryBase**

Untuk portfolio, gunakan nama yang terdengar seperti SaaS sungguhan, bukan nama project kuliah.

---

## 29. Recommended Final Stack

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui

PostgreSQL
pgvector

Auth.js

LLM Provider Abstraction
Embedding Provider Abstraction

Local Storage
S3-compatible Storage (production)

Redis + BullMQ (Phase 2)

Docker

Vercel / VPS
```

## 30. Development Principle

Prioritas utama:

```text
Functionality
    ↓
Correctness
    ↓
Security
    ↓
Performance
    ↓
UX
    ↓
Visual Polish
```

Jangan membuat UI yang terlihat canggih tetapi retrieval dan citation-nya tidak akurat.

**Core value project ini adalah:**

> Upload your knowledge. Search by meaning. Ask questions. Get answers with sources.
