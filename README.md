# Pawzzle

Read this in other languages: [Chinese](README.zh-CN.md).

AI-driven pet adoption platform with an Expo mobile client and a Spring Boot backend.

## Features
- Agent-style onboarding (15 questions) to build a structured user profile.
- Vector search with pgvector Top-K recall and LLM reranking for Top-3 matches.
- Adoption flow with chat threads, requests, and decisions.
- Pet content pipeline: raw descriptions to structured tags and personality vectors.
- Mobile-first UI with Expo Router; optional voice transcription endpoint.

## Architecture
1) Agent interview produces a profile summary (~200 words).
2) Profile embedding (1536 dims).
3) pgvector Top-K recall (default 50, configurable).
4) LLM reranks Top-3 with confidence scores.
5) Render recommended pet cards.

## Tech Stack
- Backend: Spring Boot 3.x (REST API)
- AI: Spring AI (OpenAI chat + embedding)
- Database: PostgreSQL + JSONB + pgvector
- Frontend: Expo + React Native + Expo Router
- Infra: Docker Compose (pgvector/pg16)

## Quick Start
### Database
```bash
docker compose up -d
```

### Backend
```bash
cd backend
./mvnw spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm run start
```

## Mobile Networking (LAN + Tunnel)
Physical devices must reach your backend. Set an explicit base URL:

```bash
# LAN
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.23:8080

# Cloudflared tunnel
EXPO_PUBLIC_API_BASE_URL=https://xxxx.trycloudflare.com
```

Notes:
- The app reads `EXPO_PUBLIC_API_BASE_URL` first, then `EXPO_PUBLIC_API_URL`.
- The fallback LAN IP lives in `frontend/lib/apiBase.ts` if you prefer hardcoding.
- Backend should listen on `0.0.0.0:8080` and port 8080 must be reachable.
- Web and simulators still use localhost/10.0.2.2 defaults automatically.

Example cloudflared command:
```bash
./cloudflared tunnel --url http://localhost:8080 --protocol http2 --edge-ip-version 4
```

## Build APK (EAS)
```bash
cd frontend
npm i -g eas-cli
eas login
eas build -p android --profile preview
```

The `preview` profile in `frontend/eas.json` outputs an APK. Update the Android package in `frontend/app.json` if you plan to publish.

## Environment Variables
Backend (`backend/.env`):
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_CHAT_MODEL`
- `OPENAI_EMBEDDING_MODEL`
- `PAWZZLE_MATCHING_CANDIDATE_LIMIT` (default 50)

Frontend:
- `EXPO_PUBLIC_API_BASE_URL` (preferred)
- `EXPO_PUBLIC_API_URL` (legacy)

## Project Structure
```bash
Pawzzle/
├── backend/                # Spring Boot monolith
│   ├── src/main/java/com/pawzzle
│   │   ├── core/           # Shared utilities
│   │   ├── domain/         # Entities (User, Pet, Order)
│   │   ├── infrastructure/ # External services (AI, OSS)
│   │   ├── statemachine/   # Flow control configuration
│   │   ├── privacy/        # AOP output masking
│   │   └── web/            # REST controllers
│   └── pom.xml
├── frontend/               # Expo + React Native app
│   ├── app/
│   └── package.json
├── database/               # SQL initialization
├── docs/                   # Technical docs
└── src/                    # Process docs
```

## Docs
- `docs/tech-keywords.md`
