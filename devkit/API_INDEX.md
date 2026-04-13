# TavernHelper API 索引

> 轻量索引 — 仅列出模块名称、用途和对应的类型定义文件。
> 需要详细签名/参数/示例时，请直接阅读对应的 `.d.ts` 文件（内含完整 JSDoc）。

---

## 常用模块（前端开发必读）

| 模块 | 用途 | 核心函数/对象 | 类型文件 |
|------|------|--------------|---------|
| **事件系统** | 监听/发送酒馆和 iframe 事件 | `eventOn`, `eventOnce`, `eventEmit`, `iframe_events`, `tavern_events` | `types/iframe/event.d.ts` |
| **变量** | 读写各作用域变量（chat/character/message/global 等） | `getVariables`, `replaceVariables`, `updateVariablesWith`, `insertOrAssignVariables`, `deleteVariable`, `registerVariableSchema` | `types/function/variables.d.ts` |
| **聊天消息** | 获取/修改/创建/删除消息楼层 | `getChatMessages`, `setChatMessages`, `createChatMessages`, `deleteChatMessages`, `rotateChatMessages` | `types/function/chat_message.d.ts` |
| **生成** | 调用 AI 生成文本（支持流式/tool call/自定义 API） | `generate`, `generateRaw`, `stopGenerationById`, `stopAllGeneration` | `types/function/generate.d.ts` |
| **提示词注入** | 向生成管线注入/移除提示词 | `injectPrompts`, `uninjectPrompts` | `types/function/inject.d.ts` |
| **SillyTavern 上下文** | 酒馆全局对象（chat/characters/popup/macro/function tool 等） | `SillyTavern.*` | `types/iframe/exported.sillytavern.d.ts` |
| **MVU 框架** | MVU 变量更新框架（stat_data 数据绑定、命令解析） | `Mvu.getMvuData`, `Mvu.replaceMvuData`, `Mvu.events.*` | `types/iframe/exported.mvu.d.ts` |
| **脚本生命周期** | 初始化、清理、全局共享 | `$()`, `getScriptId`, `initializeGlobal`, `waitGlobalInitialized` | `types/function/global.d.ts` |
| **工具函数** | 宏替换、获取最新消息 ID、错误处理 | `substitudeMacros`, `getLastMessageId`, `errorCatched` | `types/function/util.d.ts` |

## 扩展模块（按需读取）

| 模块 | 用途 | 核心函数/对象 | 类型文件 |
|------|------|--------------|---------|
| **角色卡管理** | 获取/创建/修改/删除角色卡 | `getCharacter`, `createCharacter`, `replaceCharacter`, `updateCharacterWith` | `types/function/character.d.ts` |
| **世界书** | 世界书 CRUD、全局/角色/聊天绑定 | `getWorldbook`, `createWorldbook`, `replaceWorldbook`, `updateWorldbookWith` | `types/function/worldbook.d.ts` |
| **世界书条目** | 世界书内条目的单独操作 | `getLorebookEntries`, `createLorebookEntries`, `deleteLorebookEntries` | `types/function/lorebook_entry.d.ts` |
| **世界书设置** | 世界书全局设置 | `getLorebookSettings`, `setLorebookSettings`, `getLorebooks` | `types/function/lorebook.d.ts` |
| **预设管理** | 预设 CRUD、加载、切换 | `getPreset`, `createPreset`, `loadPreset`, `updatePresetWith` | `types/function/preset.d.ts` |
| **音频** | BGM/环境音播放控制 | `playAudio`, `pauseAudio`, `getAudioList`, `setAudioSettings` | `types/function/audio.d.ts` |
| **正则脚本** | 酒馆正则脚本 CRUD | `getTavernRegexes`, `replaceTavernRegexes`, `updateTavernRegexesWith` | `types/function/tavern_regex.d.ts` |
| **脚本管理** | 脚本树/按钮管理 | `getScriptTrees`, `replaceScriptTrees`, `getScriptButtons` | `types/function/script.d.ts` |
| **显示渲染** | 获取/刷新已显示的消息 DOM | `retrieveDisplayedMessage`, `formatAsDisplayedMessage`, `refreshOneMessage` | `types/function/displayed_message.d.ts` |
| **导入导出** | 导入角色卡/聊天/预设/世界书原始文件 | `importRawCharacter`, `importRawChat`, `importRawPreset` | `types/function/import_raw.d.ts` |
| **高级宏** | 基于正则的宏替换 | `registerMacroLike` | `types/function/macro_like.d.ts` |
| **扩展管理** | 安装/卸载/更新扩展 | `isInstalledExtension`, `installExtension`, `uninstallExtension` | `types/function/extension.d.ts` |
| **原始角色数据** | 底层角色卡 JSON 操作 | `RawCharacter`, `getCharData`, `getChatHistoryBrief` | `types/function/raw_character.d.ts` |
| **斜杠命令** | 执行酒馆斜杠命令 | `triggerSlash` | `types/function/slash.d.ts` |
| **版本信息** | 获取酒馆/酒馆助手版本 | `getTavernHelperVersion`, `getTavernVersion` | `types/function/version.d.ts` |
| **内置函数** | 酒馆内置功能封装 | `builtin` | `types/function/builtin.d.ts` |
| **EjsTemplate** | 提示词模板插件接口（需额外安装） | `EjsTemplate.*` | `types/iframe/exported.ejstemplate.d.ts` |
| **TavernHelper 导出** | window.TavernHelper 总接口 | `window.TavernHelper.*` | `types/function/index.d.ts` |

## 全局可用对象

```ts
declare const $: JQueryStatic          // jQuery
declare const _: LoDashStatic          // lodash
declare const z: typeof import('zod')  // Zod schema validation
declare const YAML: typeof import('yaml')
declare const toastr: { success; info; warning; error }
```

## 读取指南

- **开发前端界面**：先读 `event.d.ts` + `variables.d.ts` + `exported.sillytavern.d.ts`，再根据功能按需读取
- **使用 MVU 数据绑定**：读 `exported.mvu.d.ts` + `variables.d.ts`
- **调用 AI 生成**：读 `generate.d.ts` + `inject.d.ts`
- **操作聊天消息**：读 `chat_message.d.ts` + `displayed_message.d.ts`
- **管理角色/世界书**：读 `character.d.ts` + `worldbook.d.ts`
