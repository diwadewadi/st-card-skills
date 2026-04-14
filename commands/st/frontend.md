---
name: st:frontend
description: Create complex Vue 3 interactive frontend for a character card (status panels, inventory, battle UI, etc.)
---

<objective>
为 SillyTavern 角色卡创建基于 Vue 3 的复杂交互式前端界面。支持三种界面模式：
- **面板 (panel)**: 全局 UI 面板（设置、日记、仪表盘等），独立于消息楼层
- **流式楼层界面 (streaming)**: 替换酒馆原生消息显示，每条 AI 消息都渲染为自定义组件，支持实时流式更新
- **状态栏 (statusbar)**: 嵌入每条 AI 消息末尾的状态展示界面（通过 StatusPlaceHolderImpl 占位符 + 正则注入）

本 skill 使用 `st-card-skills/devkit/` 提供的开发环境，基于 Vue 3 + Pinia + Tailwind CSS + TypeScript 技术栈。
</objective>

<process>

## Phase 0: 环境准备

0. **定位 devkit 目录**: 运行 `node -e "console.log(require.resolve('st-card-skills/package.json').replace(/package\.json$/, 'devkit'))"` 获取 devkit 的绝对路径。如果失败，尝试 `npm root -g` 拼接 `/st-card-skills/devkit`。

1. **阅读 API 索引**: 读取 `devkit/API_INDEX.md`，快速了解所有可用模块及其对应的类型定义文件路径。**不要**一次性读取所有类型文件，而是根据具体需求按需读取。

   **按需读取类型定义的策略**：
   - **所有界面类型都需要**：读取 `types/iframe/event.d.ts`（事件系统）+ `types/iframe/exported.sillytavern.d.ts`（SillyTavern 上下文，可只读前 100 行了解常用属性）
   - **需要变量操作时**：读取 `types/function/variables.d.ts`
   - **需要消息操作时**：读取 `types/function/chat_message.d.ts`
   - **需要 AI 生成时**：读取 `types/function/generate.d.ts`
   - **需要注入提示词时**：读取 `types/function/inject.d.ts`
   - 其他模块（角色卡、世界书、预设、音频等）在确认需要时再读取对应 `.d.ts` 文件

   根据界面类型，在 Phase 2 确定后按需读取对应的工具文件：
   - **状态栏**: 读取 `devkit/util/mvu-store.ts`（defineMvuDataStore）+ `devkit/templates/card/statusbar/` 模板 + `types/iframe/exported.mvu.d.ts`（MVU 框架）
   - **流式楼层**: 读取 `devkit/util/streaming.ts`（mountStreamingMessages）+ `devkit/templates/streaming/` 模板
   - **面板**: 读取 `devkit/templates/panel/` 模板
   - **如需 MVU**: 读取 `devkit/templates/card/schema.ts` + `types/iframe/exported.mvu.d.ts`

2. **确认 st-card-tools 可用**: 运行 `st-card-tools list-cards` 确认已配置。如果报错，提示用户先运行 `/st:setup`。

3. **检查 devkit 依赖**: 检查用户是否已在 devkit 目录安装过依赖。如果 `devkit/node_modules` 不存在，提示用户先执行 `cd <devkit路径> && pnpm install`（或 npm install）。

## Phase 1: 需求分析

4. **选择目标角色卡**: 运行 `st-card-tools list-cards`，展示列表让用户选择。

5. **提取并分析角色卡**: 运行 `st-card-tools extract-card <name>` 提取角色卡，然后读取工作区中所有文件了解角色卡设定。

6. **确定界面类型**: 与用户讨论需要什么样的前端界面：

   **面板 (panel)** — 适合：
   - 设置界面、日记、笔记
   - 独立的角色档案/图鉴
   - 不随消息刷新的全局 UI

   **流式楼层界面 (streaming)** — 适合：
   - 完全自定义的消息渲染（如论坛、聊天室、社交媒体风格）
   - 需要实时流式显示效果的界面
   - 每条消息有不同的展示逻辑

   **状态栏 (statusbar)** — 适合：
   - 变量状态展示（好感度、心情、物品栏等）
   - 固定在每条消息下方的紧凑界面
   - 需要实时响应 MVU 变量更新的 UI

7. **确认是否需要 MVU 数据绑定**: 如果界面需要显示/操作变量数据，将使用 `defineMvuDataStore`。

8. **讨论界面布局和交互**: 与用户确认具体的 UI 元素、布局、颜色方案、交互行为。

## Phase 2: 方案规划（强制）

> **⚠️ 强制要求**: 在编写或修改任何代码之前，必须先进入 Plan 模式，设计完整的实现方案并获得用户批准。禁止跳过此步骤直接动手写代码。
>
> **⚠️ 详尽原则**: 方案必须足够详尽，使得在一个全新的上下文窗口中仅凭此方案即可完整执行实现，无需额外询问或猜测。所有决策、路径、代码结构、关键实现细节都必须在方案中明确写出。

9. **进入 Plan 模式**: 调用 `EnterPlanMode` 工具，基于 Phase 1 收集到的需求，制定详尽的实现计划。计划应包含：

    **项目结构**:
    - 需要创建/修改的完整文件列表，标注每个文件的绝对路径和职责
    - 组件结构与层级关系（父子组件树、slot 设计）
    - 目录结构示意图

    **数据架构**:
    - 数据流设计（Props / Pinia Store / MVU 变量绑定方式）
    - Zod Schema 定义（如需 MVU，写出完整的字段名、类型、默认值）
    - 变量存储方式（script 变量 / message 变量 / extension settings）

    **实现细节**:
    - 每个组件/文件的核心逻辑伪代码或关键代码片段
    - 需要使用的 API 列表及具体调用方式（含参数）
    - 事件监听列表（事件名 → 处理逻辑）
    - 生命周期管理（初始化顺序、清理逻辑、重载策略）

    **样式与布局**:
    - 样式方案（布局策略、响应式适配、颜色方案）
    - 关键 UI 元素的 Tailwind class 或 CSS 描述
    - iframe 适配注意事项

    **集成与构建**:
    - 集成方式（状态栏正则注入 / 面板脚本加载 / 流式挂载）
    - 构建命令与输出路径
    - 写回角色卡的具体步骤

10. **等待用户批准**: 通过 `ExitPlanMode` 提交方案，等待用户审阅和批准后，方可进入下一阶段。如用户提出修改意见，需更新方案并重新提交。

## Phase 3: 项目脚手架

11. **创建项目目录**: 在角色卡工作区下创建 `src/` 子目录。提取角色卡后工作区路径为 `workspace/cards/<cardname>/`，在其下创建 `src/<模块名>/` 目录（如 `src/statusbar/`、`src/panel/` 等）。

    最终目录结构：
    ```
    workspace/cards/<cardname>/
      card.json              ← st-card-tools 提取的角色卡数据
      greetings/
      regex/
      world/
      src/                   ← 前端源码目录（新建）
        statusbar/           ← 示例：状态栏模块
          App.vue
          index.ts
          index.html
        schema.ts            ← 共享的 Zod 变量结构（如需 MVU）
      dist/                  ← 编译输出（自动生成）
        statusbar/
          index.html
    ```

12. **复制对应模板**: 根据界面类型，从 `devkit/templates/` 复制文件到 `workspace/cards/<cardname>/src/<模块名>/`：
    - 面板 → 复制 `templates/panel/` 的 App.vue + index.ts + index.html
    - 流式 → 复制 `templates/streaming/` 的 App.vue + index.ts
    - 状态栏 → 复制 `templates/card/statusbar/` 的 App.vue + index.ts + index.html

13. **如需 MVU**: 在 `workspace/cards/<cardname>/src/` 下创建 `schema.ts`，参考 `templates/card/schema.ts` 定义 Zod 变量结构。

## Phase 4: 组件开发

14. **编写 Vue 组件**: 在项目目录中编写 `.vue` 文件。技术要求：
    - 使用 `<script setup lang="ts">` 语法
    - 使用 Tailwind CSS 做样式（iframe 模式下隔离，不影响酒馆）
    - 可使用 Pinia 做状态管理
    - 可使用 VueUse composables（useIntervalFn、watchIgnorable 等已自动导入）

15. **数据绑定**（如需要）:
    - **MVU 变量** → 使用 `defineMvuDataStore(Schema, { type: 'message', message_id: -1 })`
    - **MVU 事件** → 使用 `eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, callback)`
    - **直接变量** → 使用 `getAllVariables().stat_data`

16. **调用 SillyTavern API**（按需）:
    - `SillyTavern.chat` — 读取聊天记录
    - `SillyTavern.registerMacro(key, fn)` — 注册自定义宏
    - `SillyTavern.registerFunctionTool(tool)` — 注册 AI 可调用的工具
    - `SillyTavern.callGenericPopup(content, type)` — 弹窗
    - `eventOn(event, handler)` — 监听事件

## 编码规范（所有前端界面必须遵守）

### index.html 约束

前端界面的 `index.html` 仅可填写静态 `<body>` 内容，所有样式、代码、外部依赖都通过 TypeScript 导入：

```html
<head>
  <!-- 保留空 <head>，webpack 打包时自动注入样式和脚本 -->
</head>
<body>
  <!-- 写 <div id="app"></div> 交给 vue 渲染，或写静态 HTML 元素 -->
</body>
```

- **禁止** `<link rel="stylesheet" href="./index.css">` — 应在 TS 中 `import './index.scss'` 或在 Vue 组件 `<style lang="scss">` 中书写
- **禁止** `<script src="./index.ts">` — `index.ts` 由 webpack 自动打包注入
- **禁止** `<img src="">` 空 src 占位 — 要么引用实际图片，要么不写 src 属性，否则 webpack 打包报错

### iframe 适配规则

前端界面以无沙盒 iframe 形式嵌入酒馆消息楼层，必须遵守以下 CSS 约束：

- **禁止使用 `vh` 单位** — 会受宿主高度影响。使用 `width` + `aspect-ratio` 让高度根据宽度动态调整
- **避免** `min-height`、`overflow: auto` 等会强制撑高父容器的属性
- **禁止** 主体内容使用 `position: absolute` 等脱离文档流的样式
- 页面整体应适配容器宽度，**不产生横向滚动条**
- 如果样式更适合卡片形状，则不要有背景颜色（除非用户明确要求）

### 图标

可以任意使用 **FontAwesome 免费图标**，无需额外导入。

### 特殊导入方式

```typescript
// 导入文件内容为字符串
import html_content from './file.html?raw';
import json_content from './data.json?raw';

// 经过 webpack 编译后导入（ts→js, scss→css）
import js_content from './script.ts?raw';
import css_content from './style.scss?raw';

// html-loader 最小化导入
import html from './file.html';

// markdown → html
import markdown from './file.md';

// Vue 组件（直接支持）
import Component from './Component.vue';

// 全局 SCSS（自动注入到 <head>）
import './index.scss';
```

### 样式最佳实践

- **优先使用 Tailwind CSS** 在 Vue 组件 `<template>` 内直接书写
- 无法用 Tailwind 实现时，使用 `<style scoped>` 标签
- 项目原生支持 Tailwind CSS，无需导入任何 CSS 文件

### Vue 最佳实践

- **路由**: iframe 环境下必须使用 `createMemoryHistory()`，不能使用 `createWebHistory()`
  ```typescript
  import { createRouter, createMemoryHistory } from 'vue-router';
  const router = createRouter({ history: createMemoryHistory(), routes });
  ```
  注意：`createRouter()` 不能写在 `$(() => {})` 中，必须在全局执行

- **响应式数据持久化**: 使用 `klona()` 去除 Vue proxy 层后再存入酒馆变量
  ```typescript
  const Settings = z.object({ /* ... */ });
  const settings = ref(Settings.parse(getVariables({ type: 'script', script_id: getScriptId() })));
  watchEffect(() => replaceVariables(klona(settings.value), { type: 'script', script_id: getScriptId() }));
  ```

- **Pinia + Zod 管理数据**: 推荐用 Pinia store + Zod schema 实现类型安全的响应式数据读写
  ```typescript
  const Settings = z.object({ button_selected: z.boolean().default(false) }).prefault({});
  export const useSettingsStore = defineStore('settings', () => {
    const settings = ref(Settings.parse(getVariables({ type: 'script', script_id: getScriptId() })));
    watchEffect(() => {
      replaceVariables(klona(settings.value), { type: 'script', script_id: getScriptId() });
    });
    return { settings };
  });
  ```

### 生命周期

- **加载时执行**: 始终用 `$(() => { ... })`，**禁止** `DOMContentLoaded`（因为 iframe 通过 `$('body').load()` 加载时不触发）
- **卸载时执行**: 使用 `$(window).on('pagehide', ...)`,**禁止** `unload` 事件
- **重载**: 使用 `window.location.reload()`

### 日志与错误处理

- 关键节点使用 `console.info` 简洁记录日志
- 可恢复错误使用 `console.warn` / `console.error`
- 致命错误使用 `throw Error`，并用 `errorCatched` 包裹顶部函数：
  ```typescript
  function init() { /* ... */ }
  $(() => { errorCatched(init)(); });
  ```

## Phase 5: 构建与集成

17. **构建**: 在 devkit 目录运行 `pnpm build`（或 `pnpm dev` 进入 watch 模式）。
    - Webpack 会自动发现 `workspace/cards/*/src/` 下的所有入口
    - 编译输出到对应卡片目录的 `dist/`（如 `workspace/cards/<cardname>/dist/statusbar/index.html`）
    - 如果 workspace 路径非默认，使用 `pnpm dev --env workspace=<path>` 指定

18. **集成到角色卡**: 根据界面类型选择集成方式：

    **状态栏** → 添加一个正则脚本到角色卡：
    - 在工作区 `regex/` 目录添加一个正则，匹配 `<StatusPlaceHolderImpl/>`，替换为加载编译后 HTML 的代码
    - 确保开场白末尾包含 `<StatusPlaceHolderImpl/>` 占位符

    **面板/脚本** → 添加酒馆助手脚本到角色卡：
    - 在工作区 `scripts/` 目录添加脚本（extract-card 已自动提取酒馆助手脚本到此目录）
    - 每个脚本有一个 `.json`（元数据）和 `-content.js`（脚本内容）
    - 修改 `-content.js` 中的内容为 `import '<编译后的 JS 文件 URL>'`
    - 如果上传到 GitHub/CDN → 使用 jsDelivr URL
    - 也可以直接将编译后的 JS 代码粘贴到 `-content.js` 中

19. **写回**: 运行 `st-card-tools apply-card <name>` 将修改写回角色卡。

## Phase 6: 开发调试

20. **开发流程**:
    - `pnpm dev`（在 devkit 目录）启动 Webpack watch 模式，修改后自动重新编译
    - 编译完成后运行 `st-card-tools apply-card <name>` 写回角色卡
    - 在 SillyTavern 中重新加载角色卡查看效果

21. **验证清单**:
    - [ ] 界面正确渲染
    - [ ] 变量数据正确绑定（如使用 MVU）
    - [ ] 移动端适配
    - [ ] 事件监听器在页面卸载时正确清理

## Phase 6B: Live SillyTavern Debugging

23. **Preferred test loop for real frontend validation**:
    - Run `pnpm dev` in the devkit directory so frontend code rebuilds automatically.
    - After each successful rebuild, run `st-card-tools apply-card <name>` to write the updated assets back into the real character card.
    - Run `st-card-tools verify-live <name> --module <module-name>` to launch a real browser against your running SillyTavern and stream browser `console`, `pageerror`, and failed request logs back into the terminal.
    - In the opened SillyTavern window, switch to the target card and trigger the relevant UI (`panel`, `streaming`, or `statusbar`).
    - Use the streamed logs and the saved log file under `workspace/cards/<cardname>/logs/verify-live/` to diagnose and fix real integration issues.

24. **Logging requirement for live debugging**:
    - Use `console.info` on key lifecycle nodes such as mount, store hydration, event registration, and teardown.
    - Prefer a stable prefix such as `[STF][statusbar]`, `[STF][panel]`, or `[STF][streaming]` so live logs stay easy to filter.
    - Use `console.warn` / `console.error` for recoverable failures, and make the message include the failing state or payload shape whenever possible.

25. **Live verification checklist**:
    - [ ] The real SillyTavern page renders the module correctly after `apply-card`
    - [ ] Browser console has no unexpected errors during load, refresh, and teardown
    - [ ] Variable binding works with real card data (especially MVU updates if used)
    - [ ] Event listeners are cleaned up correctly when the page or iframe reloads
    - [ ] Mobile layout still works inside the actual SillyTavern container

</process>
