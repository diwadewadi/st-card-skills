---
name: st:conventions
description: SillyTavern 角色卡前端界面/脚本通用编码规范和最佳实践参考
---

<objective>
提供 SillyTavern 角色卡开发（前端界面和脚本）的通用编码规范参考。适用于所有 st: 系列 skill 的开发工作。
</objective>

## 项目基本概念

本项目用于编写酒馆助手 (TavernHelper) 支持的前端界面或脚本，它们在 SillyTavern 中以前台或后台 iframe 形式运行，可以：

- 为角色卡提供美化的 UI 显示（将代码块纯文本美化为动态交互的 HTML 状态栏）
- 实现非纯文本的游玩体验（监听事件实现 meta 游戏、播放多媒体、自制界面）
- 优化酒馆使用体验（用 jQuery 操纵酒馆网页）
- 连接外部应用程序（通过 socket.io-client 等）
- 新增额外功能（后台调用 LLM 生成剧情总结等）

## 核心判定规则

每个前端界面或脚本以 `src/` 文件夹中的一个独立文件夹形式存在：

- **前端界面**: 文件夹中同时有 `index.ts` 和 `index.html` 两个文件
- **脚本**: 文件夹中仅有 `index.ts` 文件
- **流式楼层界面**: 本质是调用了 `mountStreamingMessage` 的脚本，所有脚本编写规则适用

## 可用第三方库

项目使用 pnpm 管理依赖，`package.json` 的 `dependencies` 中已包含以下库（可直接使用）：

| 库 | 用途 |
|---|---|
| **vue** + **pinia** + **vue-router** | UI 框架、状态管理、路由 |
| **@vueuse/core** | Vue composables 工具集 |
| **jquery** + **jquery-ui** | DOM 操作、拖拽效果 |
| **gsap** | 动画效果（打字机等所有动画） |
| **pixi.js** + **@pixi/react** | 2D 游戏渲染引擎 |
| **zod** | 数据校验和纠错（配合 `z.prettifyError()` 格式化错误） |
| **lodash** | 通用工具函数 |
| **dedent** | 模板字符串去缩进 |
| **toastr** | Toast 通知 |
| **yaml** | YAML 解析 |
| **react** | React 框架（配合 @pixi/react） |
| **async-wait-until** | 异步等待工具 |

可通过 `pnpm add` 添加更多库（如 `@vueuse/integrations` 等）。

**重要**: 前端界面和脚本在浏览器中运行，**不能使用 Node.js 库**。

## 与酒馆交互的方式

### 酒馆助手接口（优先使用）

接口定义在 `@types` 文件夹中，**抽象层次更高，应优先使用**：

| 文件 | 功能 |
|---|---|
| `@types/function/chat_message.d.ts` | 获取/修改消息楼层 (`getChatMessages()`, `setChatMessages()`) |
| `@types/function/worldbook.d.ts` | 操控世界书 (`getWorldbook()`, `replaceWorldbook()`) |
| `@types/function/variables.d.ts` | 操控酒馆变量 (`getVariables()`, `replaceVariables()`) |
| `@types/function/slash.d.ts` | 调用 STScript 命令 (`triggerSlash()`) |
| `@types/function/generate.d.ts` | AI 生成 |
| `@types/function/inject.d.ts` | 注入提示词 |
| `@types/iframe/event.d.ts` | 事件系统 |
| `@types/iframe/exported.sillytavern.d.ts` | SillyTavern 上下文 |
| `@types/iframe/exported.mvu.d.ts` | MVU 变量框架接口 |

以上接口在代码中均可**直接使用**，不需要导入或新定义，也不需要检查是否可用。

**不要** 优先使用 `@types/iframe/exported.sillytavern.d.ts` 中的酒馆内置接口或 STScript 命令，应使用对应的酒馆助手高层接口。

### STScript 命令

具体命令列表见 `slash_command.txt` 文件，使用 `triggerSlash()` 在 TypeScript 中调用。

## 工具函数

`util/` 目录提供了常用工具函数：

| 文件 | 用途 |
|---|---|
| `@util/mvu-store` | MVU Pinia Store 工具（`defineMvuDataStore()` 等） |
| `@util/streaming` | 流式楼层界面工具（`mountStreamingMessage()` 等） |
| `@util/helpers` | 通用工具函数（`parseFlexible()`、`clamp()` 等） |

> **导入路径**: 必须使用 `@util/` 前缀（如 `import { defineMvuDataStore } from '@util/mvu-store'`），对应 tsconfig paths 映射 `@util/*` → `./util/*`。**禁止**使用 `st-card-skills/devkit/util/...` 绝对路径。

## 特殊导入方式

```typescript
// 导入文件内容为字符串
import html_content from './file.html?raw';
import json_content from './data.json?raw';

// 经过 webpack 编译后导入（ts→js, scss→css）
import js_content from './script.ts?raw';
import css_content from './style.scss?raw';

// html-loader 最小化导入
import html from './file.html';

// markdown → html（通过 remark-loader）
import markdown from './file.md';

// Vue 组件（直接支持）
import Component from './Component.vue';

// 全局 SCSS（自动注入到 <head>）
import './index.scss';
```

## 通用最佳实践

### 1. 使用 TypeScript 而非 JavaScript

TypeScript 更容易写对，始终使用 TypeScript。

### 2. 尽量使用第三方库

- 使用 **jQuery** 而不是原生 DOM 操作
- 使用 **jQuery UI** 实现拖动效果（Vue 中则使用 VueUse）
- 使用 **Zod** 处理数据校验（配合 `z.prettifyError()`），不要用 if-else
- 使用 **GSAP** 制作所有动画效果
- 使用 **lodash** 处理数据操作

### 3. 优先使用酒馆助手高层接口

使用 `getIframeName()` 而不是 `(this.frameElement as Element).id`，以此类推。

### 4. 优先使用 Vue 编写界面

Vue 比 jQuery/DOM 操作更简单，应优先使用 Vue + Pinia + Vue Router。

### 5. Pinia + Zod 管理数据状态

从酒馆读取配置/数据时，用 Pinia store + Zod schema 实现响应式读写：

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

### 6. 优先使用 Tailwind CSS + `<style scoped>`

- 直接在 Vue 组件的 `<template>` 内使用 Tailwind CSS
- 无法用 Tailwind 时使用 `<style scoped>`
- 项目原生支持 Tailwind，无需额外导入

### 7. 多媒体项目使用 @pixi/react

当有大量多媒体资源时，前端界面更像游戏，使用 `@pixi/react` 在 `.tsx` 中编写，用 pixi.js 实现资源预加载。

### 8. 生命周期规范

```typescript
// ✅ 正确的加载方式
$(() => {
  toastr.success('加载成功');
});

// ✅ 正确的卸载方式
$(window).on('pagehide', () => {
  toastr.success('卸载成功');
});

// ❌ 禁止使用 DOMContentLoaded（iframe load 方式不触发）
// ❌ 禁止使用 unload 事件
// ❌ 禁止在全局作用域直接执行代码
```

### 9. 日志与错误处理

- 关键节点用 `console.info` 简洁记录日志
- 可恢复错误用 `console.warn` / `console.error`
- 致命错误用 `throw Error`，并用 `errorCatched` 包裹顶部函数：

```typescript
function init() { /* ... */ }
$(() => { errorCatched(init)(); });
```

### 10. Vue Router 使用 Memory History

iframe 环境下必须使用 `createMemoryHistory()`：

```typescript
const router = createRouter({ history: createMemoryHistory(), routes });
```

注意：`createRouter()` 不能写在 `$(() => {})` 中，必须在全局执行。

### 11. 响应式数据去 Proxy

监听 Vue 响应式数据变化并存入酒馆数据时，先用 `klona()` 去除 proxy 层：

```typescript
watchEffect(() => replaceVariables(klona(settings.value), { type: 'script', script_id: getScriptId() }));
```

### 12. 重载前端界面或脚本

使用 `window.location.reload()` 完全重载。
