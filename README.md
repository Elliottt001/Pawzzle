# Pawzzle - AI-Driven Pet Adoption Platform

## 架构说明
本项目采用 **“逻辑解耦，物理单体” (Logical Decoupling, Physical Monolith)** 架构。

### 核心设计
1.  **Backend (后端)**:
    *   **框架**: Spring Boot 3.x (All-in-one)
    *   **数据库**: PostgreSQL (Relational + JSONB + pgvector)
    *   **AI**: Spring AI / LangChain4j (In-process execution)
    *   **状态管理**: Spring StateMachine (Order flow)

2.  **Frontend (前端)**:
    *   **框架**: React Native
    *   **UI**: Tailwind CSS + Shadcn/UI
    *   **交互**: Vercel AI SDK / WebSocket

### 目录结构
```bash
Pawzzle/
├── backend/                # Spring Boot Monolith
│   ├── src/main/java/com/pawzzle
│   │   ├── core/           # Shared utilities
│   │   ├── domain/         # Domain Entities (User, Pet, Order)
│   │   ├── infrastructure/ # External services (AI, OSS)
│   │   ├── statemachine/   # Flow control configuration
│   │   ├── privacy/        # AOP based output masking
│   │   └── web/            # REST Controllers
│   └── pom.xml
├── frontend/               # Next.js App
│   ├── src/app/
│   └── package.json
└── databases/              # SQL Initialization
```

## 快速开始
### Backend
1. Ensure PostgreSQL is running and DB `pawzzle` is created.
2. `cd backend`
3. `./mvnw spring-boot:run`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`
