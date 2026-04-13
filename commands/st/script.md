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

1. **阅读 API 参考**: 读取以下类型定义文件，了解所有可用的 API：
   - `devkit/types/sillytavern.d.ts` — SillyTavern 核心 API
   - `devkit/types/tavernhelper.d.ts` — 酒馆助手扩展 API
   - `devkit/types/events.d.ts` — 事件系统
   - `devkit/types/variables.d.ts` — 变量系统
   - `devkit/types/mvu.d.ts` — MVU 框架 API
   - `devkit/types/globals.d.ts` — 全局变量（$、_、z、YAML、toastr）

2. **阅读脚本模板**: 读取 `devkit/templates/script/index.ts` 了解基本脚本结构。

3. **确认 st-card-tools 可用**: 运行 `st-card-tools list-cards`。如果报错，提示用户先运行 `/st:setup`。

4. **检查 devkit 依赖**: 如果 `devkit/node_modules` 不存在，提示用户先安装依赖。

## Phase 1: 需求分析

5. **选择目标角色卡**: 展示角色卡列表，让用户选择。

6. **提取并分析角色卡**: 运行 `st-card-tools extract-card <name>`，读取所有文件了解角色卡。

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

## Phase 2: 脚本创建

9. **创建项目目录**: 在角色卡工作区下创建 `src/` 子目录。提取角色卡后工作区路径为 `workspace/cards/<cardname>/`，在其下创建 `src/<脚本名>/` 目录。

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

10. **复制脚本模板**: 从 `devkit/templates/script/` 复制 `index.ts` 到 `workspace/cards/<cardname>/src/<脚本名>/`。

11. **如需设置界面**: 额外创建 `settings.vue` 和 `settings.ts`。

## Phase 3: 脚本编写

12. **编写 TypeScript 脚本**: 根据需求实现功能。核心模式：

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

13. **生命周期管理要点**:
    - 始终在 `$(() => { ... })` 中初始化
    - 始终在 `$(window).on('pagehide', ...)` 中清理
    - 所有 `eventOn` 返回的 `{ stop }` 都要在卸载时调用
    - 如果使用 `await waitGlobalInitialized('Mvu')`，确保在 `$()` 回调中

## Phase 4: 构建集成

14. **构建**: 在 devkit 目录运行 `pnpm build`。
    - Webpack 自动发现 `workspace/cards/*/src/` 下的所有入口
    - 编译输出到对应卡片目录的 `dist/`（如 `workspace/cards/<cardname>/dist/my-script/index.js`）
    - 如果 workspace 路径非默认，使用 `pnpm build --env workspace=<path>` 指定

15. **集成到角色卡**: 两种方式：

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

16. **写回**: 运行 `st-card-tools apply-card <name>` 写回角色卡。

## Phase 5: 测试与调试

17. **开发流程**:
    - `pnpm dev`（在 devkit 目录）启动 Webpack watch 模式，修改后自动重新编译
    - 编译完成后运行 `st-card-tools apply-card <name>` 写回角色卡
    - 在 SillyTavern 中重新加载角色卡查看效果

18. **调试方法**:
    - 在酒馆页面按 F12 打开控制台查看日志
    - 使用 `console.log` 在脚本中输出调试信息
    - 使用 `toastr.info('message')` 在界面上显示通知
    - 检查 Source Maps 定位源码位置

19. **验证清单**:
    - [ ] 脚本正确加载（控制台无报错）
    - [ ] 事件监听器正常触发
    - [ ] 自定义宏/斜杠命令可用
    - [ ] 函数工具被 AI 正确调用
    - [ ] 页面卸载时无内存泄漏（事件监听器正确移除）
    - [ ] 聊天切换时脚本正确重载

</process>
