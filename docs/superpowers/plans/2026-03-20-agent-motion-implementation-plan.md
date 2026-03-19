# Agent 页面动效 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `agent` 页面补齐按钮点击反馈、聊天气泡入场动画和轻量阶段过渡，让整条引导与对话链路不再生硬，同时保持现有业务逻辑完全不变。

**Architecture:** 保留开始页里现有的 React Native `Animated` 吉祥物漂浮效果；新增动效统一交给 `react-native-reanimated`。把“可测试的纯动效配置”抽到一个小型 helper 模块，实际 UI 包装组件仍然尽量留在 [`frontend/app/(tabs)/agent.tsx`](/home/yuuray/桌面/Pawzzle/frontend/app/(tabs)/agent.tsx) 内，避免无谓拆文件。

**Tech Stack:** Expo Router, React Native, TypeScript, `react-native-reanimated`, Node `--test --experimental-strip-types`, ESLint

---

## 预备信息

### 文件边界

- Create: `frontend/components/agent/motion.ts`
  责任：导出纯动效配置与小型判定 helper，例如按钮压缩比例、消息气泡入场位移、阶段淡入参数。
- Create: `frontend/components/agent/motion.test.ts`
  责任：为 `motion.ts` 中的纯配置与角色差异提供最小 Node 测试，给这次 UI 动效工作一个可重复运行的 TDD 支点。
- Modify: `frontend/app/(tabs)/agent.tsx`
  责任：引入 `reanimated`、添加 `AnimatedPressable` / `AnimatedChatBubble` / `AnimatedPhaseView`，并把开始页、问卷、聊天区、survey、结果页接到同一套动效语言上。
- Reference only: `frontend/app/_layout.tsx`
  说明：该文件已经引入 `react-native-reanimated`，本任务通常不需要改动。
- Reference only: `frontend/components/parallax-scroll-view.tsx`
  说明：可参考项目内现有 `reanimated` 用法，但不需要修改。

### 当前验证基线

- `cd frontend && npx eslint 'app/(tabs)/agent.tsx'`
  当前结果：1 条现有 warning，来自未使用的 `handleTestAudioClick`
- `cd frontend && npm run lint`
  当前结果：仓库里有多处历史 warning，不是这次任务新增
- `cd frontend && npx tsc --noEmit`
  当前结果：仓库当前已存在大量与本任务无关的类型错误，不能作为本任务唯一 gate

### 实施约束

- 不修改接口调用时机、状态流与推荐逻辑
- 不扩展到 `agent` 页之外
- 不新增依赖
- 如果 `handleTestAudioClick` 和 `TEST_TRANSCRIBE_URL` 仍然未接入界面，顺手删除它们，让目标文件 lint 可清零

## Task 1: 建立可测试的动效 preset 模块

**Files:**
- Create: `frontend/components/agent/motion.ts`
- Create: `frontend/components/agent/motion.test.ts`
- Reference: `frontend/app/(tabs)/agent.tsx`

- [ ] **Step 1: 先写失败测试，定义按钮 / 气泡 / 阶段三类基础 preset**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getBubbleMotionPreset,
  getPhaseMotionPreset,
  getPressMotionPreset,
} from './motion';

test('icon button presses more tightly than text actions', () => {
  const icon = getPressMotionPreset('icon');
  const text = getPressMotionPreset('text');

  assert.equal(icon.pressedScale < text.pressedScale, true);
  assert.equal(icon.releaseSpring.damping > 0, true);
});

test('user and ai bubbles use distinct entrance presets', () => {
  const user = getBubbleMotionPreset('user');
  const ai = getBubbleMotionPreset('ai');

  assert.notDeepEqual(user, ai);
  assert.equal(user.fromX > 0, true);
  assert.equal(ai.fromY > user.fromY, true);
});

test('phase preset stays lightweight and upward', () => {
  const phase = getPhaseMotionPreset();

  assert.equal(phase.fromY > 0, true);
  assert.equal(phase.duration <= 260, true);
});
```

- [ ] **Step 2: 跑测试，确认它因为模块缺失而失败**

Run:

```bash
cd frontend && node --test --experimental-strip-types components/agent/motion.test.ts
```

Expected:

- FAIL
- 报错指向 `Cannot find module './motion'` 或等价的模块不存在错误

- [ ] **Step 3: 写最小实现，让 preset 有明确、稳定的返回结构**

```ts
export type PressMotionKind = 'cta' | 'card' | 'icon' | 'text';
export type BubbleMotionKind = 'user' | 'ai' | 'debug';

export function getPressMotionPreset(kind: PressMotionKind) {
  if (kind === 'icon') {
    return {
      pressedScale: 0.92,
      releaseSpring: { damping: 14, stiffness: 220 },
    };
  }

  if (kind === 'cta') {
    return {
      pressedScale: 0.96,
      releaseSpring: { damping: 16, stiffness: 210 },
    };
  }

  return {
    pressedScale: 0.97,
    releaseSpring: { damping: 18, stiffness: 200 },
  };
}

export function getBubbleMotionPreset(kind: BubbleMotionKind) {
  if (kind === 'user') {
    return { fromX: 14, fromY: 8, duration: 220 };
  }

  if (kind === 'debug') {
    return { fromX: 0, fromY: 8, duration: 180 };
  }

  return { fromX: 0, fromY: 14, duration: 260 };
}

export function getPhaseMotionPreset() {
  return { fromY: 14, duration: 220 };
}
```

- [ ] **Step 4: 再跑测试，确认 preset 合约通过**

Run:

```bash
cd frontend && node --test --experimental-strip-types components/agent/motion.test.ts
```

Expected:

- PASS
- 3 个测试通过

- [ ] **Step 5: 提交这一小步**

```bash
git add frontend/components/agent/motion.ts frontend/components/agent/motion.test.ts
git commit -m "test: add agent motion presets"
```

## Task 2: 为按钮反馈补齐统一的 AnimatedPressable

**Files:**
- Modify: `frontend/components/agent/motion.ts`
- Modify: `frontend/components/agent/motion.test.ts`
- Modify: `frontend/app/(tabs)/agent.tsx` around imports, `AgentStartScreen`, `QuizScreen`, `SurveyScreen`, chat input row, and result button sections

- [ ] **Step 1: 扩充失败测试，先把禁用态和按钮类型差异固定下来**

```ts
test('disabled buttons do not advertise active press feedback', () => {
  const icon = getPressMotionPreset('icon');
  const text = getPressMotionPreset('text');

  assert.equal(icon.disabledOpacity < 1, true);
  assert.equal(text.disabledOpacity < 1, true);
  assert.equal(icon.translateY <= 0, true);
});

test('cta buttons rebound more gently than icon buttons', () => {
  const cta = getPressMotionPreset('cta');
  const icon = getPressMotionPreset('icon');

  assert.equal(cta.releaseSpring.damping >= icon.releaseSpring.damping, true);
});
```

- [ ] **Step 2: 跑测试，确认新增断言先失败**

Run:

```bash
cd frontend && node --test --experimental-strip-types components/agent/motion.test.ts
```

Expected:

- FAIL
- 失败原因是 `disabledOpacity` / `translateY` 尚未实现，或返回值不满足新断言

- [ ] **Step 3: 只改 `motion.ts`，补足按钮 preset 的最小字段**

```ts
return {
  pressedScale: 0.96,
  translateY: kind === 'cta' ? -1 : 0,
  disabledOpacity: kind === 'text' ? 0.45 : 0.4,
  releaseSpring: { damping: 16, stiffness: 210 },
};
```

- [ ] **Step 4: 再跑测试，确认按钮 preset contract 恢复为绿色**

Run:

```bash
cd frontend && node --test --experimental-strip-types components/agent/motion.test.ts
```

Expected:

- PASS

- [ ] **Step 5: 在 `agent.tsx` 里引入 `react-native-reanimated` 并添加 `AnimatedPressable`**

实现要点：

- 引入 `Animated` 以外的 `Reanimated` 能力，例如 `useSharedValue`、`useAnimatedStyle`、`withSpring`
- `AnimatedPressable` 接收 `kind`, `disabled`, `style`, `pressedStyle`, `children`
- 统一处理 `onPressIn` / `onPressOut`
- 让开始页 CTA、问卷选项卡、survey 提交、survey 跳过、聊天发送、聊天语音、结果页重启按钮都改用该包装
- 删除未使用的 `handleTestAudioClick` 与 `TEST_TRANSCRIBE_URL`，确保目标文件 lint 可清零

建议骨架：

```tsx
function AnimatedPressable({
  kind,
  disabled,
  children,
  style,
  ...props
}: AnimatedPressableProps) {
  const preset = getPressMotionPreset(kind);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: disabled ? preset.disabledOpacity : 1,
    transform: [
      { translateY: scale.value < 1 ? preset.translateY : 0 },
      { scale: scale.value },
    ],
  }));

  return (
    <Pressable
      {...props}
      disabled={disabled}
      onPressIn={() => { scale.value = withTiming(preset.pressedScale, { duration: 150 }); }}
      onPressOut={() => { scale.value = withSpring(1, preset.releaseSpring); }}>
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
```

- [ ] **Step 6: 跑目标文件 lint，确保 `agent.tsx` 本身无 warning**

Run:

```bash
cd frontend && npx eslint 'app/(tabs)/agent.tsx' --max-warnings 0
```

Expected:

- PASS
- 不再出现 `handleTestAudioClick` 未使用 warning

- [ ] **Step 7: 手动验证按钮反馈**

检查：

- 开始页 CTA 按下时有轻压与回弹
- 问卷选项卡按下时更柔和，不再是硬切缩放
- Survey 提交按钮、跳过动作、聊天发送与语音按钮手感统一
- 禁用状态下按钮不会表现出“还能正常点”的反馈

- [ ] **Step 8: 提交这一小步**

```bash
git add frontend/components/agent/motion.ts frontend/components/agent/motion.test.ts 'frontend/app/(tabs)/agent.tsx'
git commit -m "feat: add animated press feedback to agent flow"
```

## Task 3: 给阶段切换补上轻量 AnimatedPhaseView

**Files:**
- Modify: `frontend/components/agent/motion.ts`
- Modify: `frontend/components/agent/motion.test.ts`
- Modify: `frontend/app/(tabs)/agent.tsx` around the phase-return branches for `quiz`, `survey`, `result`, and `chat`

- [ ] **Step 1: 先写失败测试，明确阶段过渡必须是轻量上浮而不是重型切屏**

```ts
test('phase entrance stays subtle and never slides horizontally', () => {
  const phase = getPhaseMotionPreset();

  assert.equal(phase.fromY >= 8 && phase.fromY <= 16, true);
  assert.equal(phase.duration >= 180 && phase.duration <= 260, true);
  assert.equal('fromX' in phase, false);
});
```

- [ ] **Step 2: 跑测试，确认新增约束先失败**

Run:

```bash
cd frontend && node --test --experimental-strip-types components/agent/motion.test.ts
```

Expected:

- FAIL
- 失败原因是当前 `getPhaseMotionPreset()` 返回结构还不满足新的边界

- [ ] **Step 3: 调整 `motion.ts` 的阶段 preset 到 spec 要求**

```ts
export function getPhaseMotionPreset() {
  return {
    fromY: 12,
    duration: 220,
  };
}
```

- [ ] **Step 4: 再跑测试，确认阶段 preset 重新变绿**

Run:

```bash
cd frontend && node --test --experimental-strip-types components/agent/motion.test.ts
```

Expected:

- PASS

- [ ] **Step 5: 在 `agent.tsx` 中实现 `AnimatedPhaseView`，并包住四个阶段内容**

实现要点：

- 只在内容进入时做淡入和上浮
- 不做离场动画
- `quiz`、`survey`、`result`、`chat` 四个主阶段都用统一容器
- 开始页保持当前结构，不做整页切换动效

建议骨架：

```tsx
function AnimatedPhaseView({ phaseKey, children, style }: AnimatedPhaseViewProps) {
  const preset = getPhaseMotionPreset();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(preset.fromY);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: preset.duration });
    translateY.value = withTiming(0, { duration: preset.duration });
  }, [opacity, phaseKey, preset.duration, preset.fromY, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
```

- [ ] **Step 6: 跑目标文件 lint**

Run:

```bash
cd frontend && npx eslint 'app/(tabs)/agent.tsx' --max-warnings 0
```

Expected:

- PASS

- [ ] **Step 7: 手动验证阶段切换**

检查：

- `quiz -> chat` 不再是硬切
- `chat -> survey` 与 `survey -> result` 有轻微衔接，但不拖慢交互
- 快速返回时没有残影、白屏或闪烁

- [ ] **Step 8: 提交这一小步**

```bash
git add frontend/components/agent/motion.ts frontend/components/agent/motion.test.ts 'frontend/app/(tabs)/agent.tsx'
git commit -m "feat: add phase transitions to agent screen"
```

## Task 4: 给聊天消息补上 AnimatedChatBubble

**Files:**
- Modify: `frontend/components/agent/motion.ts`
- Modify: `frontend/components/agent/motion.test.ts`
- Modify: `frontend/app/(tabs)/agent.tsx` around `ChatBubble`, `messages.map(...)`, and waiting bubble rendering

- [ ] **Step 1: 先写失败测试，固定 user / ai / debug 三类消息的入场差异**

```ts
test('debug bubbles stay calmer than user and ai bubbles', () => {
  const debugPreset = getBubbleMotionPreset('debug');
  const userPreset = getBubbleMotionPreset('user');
  const aiPreset = getBubbleMotionPreset('ai');

  assert.equal(debugPreset.duration < aiPreset.duration, true);
  assert.equal(userPreset.fromX > 0, true);
  assert.equal(aiPreset.fromY > debugPreset.fromY, true);
});
```

- [ ] **Step 2: 跑测试，确认新断言先失败**

Run:

```bash
cd frontend && node --test --experimental-strip-types components/agent/motion.test.ts
```

Expected:

- FAIL

- [ ] **Step 3: 只改 preset，补齐 debug / user / ai 的最终差异**

```ts
export function getBubbleMotionPreset(kind: BubbleMotionKind) {
  if (kind === 'user') {
    return { fromX: 12, fromY: 6, duration: 220 };
  }

  if (kind === 'debug') {
    return { fromX: 0, fromY: 6, duration: 180 };
  }

  return { fromX: 0, fromY: 14, duration: 260 };
}
```

- [ ] **Step 4: 再跑测试，确认 bubble preset 通过**

Run:

```bash
cd frontend && node --test --experimental-strip-types components/agent/motion.test.ts
```

Expected:

- PASS

- [ ] **Step 5: 在 `agent.tsx` 中实现 `AnimatedChatBubble` 并替换现有 `ChatBubble` 渲染**

实现要点：

- 气泡挂载时才播放入场
- 基于消息 `id` 保持稳定，不因普通 rerender 重放
- 等待气泡使用稳定 key，例如 `waiting-${status}`，而不是跟着轮换文本变化 remount
- 用户消息从右下轻滑入，agent 消息从下方向上淡入

建议骨架：

```tsx
function AnimatedChatBubble({ messageKey, role, text }: AnimatedChatBubbleProps) {
  const preset = getBubbleMotionPreset(role);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(preset.fromX);
  const translateY = useSharedValue(preset.fromY);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: preset.duration });
    translateX.value = withTiming(0, { duration: preset.duration });
    translateY.value = withTiming(0, { duration: preset.duration });
  }, [messageKey, opacity, preset.duration, preset.fromX, preset.fromY, translateX, translateY]);

  return (
    <Animated.View style={animatedStyle}>
      <ChatBubble role={role} text={text} />
    </Animated.View>
  );
}
```

- [ ] **Step 6: 跑目标文件 lint**

Run:

```bash
cd frontend && npx eslint 'app/(tabs)/agent.tsx' --max-warnings 0
```

Expected:

- PASS

- [ ] **Step 7: 手动验证聊天区**

检查：

- 用户消息比 agent 回复更利落
- agent 回复更柔和，不会突然蹦出来
- 等待气泡文案轮换时不重复重放整段入场
- 输入框编辑不会让旧消息重新入场

- [ ] **Step 8: 提交这一小步**

```bash
git add frontend/components/agent/motion.ts frontend/components/agent/motion.test.ts 'frontend/app/(tabs)/agent.tsx'
git commit -m "feat: animate agent chat bubbles"
```

## Task 5: 最终回归验证与收口

**Files:**
- Modify if needed: `frontend/app/(tabs)/agent.tsx`
- Verify: `frontend/components/agent/motion.ts`
- Verify: `frontend/components/agent/motion.test.ts`

- [ ] **Step 1: 跑纯 helper 测试，确认最后仍是绿色**

Run:

```bash
cd frontend && node --test --experimental-strip-types components/agent/motion.test.ts
```

Expected:

- PASS

- [ ] **Step 2: 跑目标文件 lint，要求零 warning**

Run:

```bash
cd frontend && npx eslint 'app/(tabs)/agent.tsx' --max-warnings 0
```

Expected:

- PASS

- [ ] **Step 3: 跑全局 lint，确认没有新增超出仓库基线的问题**

Run:

```bash
cd frontend && npm run lint
```

Expected:

- 仍可能存在仓库其他文件的历史 warning
- `agent.tsx` 不应再出现新的 warning 或 error

- [ ] **Step 4: 逐项执行手动验收清单**

验收顺序：

1. 开始页：CTA 点击反馈自然，吉祥物漂浮不受影响
2. 问卷页：选项卡点击、切题推进自然
3. 聊天页：发送按钮、语音按钮、输入区整体手感统一
4. 聊天页：用户气泡、agent 气泡、等待气泡表现符合 spec
5. Survey 页：提交与跳过手感一致
6. 结果页：进入时不生硬，“重新测试”点击反馈与其余按钮统一

- [ ] **Step 5: 如手动回归发现细节问题，只做小修正并重复步骤 1-4**

修正原则：

- 只调参数与局部实现，不改流程
- 不引入额外视觉元素
- 不把轻动效升级成重过渡

- [ ] **Step 6: 提交最终特性收口 commit**

```bash
git add frontend/components/agent/motion.ts frontend/components/agent/motion.test.ts 'frontend/app/(tabs)/agent.tsx'
git commit -m "feat: polish agent page motion"
```

## 执行备注

- 如果 `node --test --experimental-strip-types` 对 `.ts` 文件加载方式有本地差异，优先把测试文件调整为 Node 原生最稳定的扩展名与导入方式，但不要引入新测试依赖。
- 如果 `agent.tsx` 在实现中显著继续膨胀，可以把 `AnimatedPressable` / `AnimatedChatBubble` / `AnimatedPhaseView` 抽到 `frontend/components/agent/` 下，但只有在当前文件明显失控时才这样做。
- 全局 `tsc --noEmit` 当前已被仓库历史问题污染，不作为本次任务的完成 gate；若顺手发现与 `agent` 改动直接相关的新增类型问题，需要当场解决。
