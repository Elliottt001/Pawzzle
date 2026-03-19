# Agent 交互强化与社区闭环补全 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 强化 `agent` 主路径的动效与回复节奏，并把社区页已有但未接通的发布与内容逻辑补成真实可用闭环。

**Architecture:** 保持 `agent` 页面主要 UI 仍留在 [`frontend/app/(tabs)/agent.tsx`](/home/yuuray/桌面/Pawzzle/.worktrees/agent-motion/frontend/app/(tabs)/agent.tsx) 内，只把适合 TDD 的纯逻辑抽成小 helper。动效继续以 `react-native-reanimated` 为主，社区页优先复用现有状态和请求逻辑，避免无关重构。

**Tech Stack:** Expo Router, React Native, TypeScript, `react-native-reanimated`, Node `--test --experimental-strip-types`, ESLint

---

## 文件边界

- Modify: `frontend/components/agent/motion.ts`
  - 扩展底栏按钮和中心 tab 按钮的 preset
- Modify: `frontend/components/agent/motion.test.ts`
  - 为新增动效 contract 先写失败测试
- Create: `frontend/components/agent/streaming.ts`
  - 纯流式输出 helper，例如分块与逐字节奏配置
- Create: `frontend/components/agent/streaming.test.ts`
  - 覆盖流式输出 helper 的最小行为
- Modify: `frontend/app/(tabs)/agent.tsx`
  - 接入更强底栏按钮动效、AI 流式输出与更明显的浮现
- Modify: `frontend/components/pawzzle-tab-bar.tsx`
  - 中央 `agent` tab 的强化动效
- Create: `frontend/components/community/logic.ts`
  - 纯函数：tab 内容选择、搜索过滤、发布文案与可提交判定
- Create: `frontend/components/community/logic.test.ts`
  - 社区页纯逻辑测试
- Modify: `frontend/app/(tabs)/community.tsx`
  - 把已有逻辑状态真实接到 UI

## Task 1: 先锁定更强按钮动效 preset 的 contract

**Files:**
- Modify: `frontend/components/agent/motion.ts`
- Modify: `frontend/components/agent/motion.test.ts`

- [ ] **Step 1: 为主按钮和中心 tab 按钮补 failing tests**

在 `motion.test.ts` 中新增断言：

- `hero-icon` 比普通 `icon` 压得更明显
- `hero-icon` 的回弹比普通 `icon` 更有弹性
- 中央 tab 的 preset 含有聚焦态脉冲或抬升配置

- [ ] **Step 2: 跑测试并确认新增断言先失败**

Run:

```bash
cd frontend && node --test --experimental-strip-types components/agent/motion.test.ts
```

Expected:

- FAIL
- 失败原因指向 `hero-icon` 或中心 tab preset 尚未实现

- [ ] **Step 3: 在 `motion.ts` 中补最小实现**

新增或扩展：

- `hero-icon`
- `tab-center`

确保返回结构稳定，便于 UI 层直接消费。

- [ ] **Step 4: 再跑测试确认恢复为绿色**

Run:

```bash
cd frontend && node --test --experimental-strip-types components/agent/motion.test.ts
```

Expected:

- PASS

- [ ] **Step 5: 提交这一小步**

```bash
git add frontend/components/agent/motion.ts frontend/components/agent/motion.test.ts
git commit -m "test: extend agent motion presets"
```

## Task 2: 用 TDD 建立 AI 流式输出 helper

**Files:**
- Create: `frontend/components/agent/streaming.ts`
- Create: `frontend/components/agent/streaming.test.ts`

- [ ] **Step 1: 先写 failing tests，定义流式切片行为**

至少覆盖：

- 空字符串不会生成多余块
- 短文本按最小块拆分
- 中文文本会稳定前进，不回退不重复

- [ ] **Step 2: 跑测试并确认模块缺失或断言失败**

Run:

```bash
cd frontend && node --test --experimental-strip-types components/agent/streaming.test.ts
```

Expected:

- FAIL

- [ ] **Step 3: 在 `streaming.ts` 中写最小实现**

提供纯 helper，例如：

- `buildStreamingFrames(text)`
- `getStreamingTickMs(length)`

- [ ] **Step 4: 再跑测试确认通过**

Run:

```bash
cd frontend && node --test --experimental-strip-types components/agent/streaming.test.ts
```

Expected:

- PASS

- [ ] **Step 5: 提交这一小步**

```bash
git add frontend/components/agent/streaming.ts frontend/components/agent/streaming.test.ts
git commit -m "test: add agent streaming helpers"
```

## Task 3: 集成 Agent 页更强按钮动效与流式输出

**Files:**
- Modify: `frontend/app/(tabs)/agent.tsx`
- Reference: `frontend/components/agent/motion.ts`
- Reference: `frontend/components/agent/streaming.ts`

- [ ] **Step 1: 在 `agent.tsx` 中定位需要增强的主路径控件**

至少包含：

- 底栏语音按钮
- 底栏发送按钮
- 聊天气泡 AI 回复

- [ ] **Step 2: 先接入流式输出状态，确保 AI 回复不再整段瞬时出现**

实现要点：

- 用户消息保持即时入列
- AI 完整文本返回后，先创建空内容消息
- 用 timer 逐帧追加文本
- 新请求开始、页面卸载时都清理 timer

- [ ] **Step 3: 强化底栏按钮反馈**

要求：

- 发送按钮使用更明显的压缩和回弹
- 语音按钮点击感强于现在
- 禁用态视觉仍然稳定

- [ ] **Step 4: 跑定向验证**

Run:

```bash
cd frontend && node --test --experimental-strip-types components/agent/motion.test.ts components/agent/streaming.test.ts
cd frontend && npx eslint 'app/(tabs)/agent.tsx' --max-warnings 0
```

Expected:

- tests PASS
- eslint PASS

- [ ] **Step 5: 提交这一小步**

```bash
git add frontend/app/(tabs)/agent.tsx
git commit -m "feat: strengthen agent chat interactions"
```

## Task 4: 强化底部中间 Agent Tab 按钮

**Files:**
- Modify: `frontend/components/pawzzle-tab-bar.tsx`
- Reference: `frontend/components/agent/motion.ts`

- [ ] **Step 1: 在现有 tab bar 上先补一个最小可集成的动画层**

要求：

- 普通 tab 维持当前轻反馈
- 中间 `agent` tab 有独立更强反馈
- focused 状态下有轻脉冲或抬升感

- [ ] **Step 2: 接入 `reanimated` 并避免影响导航逻辑**

- [ ] **Step 3: 跑定向 lint**

Run:

```bash
cd frontend && npx eslint components/pawzzle-tab-bar.tsx --max-warnings 0
```

Expected:

- PASS

- [ ] **Step 4: 提交这一小步**

```bash
git add frontend/components/pawzzle-tab-bar.tsx
git commit -m "feat: highlight agent tab button"
```

## Task 5: 用 TDD 抽出社区页纯逻辑并接上 UI

**Files:**
- Create: `frontend/components/community/logic.ts`
- Create: `frontend/components/community/logic.test.ts`
- Modify: `frontend/app/(tabs)/community.tsx`

- [ ] **Step 1: 先写 failing tests，覆盖社区页最容易回归的纯逻辑**

至少覆盖：

- `recommend / knowledge / post` 三个 tab 的内容选择
- 搜索只过滤推荐 feed
- 发布按钮文案会随 `uploadType` 切换
- 未登录或字段不完整时不可提交

- [ ] **Step 2: 跑测试并确认失败**

Run:

```bash
cd frontend && node --test --experimental-strip-types components/community/logic.test.ts
```

Expected:

- FAIL

- [ ] **Step 3: 写最小 helper 实现**

- [ ] **Step 4: 把 `community.tsx` 接成真实闭环**

要求：

- 顶部出现可切换的 `推荐 / 知识 / 发布`
- `推荐` 使用现有 feed，并让搜索生效
- `知识` 使用 `/api/home` 返回的 guides
- `发布` 接上已有 `uploadOpen`、`uploadType`、`handleCreateCard`、`handleCreateContent`
- `动态` 发布必须可用
- 成功/失败/登录提示要可见

- [ ] **Step 5: 运行验证**

Run:

```bash
cd frontend && node --test --experimental-strip-types components/community/logic.test.ts
cd frontend && npx eslint 'app/(tabs)/community.tsx' --max-warnings 0
```

Expected:

- tests PASS
- eslint PASS

- [ ] **Step 6: 提交这一小步**

```bash
git add frontend/components/community/logic.ts frontend/components/community/logic.test.ts 'frontend/app/(tabs)/community.tsx'
git commit -m "feat: complete community interaction flows"
```

## Task 6: 最终验证与人工检查项

**Files:**
- Verify only

- [ ] **Step 1: 跑所有新增定向测试**

Run:

```bash
cd frontend && node --test --experimental-strip-types \
  components/agent/motion.test.ts \
  components/agent/streaming.test.ts \
  components/community/logic.test.ts
```

Expected:

- PASS

- [ ] **Step 2: 跑修改文件的定向 lint**

Run:

```bash
cd frontend && npx eslint \
  'app/(tabs)/agent.tsx' \
  'app/(tabs)/community.tsx' \
  components/pawzzle-tab-bar.tsx \
  --max-warnings 0
```

Expected:

- PASS

- [ ] **Step 3: 跑前端全量 lint，记录历史 warning 基线**

Run:

```bash
cd frontend && npm run lint
```

Expected:

- Exit code 0
- 可能仍有仓库既有 warning，需要在总结中明确区分

- [ ] **Step 4: 检查工作树状态**

Run:

```bash
git status --short
```

Expected:

- 无未提交改动

- [ ] **Step 5: 人工观感检查**

确认：

- 中间 `agent` tab 按钮显著强于普通 tab
- `agent` 底栏按钮的点击感比当前明显更强
- AI 气泡先浮现，再逐字输出
- 等待态不会让同一条回复反复重播
- 社区页三段内容都能点进去且有东西
- 发动态至少能走完一条完整发布路径
