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
| `st-card-tools extract-card <name>` | 拆包角色卡到工作区（card.json + avatar.png） |
| `st-card-tools apply-card <name>` | 从工作区写回 PNG |

### 世界书命令
| 命令 | 说明 |
|------|------|
| `st-card-tools list-worlds` | 列出所有世界书 JSON 文件 |
| `st-card-tools read-world <name>` | 读取世界书条目摘要 |
| `st-card-tools read-world-entry <name> <id>` | 读取条目完整内容 |
| `st-card-tools extract-world <name>` | 拆分世界书到工作区（每条目一个文件） |
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
extract → 编辑 workspace 中的文件 → apply 写回
```

如果尚未安装，请使用 `/st:setup` 进行安装配置。
</process>
