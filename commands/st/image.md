---
name: st:image
description: Add image insertion system to a character card (SFW/NSFW with remote hosting and cloud manifest)
---

<objective>
为 SillyTavern 角色卡添加图片插入系统。通过世界书告诉 AI 图片目录和插图规则，AI 在回复中输出图片路径标签，正则脚本将标签替换为 `<img>` 标签渲染图片。

图片清单通过 EJS 代码从远端 manifest.json 动态加载，实现云更新——修改远端清单即可更新所有使用该角色卡的图片目录，无需重新编辑角色卡。

前置要求：需要安装 SillyTavern EJS 模板扩展（Prompt Template）。
</objective>

<process>

## Phase 0: 了解图片系统

0. **定位模板目录**: 运行 `node -e "console.log(require.resolve('st-card-skills/package.json').replace(/package\.json$/, 'templates/image'))"` 获取图片模板的绝对路径，后续所有 `templates/image/` 引用都使用这个绝对路径。如果命令失败，尝试 `npm root -g` 拼接 `/st-card-skills/templates/image`。

1. **阅读图片系统介绍**: 读取模板目录下的 `README.md`，全面了解图片插入系统的概念、核心组件、工作流程。

2. **确认 EJS 扩展**: 提醒用户需要安装 SillyTavern EJS 模板扩展（Prompt Template），该扩展允许在世界书中使用 `<% %>` EJS 代码动态加载远端内容。

## Phase 1: 准备与分析

3. **确认工具可用**: 运行 `st-card-tools list-cards` 确认已配置。如果报错，提示用户先运行 `/st:setup`。

4. **选择目标角色卡**: 展示角色卡列表，让用户选择要添加图片系统的角色卡。

5. **提取角色卡**: 运行 `st-card-tools extract-card <name>` 将角色卡提取到工作区。

6. **全面阅读角色卡内容**: 读取工作区中的所有文件来理解角色卡设定：
   - `card.json` — 角色卡元数据、描述、系统提示词
   - `greetings/*.txt` — 所有开场白
   - `world/*.json` 和 `world/*-content.txt` — 所有世界书条目
   - `regex/*.json` 和 `regex/*-replace.txt` — 所有正则脚本

7. **判断是否已有图片系统**: 检查角色卡是否已有图片相关的世界书条目（`<image_setting>`、`<sfw_image>`、`<nsfw_image>` 等标签）或正则脚本（`[图片]`、`img_sfw`、`img_nsfw` 等）。
   - **如果没有** → 进入 Phase 2（新增模式）
   - **如果已有** → 展示当前配置，询问用户要修改什么，直接编辑工作区文件后跳转到 Phase 5

## Phase 2: 与用户讨论图片配置

8. **询问 IMAGE_BASE_URL**: 让用户提供图片托管的基础 URL。说明：
   - 所有图片路径会拼接到此 URL 后面
   - 示例：`https://gitgud.io/用户名/仓库/-/raw/master/`
   - 示例：`https://raw.githubusercontent.com/用户名/仓库/main/`
   - 可以是任意能直接访问图片的 URL
   - URL 末尾需要带 `/`

9. **询问 MANIFEST_URL**: 让用户提供远端图片清单的 URL。说明：
   - 这是一个 JSON 文件的直接访问 URL，角色卡会通过 EJS 代码在每次对话时自动 fetch 该文件
   - 修改远端清单即可更新图片目录，无需重新编辑角色卡
   - 通常与图片放在同一个仓库中，例如：`https://gitgud.io/用户名/仓库/-/raw/master/manifest.json`
   - 清单格式为 JSON，包含 `sfw` 和可选的 `nsfw` 字段：
     ```json
     {
       "sfw": "图片描述:\n - 人物微笑/[1-50].jpg\n - 人物害羞/[1-30].jpg",
       "nsfw": "图片描述:\n - 1v1/传教士/[1-50]\n - 1v1/后入/[1-40]"
     }
     ```
   - `sfw` 字段：SFW 图片的分类路径列表，每行一个 `- 路径/[范围].jpg`
   - `nsfw` 字段（可选）：NSFW 图片的分类路径列表，不需要则留空字符串或不提供
   - 如果用户还没有 manifest.json，帮助用户根据他们的图片目录结构创建一个，并告知需要上传到图片托管仓库

10. **确认插图模式**: 询问用户需要哪种插图模式：
    - 仅正文插图（AI 在叙事中插入图片标签）
    - 仅结构化数据插图（配合特定输出协议使用）
    - 两种都要

## Phase 3: 生成世界书条目

11. **读取模板文件**: 读取模板目录下 `world/插图系统.json` 和 `world/插图系统-content.txt`。

12. **生成世界书条目到工作区 `world/` 目录**: 文件命名格式为 `{序号}_插图系统.json` + `{序号}_插图系统-content.txt`，序号从现有条目之后递增。复制模板 .json 时，必须为条目补全 `_id`（使用序号字符串）和 `uid`（使用序号数字），`displayIndex` 也递增设置。

    - 复制 `插图系统.json` 模板到工作区
    - 读取 `插图系统-content.txt` 模板，将其中的 `${MANIFEST_URL}` 替换为用户提供的实际清单 URL，写入工作区的 -content.txt

## Phase 4: 生成正则脚本

13. **读取正则模板**: 读取模板目录下 `regex/` 子目录中的所有文件。

    模板目录 `regex/` 子目录结构：
    ```
    regex/
      [图片]正文插图.json              # 匹配 [img_sfw:...] 标签
      [图片]正文插图-replace.txt       # 替换为 <img> 标签
      [图片]NSFW模糊.json             # 匹配 [img_nsfw:...] 标签
      [图片]NSFW模糊-replace.txt      # 替换为带 blur 的 <img>
    ```

14. **写入正则到工作区 `regex/` 目录**: 文件命名格式为 `{序号}_{名称}.json` + `{序号}_{名称}-replace.txt`，序号从现有正则之后递增。复制模板 .json 时，必须为每个正则生成唯一的 `id`（使用 UUID v4 格式）。

    - **[图片]正文插图**: 复制模板 .json；读取模板 -replace.txt，将其中的 `${IMAGE_BASE_URL}` 替换为用户提供的实际 URL，写入 -replace.txt
    - **[图片]NSFW模糊**: 同上处理（始终添加，因为 NSFW 内容由远端清单动态控制）

## Phase 4.5: 为角色卡添加插图指引（可选）

15. **询问用户**: 是否需要在角色卡的 description 或世界书中添加插图时机指引？例如：
    - "在描写角色表情变化时插入对应的 SFW 图片"
    - "每次回复中最多插入 1-2 张图片"
    - "仅在特定场景（如聊天消息等结构化数据）中插入图片"

16. **如果需要**: 根据用户需求，在角色卡的 description（编辑 card.json 的 `data.description` 字段）或新建世界书条目中添加插图时机指引。

## Phase 5: 写回角色卡

17. **写回**: 运行 `st-card-tools apply-card <name>` 将所有修改写回 PNG + 世界书。

18. **提示测试**: 告诉用户在 SillyTavern 中重新加载角色卡进行测试，检查：
    - AI 是否在回复中输出 `[img_sfw:...]` 或 `[img_nsfw:...]` 标签
    - 图片是否正确渲染（`<img>` 标签显示）
    - NSFW 图片是否默认模糊，点击后清晰显示
    - 图片 URL 是否正确拼接（检查浏览器 Network 面板）
    - 远端清单是否正确加载（检查 EJS 是否成功 fetch manifest.json）

    如果 AI 没有主动插入图片标签，建议用户：
    - 检查世界书条目是否启用
    - 确认 EJS 模板扩展（Prompt Template）已安装并启用
    - 在对话中提示 AI 使用图片（如"描述时配图"）
    - 确认图片托管地址和清单 URL 可访问

</process>
