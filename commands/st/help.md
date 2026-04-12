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

### 工作区流程
```
extract-card → 自动提取角色卡 + 开场白 + 正则脚本 + 关联世界书
  workspace/cards/{name}/
    card.json              角色卡元数据
    avatar.png             头像
    greetings/
      000_first_mes.txt    首条开场白（纯文本）
      001_greeting.txt     备选开场白...
    regex/
      000_xxx.json         正则脚本元数据
      000_xxx-replace.txt  替换内容（HTML/CSS 等）
    world/
      _meta.json           世界书元数据
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

如果尚未安装，请使用 `/st:setup` 进行安装配置。
</process>
