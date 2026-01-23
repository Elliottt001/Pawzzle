# Pawzzle - AI-Driven Pet Adoption Platform

## 架构说明
本项目采用 **“逻辑解耦，物理单体” (Logical Decoupling, Physical Monolith)** 架构。

### 技术栈
- **Backend (后端)**: Spring Boot 3.x (REST API)
- **AI (模型调用)**: Spring AI (OpenAI Chat + Embedding)
- **数据库**: PostgreSQL (Relational + JSONB + pgvector)
- **Frontend (前端)**: Expo + React Native + Expo Router
- **基础设施**: Docker Compose (pgvector/pg16)

### 核心匹配链路
1. Agent 15 问（5 问一组）生成用户画像摘要（约 200 字）
2. 用户画像向量化（1536 维）
3. pgvector Top-K 召回候选（默认 50，可通过配置调整）
4. LLM 精筛 Top-3 并输出置信度
5. 输出推荐宠物卡片

### 宠物数据流
- 原始描述 → LLM 结构化标签（JSONB）
- Personality Profile → 向量入库（personality_vector）

### 技术路径关键词文档
- `docs/tech-keywords.md`

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
├── frontend/               # Expo + React Native app
│   ├── app/
│   └── package.json
├── database/               # SQL Initialization
├── docs/                   # Technical docs
└── src/                    # Process docs
```

## 快速开始
### Database
1. `docker compose up -d`

### Backend
1. Ensure PostgreSQL is running and DB `pawzzle` is created.
2. `cd backend`
3. `./mvnw spring-boot:run`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run start`

## 环境变量
Backend (`backend/.env`):
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_CHAT_MODEL`
- `OPENAI_EMBEDDING_MODEL`
- `PAWZZLE_MATCHING_CANDIDATE_LIMIT` (Top-K 候选数量，默认 50)
