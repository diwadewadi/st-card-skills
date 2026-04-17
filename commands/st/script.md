---
name: st:script
description: Create TavernHelper scripts for a character card (events, slash commands, macros, function tools, etc.)
---

<objective>
为 SillyTavern 角色卡编写酒馆助手脚本。脚本是运行在酒馆环境中的 TypeScript/JavaScript 代码，可以：

- **事件监听**: 响应消息发送/接收/编辑/删除、聊天切换、流式 token 等事件
- **斜杠命令**: 注册自定义 `/命令`
- **自定义宏**: 注册 `{{自定义宏}}`，在提示词中动态展开
- **函数工具**: 注册 AI 可调用的工具函数（function calling / tool use）
- **消息处理**: 拦截和修改 AI 回复的渲染、自动后处理
- **MVU 变量交互**: 监听变量更新事件、强制修正变量值
- **定时任务**: 周期性执行逻辑

本 skill 使用 `st-card-skills/devkit/` 的 TypeScript + Webpack 编译环境。
</objective>

<process>

## Phase 0: 环境准备

0. **定位 devkit 目录**: 运行 `node -e "console.log(require.resolve('st-card-skills/package.json').replace(/package\.json$/, 'devkit'))"` 获取 devkit 的绝对路径。如果失败，尝试 `npm root -g` 拼接 `/st-card-skills/devkit`。

1. **阅读 API 索引**: 先读取 `devkit/API_INDEX.md` 了解模块索引，再根据具体需求按需读取 `devkit/types/` 下对应的 `.d.ts` 文件。常见优先级：
   - 事件系统与全局上下文：`types/iframe/event.d.ts`、`types/iframe/exported.sillytavern.d.ts`
   - 变量：`types/function/variables.d.ts`
   - 聊天消息：`types/function/chat_message.d.ts`
   - 生成：`types/function/generate.d.ts`
   - MVU：`types/iframe/exported.mvu.d.ts`

2. **阅读脚本模板**: 读取 `devkit/templates/script/index.ts` 了解基本脚本结构。

3. **确认 st-card-tools 可用**: 运行 `st-card-tools list-cards`。如果报错，提示用户先运行 `/st:setup`。

4. **检查 devkit 依赖**: 如果 `devkit/node_modules` 不存在，提示用户先安装依赖。

## Phase 1: 需求分析

5. **选择目标角色卡**: 展示角色卡列表，让用户选择。

6. **提取并分析角色卡**: 运行 `st-card-tools extract-card <name>`，先读取 `_memory.md` 和 `_index.md`：
   - `_index.md` — 自动生成的结构索引，包含字段摘要、文件清单、字符数统计
   - `_memory.md` — AI 工作笔记，记录之前对这张卡的理解和修改历史
   
   如果 `_memory.md` 中已有足够的上下文理解，可以跳过读取完整文件。否则，读取所有文件了解角色卡。

7. **确定脚本类型**: 与用户讨论需要什么功能（可多选）：

   | 类型 | 说明 | 关键 API |
   |------|------|----------|
   | 事件监听 | 响应酒馆各种事件 | `eventOn(tavern_events.XXX, handler)` |
   | 斜杠命令 | 注册 /自定义命令 | `SillyTavern.SlashCommandParser` |
   | 自定义宏 | 注册 {{宏}} | `SillyTavern.registerMacro(key, fn)` |
   | 函数工具 | AI 可调用的函数 | `SillyTavern.registerFunctionTool(tool)` |
   | 消息处理 | 修改消息渲染 | `eventOn('characterMessageRendered', ...)` |
   | MVU 交互 | 变量事件钩子 | `eventOn(Mvu.events.XXX, handler)` |

8. **讨论具体功能需求**: 确认脚本的详细行为、触发条件、输入输出。

## Phase 2: 方案规划（强制）

> **⚠️ 强制要求**: 在编写或修改任何代码之前，必须先明确列出实现方案并获得用户批准。禁止跳过此步骤直接动手写代码。
>
> **⚠️ 详尽原则**: 方案必须足够详尽，使得在一个全新的上下文窗口中仅凭此方案即可完整执行实现，无需额外询问或猜测。所有决策、路径、代码结构、关键实现细节都必须在方案中明确写出。

9. **提交实现计划**: 基于 Phase 1 收集到的需求，制定详尽的实现计划并展示给用户。计划应包含：

    **项目结构**:
    - 需要创建/修改的完整文件列表，标注每个文件的绝对路径和职责
    - 目录结构示意图
    - 脚本类型选择的理由（事件监听 / 斜杠命令 / 宏 / 函数工具等）

    **数据架构**:
    - 核心逻辑的实现思路与完整数据流
    - 变量结构定义（如涉及 MVU，写出完整的 Zod Schema 字段名、类型、默认值）
    - 变量存储方式（script 变量 / message 变量 / extension settings）

    **实现细节**:
    - 每个文件的核心逻辑伪代码或关键代码片段
    - 需要使用的 API 完整列表及具体调用方式（含参数和返回值处理）
    - 事件监听列表（事件名 → 触发条件 → 处理逻辑）
    - 生命周期管理方案（初始化顺序、清理逻辑、`reloadOnChatChange` 策略）
    - 与现有脚本/MVU 变量的交互方式（如适用）
    - 错误处理策略（哪些函数需要 `errorCatched` 包裹）

    **集成与构建**:
    - 集成方式（写入 scripts/ 目录 / 远程加载）
    - 脚本元数据 JSON 的完整内容（name, id, enabled, type 等）
    - 构建命令与输出路径
    - 写回角色卡的具体步骤

10. **等待用户批准**: 等待用户审阅和批准后，方可进入下一阶段。如用户提出修改意见，需更新方案并重新提交。

## Phase 3: 脚本创建

11. **创建项目目录**: 在角色卡工作区下创建 `src/` 子目录。提取角色卡后工作区路径为 `workspace/cards/<cardname>/`，在其下创建 `src/<脚本名>/` 目录。

    最终目录结构：
    ```
    workspace/cards/<cardname>/
      card.json              ← st-card-tools 提取的角色卡数据
      greetings/
      regex/
      world/
      src/                   ← 脚本源码目录（新建）
        my-script/           ← 你的脚本
          index.ts
        mvu-hooks/           ← 可以有多个脚本模块
          index.ts
      dist/                  ← 编译输出（自动生成）
        my-script/
          index.js
    ```

12. **复制脚本模板**: 从 `devkit/templates/script/` 复制 `index.ts` 到 `workspace/cards/<cardname>/src/<脚本名>/`。

13. **如需设置界面**: 额外创建 `settings.vue` 和 `settings.ts`。

## Phase 4: 脚本编写

14. **编写 TypeScript 脚本**: 根据需求实现功能。核心模式：

### 事件监听
```typescript
$(() => {
  // 监听 AI 消息渲染完成
  const { stop } = eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, (messageId) => {
    const msg = getChatMessages(messageId)[0];
    console.log('AI said:', msg.mes);
  });

  // 页面卸载时清理
  $(window).on('pagehide', () => stop());
});
```

### 自定义宏
```typescript
$(() => {
  // 注册 {{mood}} 宏 — 返回当前角色心情
  SillyTavern.registerMacro('mood', () => {
    const data = getAllVariables()?.stat_data ?? {};
    return _.get(data, 'character.mood', 'unknown');
  }, 'Returns the character mood from MVU variables');

  $(window).on('pagehide', () => SillyTavern.unregisterMacro('mood'));
});
```

### 函数工具（AI Tool Use）
```typescript
$(() => {
  SillyTavern.registerFunctionTool({
    name: 'check_inventory',
    displayName: 'Check Inventory',
    description: 'Check what items the player currently has',
    parameters: {
      type: 'object',
      properties: {
        item_name: { type: 'string', description: 'Optional: specific item to check' },
      },
    },
    action: async (args) => {
      const data = getAllVariables()?.stat_data ?? {};
      const inventory = _.get(data, 'player.inventory', {});
      if (args.item_name) {
        const item = inventory[args.item_name];
        return item ? JSON.stringify(item) : `Player does not have ${args.item_name}`;
      }
      return JSON.stringify(inventory);
    },
  });

  $(window).on('pagehide', () => SillyTavern.unregisterFunctionTool('check_inventory'));
});
```

### MVU 变量交互
```typescript
$(() => {
  await waitGlobalInitialized('Mvu');

  // 限制好感度变化幅度：每次更新不超过 ±5
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (variables, variables_before) => {
    const oldVal = _.get(variables_before, 'stat_data.character.affection', 0);
    const newVal = _.get(variables, 'stat_data.character.affection', 0);
    const clamped = _.clamp(newVal, oldVal - 5, oldVal + 5);
    if (clamped !== newVal) {
      _.set(variables, 'stat_data.character.affection', clamped);
    }
  });

  // 修复 AI 输出的路径错误（如繁体字）
  eventOn(Mvu.events.COMMAND_PARSED, (_vars, commands) => {
    commands.forEach(cmd => {
      cmd.args[0] = cmd.args[0].replace(/-/g, '');
    });
  });
});
```

### 持久化设置
```typescript
// settings.ts
const DEFAULTS = { enabled: true, maxMessages: 10 };

function loadSettings(): typeof DEFAULTS {
  const saved = SillyTavern.extensionSettings[getScriptId()];
  return { ...DEFAULTS, ...(saved ?? {}) };
}

function saveSettings(settings: typeof DEFAULTS) {
  SillyTavern.extensionSettings[getScriptId()] = { ...settings };
  SillyTavern.saveSettingsDebounced();
}

export const settings = loadSettings();
```

15. **生命周期管理要点**:
    - 始终在 `$(() => { ... })` 中初始化，**禁止** `DOMContentLoaded`（前端界面在 iframe 中通过 `$('body').load()` 加载时不触发，脚本统一使用 `$()` 初始化）
    - 始终在 `$(window).on('pagehide', ...)` 中清理，**禁止** `unload` 事件
    - 所有 `eventOn` 返回的 `{ stop }` 都要在卸载时调用
    - 如果使用 `await waitGlobalInitialized('Mvu')`，确保在 `$()` 回调中
    - 不要在全局作用域中直接执行代码，始终在加载回调中执行

16. **特殊导入方式**:
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
    ```

17. **日志与错误处理**:
    - 关键节点使用 `console.info` 简洁记录日志，保持日志与代码逻辑一致
    - 可恢复错误使用 `console.warn` / `console.error`
    - 致命错误使用 `throw Error`，并用 `errorCatched` 包裹顶部函数：
      ```typescript
      function init() { /* ... */ }
      $(() => { errorCatched(init)(); });
      ```

18. **聊天切换时重载**:
    使用 `util/script.ts` 中的 `reloadOnChatChange()` 工具函数在聊天文件变更时重新载入脚本：
    ```typescript
    import { reloadOnChatChange } from '../../util/script';

    $(() => {
      reloadOnChatChange();
      // 其他初始化逻辑...
    });
    ```

19. **在脚本中使用 Vue**:
    脚本也可以使用 Vue 来构建设置界面等。注意事项：
    - `createRouter()` 不能写在 `$(() => {})` 中，必须在全局执行
    - 使用 `createMemoryHistory()` 创建路由（脚本和面板在 popup 中不适合用 URL history，前端界面在 iframe 中也无 URL 路由）
    - 监听 Vue 响应式数据变化并存入酒馆变量时，先用 `klona()` 去除 proxy 层：
      ```typescript
      const Settings = z.object({ /* ... */ });
      const settings = ref(Settings.parse(getVariables({ type: 'script', script_id: getScriptId() })));
      watchEffect(() => replaceVariables(klona(settings.value), { type: 'script', script_id: getScriptId() }));
      ```

## Phase 5: 构建集成

20. **构建**: 在 devkit 目录运行 `pnpm build`。
    - Webpack 自动发现 `workspace/cards/*/src/` 下的所有入口
    - 编译输出到对应卡片目录的 `dist/`（如 `workspace/cards/<cardname>/dist/my-script/index.js`）
    - 如果 workspace 路径非默认，使用 `pnpm build --env workspace=<path>` 指定

21. **集成到角色卡**: 两种方式：

    **方式 A — 写入 scripts/ 目录**（推荐，extract-card 已提取酒馆助手脚本到此目录）：
    在工作区 `scripts/` 目录添加或修改脚本文件：
    - `<序号>_<名称>.json` — 脚本元数据（name, id, enabled, type, button 等）
    - `<序号>_<名称>-content.js` — 脚本代码内容

    可以直接将编译后的 JS 代码写入 `-content.js`，或用 import 引用远程 URL：
    ```javascript
    import 'https://testingcf.jsdelivr.net/gh/用户名/仓库/dist/脚本名/index.js'
    ```

    新增脚本时需要创建 `.json` 元数据文件：
    ```json
    {
      "name": "脚本名称",
      "id": "生成唯一UUID",
      "enabled": true,
      "type": "script",
      "data": {},
      "info": "",
      "button": { "buttons": [], "enabled": true }
    }
    ```

    **方式 B — 远程加载**（适合复杂脚本，支持自动更新）：
    将编译后的 JS 上传到 GitHub 等平台，然后在 `-content.js` 中 import URL。

22. **写回**: 运行 `st-card-tools apply-card <name>` 写回角色卡。

23. **更新工作笔记**: 在工作区的 `_memory.md` 的 `## Notes` 区域追加本次工作记录，包括：
    - 本次创建/修改了什么脚本（名称、功能概述）
    - 关键技术决策（事件监听策略、数据存储方式、与 MVU 的交互方式）
    - 脚本的核心逻辑摘要

## Phase 6: 测试与调试

23. **开发流程**:
    - `pnpm dev`（在 devkit 目录）启动 Webpack watch 模式，修改后自动重新编译
    - 编译完成后运行 `st-card-tools apply-card <name>` 写回角色卡
    - 在 SillyTavern 中重新加载角色卡查看效果

24. **调试方法**:
    - 在酒馆页面按 F12 打开控制台查看日志
    - 使用 `console.log` 在脚本中输出调试信息
    - 使用 `toastr.info('message')` 在界面上显示通知
    - 检查 Source Maps 定位源码位置

25. **验证清单**:
    - [ ] 脚本正确加载（控制台无报错）
    - [ ] 事件监听器正常触发
    - [ ] 自定义宏/斜杠命令可用
    - [ ] 函数工具被 AI 正确调用
    - [ ] 页面卸载时无内存泄漏（事件监听器正确移除）
    - [ ] 聊天切换时脚本正确重载

</process>
