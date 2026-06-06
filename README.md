<div align="center">

# 🧠 Synapraxis AI

### *AI-Powered Personal Learning Operating System*

**Synapse × Praxis** — Connecting knowledge to practical action.

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

## 📋 Overview

Synapraxis is a **production-grade, adaptive AI learning platform** that generates fully personalized audio-visual lessons on **any topic** for **any age group** in seconds. Type any subject — and receive a world-class interactive lesson complete with narration, quizzes, and live AI tutoring.

> **Core Vision:** A single-search, infinite-depth learning platform where any human on Earth can type what they want to learn — and receive a world-class, personalized lesson in under 10 seconds.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 **AI Lesson Generation** | Structured lessons with hooks, concepts, deep dives, examples, and quizzes on any topic |
| 🎙️ **Audio Narration** | Browser Text-to-Speech reads lessons aloud with section-synced highlighting |
| 🧩 **Interactive Concept Grid** | Click-to-complete concept cards that drive your learning progress |
| ❓ **Adaptive Quiz Engine** | Multiple-choice assessments with explanations and score tracking |
| 💬 **AI Tutor Chat** | Ask questions mid-lesson and get contextual answers from the AI tutor |
| 🎚️ **Personalization Controls** | Adjust age group (Kids/Teen/Adult/Expert) and difficulty (Beginner/Intermediate/Advanced) |
| 🔊 **Pulsing Audio Orb** | Animated visual orb with waveform bars synced to audio playback |
| 📝 **Workspace Notes** | Take personal notes alongside auto-generated summaries |
| 📊 **Learning Stats** | Track completed concepts, quiz accuracy, and subject coverage |
| 🗺️ **Learning Path** | Auto-generated 5-step syllabus roadmap per topic |
| ⚡ **Topic Chaining** | One-click "Deep Dive" navigation on core concepts to chain related sub-lessons |
| 🗃️ **Persistent Database** | SQLite database tracking user profile details, XP, streaks, daily goals, and course history |
| ⚡ **Caching Service** | Redis caching (with local in-memory fallback) for instant lesson retrieval |
| 🎛️ **User Dashboard** | Pinned progress bars, active roadmap view, and a vault to resume past lessons |

---

## 🏗️ Architecture

The project uses a **decoupled frontend + backend** architecture designed with an **Interface/Adapter pattern** to enable a seamless future upgrade to a multi-agent AI system.

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Compose                         │
├──────────────────────────┬──────────────────────────────────┤
│   Frontend (Nginx:80)    │       Backend (Uvicorn:8000)     │
│                          │                                  │
│  React 19 + TypeScript   │  FastAPI + Pydantic              │
│  Vite + Tailwind v4      │                                  │
│  Zustand State Store     │  ILessonGenerationService        │
│                          │    ├─ SimpleLLMLessonService     │
│  /api/* ──proxy──────────┼──► │    (Gemini / Claude)        │
│                          │    └─ [Future] MultiAgentService │
│                          │         (LangGraph / Neo4j)      │
└──────────────────────────┴──────────────────────────────────┘
```

### Easy-Switch Design

The backend uses dependency injection via a service interface:

```python
# backend/app/api/endpoints/lesson.py
def get_lesson_service() -> ILessonGenerationService:
    # TODAY: Single-prompt LLM call
    return SimpleLLMLessonService()
    # FUTURE: Swap to multi-agent orchestrator
    # return MultiAgentLessonService()
```

The frontend is **completely decoupled** — it only consumes the `LessonResponse` JSON contract. Swapping the backend engine requires **zero frontend changes**.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 · TypeScript · Vite 8 · Tailwind CSS v4 |
| **State** | Zustand |
| **Icons** | Lucide React |
| **Backend** | FastAPI · Python 3.12 · Pydantic v2 |
| **AI Models** | Google Gemini (default) · Anthropic Claude (optional) |
| **Voice** | Web Speech API (browser TTS) |
| **Containerization** | Docker · Docker Compose · Nginx |

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- A **Google Gemini API Key** (or Anthropic Claude API Key)

### 1. Clone the Repository

```bash
git clone https://github.com/Ruthless3217/Synapraxis.git
cd Synapraxis
```

### 2. Configure Environment Variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add your API key:

```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

### 3. Run with Docker Compose

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| **Frontend** | [http://localhost:3000](http://localhost:3000) |
| **Backend API** | [http://localhost:8000](http://localhost:8000) |
| **API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) |

### 4. Run Without Docker (Local Development)

**Backend:**
```bash
cd backend
python -m venv venv
# Windows: .\venv\Scripts\Activate.ps1
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

The frontend dev server runs at `http://localhost:5173` and proxies API calls to `http://localhost:8000`.

---

## 📁 Project Structure

```
Synapraxis/
├── docker-compose.yml              # Container orchestration
├── .gitignore
├── README.md
│
├── backend/
│   ├── Dockerfile                  # Python 3.12 slim container
│   ├── .dockerignore
│   ├── .env.example                # Environment variable template
│   ├── requirements.txt            # Python dependencies
│   └── app/
│       ├── __init__.py
│       ├── main.py                 # FastAPI entry point + CORS
│       ├── api/
│       │   └── endpoints/
│       │       ├── lesson.py       # GET /api/lesson/generate
│       │       └── chat.py         # POST /api/chat/tutor
│       ├── schemas/
│       │   └── lesson.py           # Pydantic response models
│       └── services/
│           ├── lesson_service_interface.py   # Abstract contract
│           └── lesson_service_simple.py      # Gemini/Claude implementation
│
└── frontend/
    ├── Dockerfile                  # Multi-stage: Node build → Nginx serve
    ├── .dockerignore
    ├── nginx.conf                  # Nginx: SPA routing + API proxy
    ├── .env.development            # Dev API URL (localhost:8000)
    ├── .env.production             # Prod API URL (empty — Nginx proxies)
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── main.tsx                # React entry point
        ├── App.tsx                 # Root component & routing
        ├── index.css               # Design system (Sora, DM Serif, animations)
        ├── config/
        │   └── api.ts              # Centralized API URL config
        ├── types/
        │   └── lesson.ts           # TypeScript interfaces
        ├── store/
        │   └── useLessonStore.ts   # Zustand global state
        └── components/
            ├── TopNav.tsx          # Header with logo, XP, streak
            ├── LeftSidebar.tsx     # Topic chips, history, settings
            ├── HomeScreen.tsx      # Hero search + feature grid
            ├── VideoPlayer.tsx     # Pulsing orb + TTS controls
            ├── LessonContent.tsx   # Concepts, quiz, deep dive
            └── RightPanel.tsx      # Tutor chat, notes, stats, path
```

---

## 🔮 Roadmap

- [x] **Phase 1** — Core lesson generation engine + search UI
- [x] **Phase 2** — Interactive quiz, AI tutor chat, audio narration
- [x] **Phase 3** — Persistent SQLite history, streak validation, XP system, and user dashboard
- [x] **Phase 4** — Caching layer with Redis + local in-memory fallback
- [ ] **Phase 5** — User authentication, ElevenLabs voices, dark mode, PDF export
- [ ] **Phase 6** — Multi-agent backend (LangGraph / Neo4j), image/doc upload, Socratic mode

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <strong>Built by Zeus · Synapraxis AI · 2026</strong>
</div>
