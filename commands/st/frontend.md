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

## Phase 2: 项目脚手架

9. **创建项目目录**: 在角色卡工作区下创建 `src/` 子目录。提取角色卡后工作区路径为 `workspace/cards/<cardname>/`，在其下创建 `src/<模块名>/` 目录（如 `src/statusbar/`、`src/panel/` 等）。

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

10. **复制对应模板**: 根据界面类型，从 `devkit/templates/` 复制文件到 `workspace/cards/<cardname>/src/<模块名>/`：
    - 面板 → 复制 `templates/panel/` 的 App.vue + index.ts + index.html
    - 流式 → 复制 `templates/streaming/` 的 App.vue + index.ts
    - 状态栏 → 复制 `templates/card/statusbar/` 的 App.vue + index.ts + index.html

11. **如需 MVU**: 在 `workspace/cards/<cardname>/src/` 下创建 `schema.ts`，参考 `templates/card/schema.ts` 定义 Zod 变量结构。

## Phase 3: 组件开发

12. **编写 Vue 组件**: 在项目目录中编写 `.vue` 文件。技术要求：
    - 使用 `<script setup lang="ts">` 语法
    - 使用 Tailwind CSS 做样式（iframe 模式下隔离，不影响酒馆）
    - 可使用 Pinia 做状态管理
    - 可使用 VueUse composables（useIntervalFn、watchIgnorable 等已自动导入）

13. **数据绑定**（如需要）:
    - **MVU 变量** → 使用 `defineMvuDataStore(Schema, { type: 'message', message_id: -1 })`
    - **MVU 事件** → 使用 `eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, callback)`
    - **直接变量** → 使用 `getAllVariables().stat_data`

14. **调用 SillyTavern API**（按需）:
    - `SillyTavern.chat` — 读取聊天记录
    - `SillyTavern.registerMacro(key, fn)` — 注册自定义宏
    - `SillyTavern.registerFunctionTool(tool)` — 注册 AI 可调用的工具
    - `SillyTavern.callGenericPopup(content, type)` — 弹窗
    - `eventOn(event, handler)` — 监听事件

## Phase 4: 构建与集成

15. **构建**: 在 devkit 目录运行 `pnpm build`（或 `pnpm dev` 进入 watch 模式）。
    - Webpack 会自动发现 `workspace/cards/*/src/` 下的所有入口
    - 编译输出到对应卡片目录的 `dist/`（如 `workspace/cards/<cardname>/dist/statusbar/index.html`）
    - 如果 workspace 路径非默认，使用 `pnpm dev --env workspace=<path>` 指定

16. **集成到角色卡**: 根据界面类型选择集成方式：

    **状态栏** → 添加一个正则脚本到角色卡：
    - 在工作区 `regex/` 目录添加一个正则，匹配 `<StatusPlaceHolderImpl/>`，替换为加载编译后 HTML 的代码
    - 确保开场白末尾包含 `<StatusPlaceHolderImpl/>` 占位符

    **面板/脚本** → 添加酒馆助手脚本到角色卡：
    - 在工作区 `scripts/` 目录添加脚本（extract-card 已自动提取酒馆助手脚本到此目录）
    - 每个脚本有一个 `.json`（元数据）和 `-content.js`（脚本内容）
    - 修改 `-content.js` 中的内容为 `import '<编译后的 JS 文件 URL>'`
    - 如果上传到 GitHub/CDN → 使用 jsDelivr URL
    - 也可以直接将编译后的 JS 代码粘贴到 `-content.js` 中

17. **写回**: 运行 `st-card-tools apply-card <name>` 将修改写回角色卡。

## Phase 5: 开发调试

18. **开发流程**:
    - `pnpm dev`（在 devkit 目录）启动 Webpack watch 模式，修改后自动重新编译
    - 编译完成后运行 `st-card-tools apply-card <name>` 写回角色卡
    - 在 SillyTavern 中重新加载角色卡查看效果

19. **验证清单**:
    - [ ] 界面正确渲染
    - [ ] 变量数据正确绑定（如使用 MVU）
    - [ ] 移动端适配
    - [ ] 事件监听器在页面卸载时正确清理

</process>
