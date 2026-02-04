# Pawzzle 技术实现说明（简要）

## 项目概述
Pawzzle 是 AI 驱动的宠物领养平台，包含 Expo 移动端与 Spring Boot 后端，提供画像匹配、私聊沟通与领养流程管理。

## 技术架构
- 前端：Expo + React Native + Expo Router
- 后端：Spring Boot 3.x + REST API + Spring AI
- 数据库：PostgreSQL + JSONB + pgvector
- AI：OpenAI Chat/Embedding（1536 维向量）

## 核心实现要点
- **对话式匹配**：15 问访谈 → 画像摘要 → 向量化 → pgvector Top-K 召回 → LLM 精排 Top-3。
- **宠物内容管线**：原始描述 → 结构化标签（JSONB）→ Personality Profile → 向量入库。
- **私聊与领养流程**：线程/消息记录 + 领养申请/确认状态流转。
- **文件上传**：图片上传保存至本地 `uploads/` 并映射 `/uploads/**`。
- **可选能力**：百度语音转写、微信登录。

## 部署与运行
- 数据库：`docker compose up -d` 启动 pgvector/pg16。
- 后端：`./mvnw spring-boot:run`，默认端口 `7860`。
- 前端：`npm run start`，通过 `EXPO_PUBLIC_API_BASE_URL` 指向后端。
