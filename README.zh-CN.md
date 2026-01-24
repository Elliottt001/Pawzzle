# Pawzzle

其他语言: [English](README.md).

AI 驱动的宠物领养平台，包含 Expo 移动端和 Spring Boot 后端。

## 功能
- Agent 式问答（15 题）生成结构化用户画像。
- pgvector Top-K 召回 + LLM 重排，输出 Top-3 匹配结果。
- 领养流程：聊天、申请、审批决策。
- 宠物内容管线：原始描述 → 结构化标签 → 性格向量。
- 移动端优先 UI（Expo Router），可选语音转写接口。

## 架构流程
1) Agent 访谈生成画像摘要（约 200 字）。
2) 画像向量化（1536 维）。
3) pgvector Top-K 召回（默认 50，可配置）。
4) LLM 精排 Top-3 并给出置信度。
5) 输出推荐宠物卡片。

## 技术栈
- 后端: Spring Boot 3.x (REST API)
- AI: Spring AI (OpenAI Chat + Embedding)
- 数据库: PostgreSQL + JSONB + pgvector
- 前端: Expo + React Native + Expo Router
- 基础设施: Docker Compose (pgvector/pg16)

## 快速开始
### 数据库
```bash
docker compose up -d
```

### 后端
```bash
cd backend
./mvnw spring-boot:run
```

### 前端
```bash
cd frontend
npm install
npm run start
```

## 手机联网 (LAN + Tunnel)
真机需要能访问后端，请设置明确的 API 地址:

```bash
# 局域网
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.23:8080

# Cloudflared 隧道
EXPO_PUBLIC_API_BASE_URL=https://xxxx.trycloudflare.com
```

说明:
- 应用优先读取 `EXPO_PUBLIC_API_BASE_URL`，其次读取 `EXPO_PUBLIC_API_URL`。
- 你也可以在 `frontend/lib/apiBase.ts` 里写死回退 IP。
- 后端需监听 `0.0.0.0:8080`，并确保 8080 端口可访问。
- Web 和模拟器会自动使用 localhost/10.0.2.2。

Cloudflared 示例:
```bash
./cloudflared tunnel --url http://localhost:8080 --protocol http2 --edge-ip-version 4
```

## 打包 APK (EAS)
```bash
cd frontend
npm i -g eas-cli
eas login
eas build -p android --profile preview
```

`preview` profile 在 `frontend/eas.json` 中已配置为输出 APK。若计划发布，请检查 `frontend/app.json` 里的 Android 包名。

## 环境变量
后端 (`backend/.env`):
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_CHAT_MODEL`
- `OPENAI_EMBEDDING_MODEL`
- `PAWZZLE_MATCHING_CANDIDATE_LIMIT` (默认 50)

前端:
- `EXPO_PUBLIC_API_BASE_URL` (推荐)
- `EXPO_PUBLIC_API_URL` (兼容旧配置)

## 目录结构
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

## 文档
- `docs/tech-keywords.md`
