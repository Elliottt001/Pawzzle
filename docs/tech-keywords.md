# 技术路径关键词（Pawzzle）

| C端理解层 | B端数据层 |
| --- | --- |
| 对话式访谈（15 问 / 5 问一组） | 宠物卡片字段 |
| 场景化开放问题 | 结构化标签（JSONB） |
| 语义画像摘要（约 200 字） | Personality Profile |
| 画像向量化（1536 维） | personality_vector 入库 |
| 用户多轮对话 | pgvector 相似度检索 |
| 情感需求与偏好 | 物种/状态过滤 |

## 匹配与决策层
- Top-K 召回（默认 50，可配置）
- LLM 精筛 Top-3
- 置信度输出

## 系统支撑
- Spring Boot 3.x + Spring AI
- PostgreSQL + pgvector
- Expo + React Native + Expo Router

## 输出与运营
- 推荐宠物卡片
- 推荐结果列表
- 生命周期提醒（定时推送）
