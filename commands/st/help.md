---
name: st:help
description: Show st-card-tools CLI commands and usage
---

<objective>
Display the complete st-card-tools command reference for the user.
</objective>

<process>
Output the following command reference:

## st-card-tools - SillyTavern 角色卡 & 世界书 CLI 工具

### 先做环境检查
| 命令 | 说明 |
|------|------|
| `st-card-tools doctor` | 检查 st-root、workspace、verify-live 浏览器，以及 Claude/Codex/Gemini 的技能安装状态 |
| `st-card-tools init-config --st-root "<path>" --workspace "<path>"` | 保存默认的 SillyTavern 路径和工作区路径 |
| `st-card-tools init` | 初始化工作区目录 |

### 助手入口技能
| 技能 | 说明 |
|------|------|
| `/st:setup` | 配置 SillyTavern 路径和工作区 |
| `/st:help` | 显示完整命令参考 |
| `/st:quick_start` | 先检查环境和资源，再引导用户选择要做的事 |

### 角色卡命令
| 命令 | 说明 |
|------|------|
| `st-card-tools list-cards` | 列出所有角色卡 PNG 文件 |
| `st-card-tools read-card <name>` | 读取角色卡完整 JSON |
| `st-card-tools read-card-field <name> <field>` | 读取指定字段（点号分隔，如 data.description） |
| `st-card-tools write-card-field <name> <field> <value>` | 修改指定字段 |
| `st-card-tools extract-card <name>` | 拆包角色卡到工作区（card.json + avatar.png + greetings/*.txt + regex/*.json + world/*） |
| `st-card-tools apply-card <name>` | 从工作区写回 PNG（自动合并开场白、正则脚本和世界书） |

### MVU 变量系统
| 技能 | 说明 |
|------|------|
| `/st:mvu` | 为角色卡添加 MVU 变量系统和前端界面 |

### 图片插入系统
| 技能 | 说明 |
|------|------|
| `/st:image` | 为角色卡添加图片插入功能（SFW/NSFW，支持自定义图片托管） |

### 复杂前端界面（devkit）
| 技能 | 说明 |
|------|------|
| `/st:frontend` | 为角色卡创建 Vue 3 交互式前端（状态面板、物品栏、战斗 UI、流式楼层界面等） |
| `/st:conventions` | 查看角色卡前端/脚本开发的通用编码规范和最佳实践 |

### 酒馆脚本开发（devkit）
| 技能 | 说明 |
|------|------|
| `/st:script` | 为角色卡编写酒馆助手脚本（事件监听、斜杠命令、自定义宏、函数工具等） |

### 世界书命令
| 命令 | 说明 |
|------|------|
| `st-card-tools list-worlds` | 列出所有世界书 JSON 文件 |
| `st-card-tools read-world <name>` | 读取世界书条目摘要 |
| `st-card-tools read-world-entry <name> <id>` | 读取条目完整内容 |
| `st-card-tools extract-world <name>` | 拆分世界书到工作区（每条目 .json + -content.txt） |
| `st-card-tools apply-world <name>` | 从工作区合并写回 JSON |

### 全局选项
| 选项 | 说明 |
|------|------|
| `--st-root <path>` | SillyTavern 根目录（或设置 ST_ROOT 环境变量） |
| `--workspace <path>` | 工作区目录（默认 cwd/workspace） |
| `--dir <path>` | 覆盖 list 命令的目录 |
| `--output <path>` | 覆盖 apply 命令的输出路径 |

### 最常见 5 个任务
1. `st-card-tools doctor` — 先确认环境和技能安装状态
2. `st-card-tools init-config --st-root "<path>" --workspace "./workspace"` — 保存默认路径
3. `st-card-tools extract-card <name>` → 编辑工作区文件 → `st-card-tools apply-card <name>`
4. `st-card-tools read-card-field <name> data.description` / `st-card-tools write-card-field <name> data.description "..."` — 快速读写单个字段
5. `st-card-tools verify-live <name> --module statusbar --browser msedge` — 用真实浏览器调试前端模块

### 工作区结构
```
extract-card → 自动提取角色卡 + 开场白 + 正则脚本 + 酒馆助手脚本 + 关联世界书
  workspace/cards/{name}/
    _manifest.json          工作区清单（给人和 AI 快速理解结构）
    card.json              角色卡元数据
    avatar.png             头像
    greetings/
      000_first_mes.txt    首条开场白（纯文本）
      001_greeting.txt     备选开场白...
    regex/
      000_xxx.json         正则脚本元数据
      000_xxx-replace.txt  替换内容（HTML/CSS 等）
    scripts/
      000_xxx.json         酒馆助手脚本元数据
      000_xxx-content.js   脚本代码内容
    world/
      _meta.json           世界书来源和顶层元数据
      _manifest.json       世界书工作区清单
      000_xxx.json         条目元数据
      000_xxx-content.txt  条目内容（纯文本）

编辑 txt 文件 → apply-card 写回 PNG + 世界书

  templates/mvu/                 MVU 变量系统模板
    变量列表-content.txt         变量列表条目模板
    变量输出格式-content.txt     输出格式条目模板
    变量输出格式强调-content.txt 输出格式强调模板
    *-meta.json                  世界书条目设置模板
    regex-scripts.json           基础正则脚本模板
```

### devkit 开发环境
```
devkit/                        前端 & 脚本开发工具包（编译器、类型、工具函数）
  package.json                 依赖配置（Vue 3, Tailwind, Webpack, Pinia, Zod...）
  webpack.config.ts            构建配置（自动发现 workspace/cards/*/src/ 入口）
  tsconfig.json                TypeScript 配置
  types/                       SillyTavern & MVU & 酒馆助手 API 类型定义
  util/
    mvu-store.ts               MVU Pinia Store 工具（defineMvuDataStore）
    streaming.ts               流式楼层渲染器（mountStreamingMessages）
    helpers.ts                 通用工具函数
  templates/
    panel/                     全局面板模板（App.vue + index.ts + index.html）
    streaming/                 流式楼层界面模板（App.vue + index.ts）
    script/                    脚本模板（index.ts）
    card/                      角色卡模板（schema.ts + 状态栏 + MVU 脚本）

workspace/cards/<cardname>/    角色卡工作区（st-card-tools extract-card 提取）
  card.json                    角色卡元数据
  greetings/                   开场白
  regex/                       正则脚本
  world/                       世界书条目
  src/                         ★ 前端/脚本源码（在此创建子目录开发）
    statusbar/                 示例：状态栏模块
      App.vue + index.ts + index.html
    my-script/                 示例：脚本模块
      index.ts
  dist/                        ★ 编译输出（Webpack 自动生成）
    statusbar/index.html
    my-script/index.js
```

devkit 使用方法：
1. `cd <devkit路径> && pnpm install` — 安装依赖（仅首次）
2. `st-card-tools extract-card <name>` — 提取角色卡到工作区
3. 在 `workspace/cards/<cardname>/src/` 下创建模块子目录
4. `pnpm dev` — 开发模式（watch + 热更新，自动发现所有卡的入口）
5. `pnpm build` — 生产构建
6. `st-card-tools apply-card <name>` — 将修改写回角色卡

如果尚未安装，请使用 `/st:setup` 进行安装配置。
</process>
