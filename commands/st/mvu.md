---
name: st:mvu
description: Add or modify MVU variable system and frontend for a character card
---

<objective>
为 SillyTavern 角色卡添加或修改 MVU 变量系统。支持两种模式：
- **新增模式**: 为没有 MVU 的角色卡从零添加完整的变量系统和前端界面
- **修改模式**: 对已有 MVU 的角色卡进行交互式修改（调整变量结构、更新规则、初始值、正则、前端等）
</objective>

<process>

## Phase 0: 了解 MVU

0. **定位模板目录**: 运行 `node -e "console.log(require.resolve('st-card-skills/package.json').replace(/package\.json$/, 'templates/mvu'))"` 获取 MVU 模板的绝对路径，后续所有 `templates/mvu/` 引用都使用这个绝对路径。如果命令失败，尝试 `npm root -g` 拼接 `/st-card-skills/templates/mvu`。

1. **阅读 MVU 介绍**: 读取模板目录下的 `README.md`，全面了解 MVU 变量系统的概念、核心组件、工作流程。这是后续所有步骤的知识基础。

## Phase 1: 准备与分析

1. **确认工具可用**: 运行 `st-card-tools list-cards` 确认已配置。如果报错，提示用户先运行 `/st:setup`。

2. **选择目标角色卡**: 展示角色卡列表，让用户选择要添加 MVU 的角色卡。

3. **提取角色卡**: 运行 `st-card-tools extract-card <name>` 将角色卡提取到工作区。

4. **全面阅读角色卡内容**: 读取工作区中的所有文件来理解角色卡设定：
   - `card.json` — 角色卡元数据、描述、系统提示词（注意：extract 后 scripts 已分离到 scripts/ 目录，card.json 中不再包含 tavern_helper.scripts）
   - `greetings/*.txt` — 所有开场白
   - `world/*.json` 和 `world/*-content.txt` — 所有世界书条目
   - `regex/*.json` 和 `regex/*-replace.txt` — 所有正则脚本
   - `scripts/*.json` 和 `scripts/*-content.js` — 所有 tavern_helper 脚本（.json 是元数据，-content.js 是脚本内容）

5. **判断模式**: 检查角色卡是否已有 MVU 系统（`scripts/` 目录中存在包含 `registerMvuSchema` 的 `-content.js` 文件、`world/` 中有 `[mvu_update]` 条目、或 `[initvar]` 条目）。
   - **如果没有 MVU** → 进入 Phase 2（新增模式），从零开始添加
   - **如果已有 MVU** → 进入 Phase 1.5（修改模式），与用户交互修改

## Phase 1.5: 修改模式（已有 MVU 的角色卡）

仅当角色卡已有 MVU 系统时进入此流程。

6. **展示当前 MVU 配置概览**: 向用户展示角色卡现有的 MVU 组件：
   - 变量结构（`scripts/` 目录中对应的 `-content.js` 文件内容摘要）
   - 世界书条目列表（变量列表、更新规则、输出格式、初始化等）
   - 正则脚本列表
   - 前端状态栏（如果有）

7. **询问用户想修改什么**: 让用户选择要修改的部分，可以是以下任意组合：
   - 变量结构（增删改变量字段、调整约束）
   - 变量更新规则（修改 check 条件）
   - 变量初始值（调整初始状态）
   - 开场白（检查或添加 `<StatusPlaceHolderImpl/>` 占位符）
   - 正则脚本（增删改正则）
   - 前端状态栏（修改界面布局/样式、新增状态栏）
   - 其他世界书条目

8. **执行修改**: 根据用户需求，直接编辑工作区中对应的文件：
   - 修改变量结构 → 编辑 `scripts/` 目录下对应脚本的 `-content.js` 文件（如 `000_变量结构-content.js`）
   - 修改更新规则 → 编辑对应的 `[mvu_update]变量更新规则` 的 -content.txt
   - 修改初始值 → 编辑 `[InitVar]` 的 -content.txt
   - 修改开场白 → 检查 greetings/ 下的 .txt 文件是否包含 `<StatusPlaceHolderImpl/>`，缺少则追加
   - 修改正则 → 编辑 regex/ 目录下对应的 .json 和 -replace.txt
   - 修改前端 → 编辑状态栏正则的 -replace.txt
   - 如果修改了变量结构（增删字段），需要同步更新：更新规则、初始值、前端状态栏

9. **与用户确认修改**: 展示修改内容摘要，确认无误后跳转到 Phase 7 写回。

## Phase 2: 与用户讨论变量需求（新增模式）

以下 Phase 2-6 仅在新增模式下执行。

5. **分析角色卡并提出变量建议**: 基于角色卡的设定、角色、场景，向用户提出变量结构建议。常见模式：
   - 世界状态（时间、地点、事件等）
   - 角色状态（好感度、心情、行为、外观等）
   - 物品/技能/任务/服装等系统


6. **与用户确认最终变量结构**: 讨论并确定每个变量的名称、类型、约束、含义。

## Phase 3: 生成变量结构脚本

7. **写入 tavern_helper 脚本到 scripts/ 目录**: 脚本以分离文件的形式存放在工作区的 `scripts/` 目录中（extract-card 会将 tavern_helper.scripts 提取到此目录，apply-card 时自动合并回 card.json）。

   首先检查 card.json 中是否已有 `data.extensions.tavern_helper` 结构。如果没有，读取模板目录下的 `card.json` 作为参考，将 `tavern_helper` 结构合并到 card.json 的 `data.extensions` 中。

   然后读取模板目录下 `scripts/` 子目录中的模板文件作为参考（`.json` 是元数据，`-content.js` 是脚本内容），在工作区 `scripts/` 目录中为每个脚本创建两个文件。序号从现有脚本之后递增。

   模板目录 `scripts/` 子目录结构：
   ```
   scripts/
     变量结构.json              # 元数据模板
     变量结构-content.js        # 脚本内容模板（Zod schema）
     MVUbeta.json               # 元数据模板（含按钮配置）
     MVUbeta-content.js         # 脚本内容模板（导入运行时）
   ```

   **脚本 1 — "变量结构"**: 
   
   元数据文件 `{序号}_变量结构.json`：
   ```json
   {
     "button": { "buttons": [], "enabled": true },
     "data": {},
     "enabled": true,
     "id": "生成唯一UUID",
     "info": "",
     "name": "变量结构",
     "type": "script"
   }
   ```

   内容文件 `{序号}_变量结构-content.js`：使用 Zod schema 定义变量结构：
   ```javascript
   import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

   export const Schema = z.object({
     // 根据用户确认的变量结构生成
     // 使用 z.string(), z.coerce.number(), z.object(), z.record() 等
     // 使用 .describe() 添加含义注释
     // 使用 .transform() 添加约束逻辑（如 clamp、数量限制等）
   });

   $(() => {
     registerMvuSchema(Schema);
   });
   ```

   **脚本 2 — "MVUbeta"**: 
   
   元数据文件 `{序号}_MVUbeta.json`：
   ```json
   {
     "button": {
       "buttons": [
         { "name": "重新处理变量", "visible": true },
         { "name": "重新读取初始变量", "visible": true },
         { "name": "清除旧楼层变量", "visible": false },
         { "name": "快照楼层", "visible": false },
         { "name": "重演楼层", "visible": false },
         { "name": "重试额外模型解析", "visible": false }
       ],
       "enabled": true
     },
     "data": {},
     "enabled": true,
     "id": "生成唯一UUID",
     "info": "",
     "name": "MVUbeta",
     "type": "script"
   }
   ```

   内容文件 `{序号}_MVUbeta-content.js`：导入 MVU 运行时：
   ```javascript
   import 'https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate@beta/artifact/bundle.js'
   ```

## Phase 4: 生成世界书条目

8. **读取模板文件**: 读取模板目录下 `world/` 子目录中的所有模板文件（.json 和 -content.txt）。

   模板目录 `world/` 子目录结构：
   ```
   world/
     变量列表.json                        # 世界书条目元数据
     变量列表-content.txt                  # 条目内容（通用，直接复制）
     [mvu_update]变量更新规则.json         # 元数据
     [mvu_update]变量输出格式.json         # 元数据
     [mvu_update]变量输出格式-content.txt  # 条目内容（通用，直接复制）
     [mvu_update]变量输出格式强调.json     # 元数据
     [mvu_update]变量输出格式强调-content.txt # 条目内容（通用，直接复制）
     [InitVar].json                        # 元数据
   ```

9. **生成 5 个世界书条目到工作区 `world/` 目录**: 文件命名格式为 `{序号}_{名称}.json` + `{序号}_{名称}-content.txt`，序号从现有条目之后递增。复制模板 .json 时，必须为每个条目补全 `_id`（使用序号字符串）和 `uid`（使用序号数字），`displayIndex` 也递增设置。

   - **变量列表**: 直接复制模板的 .json 和 -content.txt
   - **[mvu_update]变量更新规则**: 复制模板 .json；读取模板目录下 `world/[mvu_update]变量更新规则-content.txt` 作为格式参考，根据实际变量结构生成 YAML 格式的 -content.txt，为每个变量定义 `check` 更新条件
   - **[mvu_update]变量输出格式**: 直接复制模板的 .json 和 -content.txt
   - **[mvu_update]变量输出格式强调**: 直接复制模板的 .json 和 -content.txt
   - **[InitVar]变量初始化**: 复制模板 .json；根据角色卡设定和开场白场景生成 YAML 格式的初始变量值作为 -content.txt

   变量更新规则的 -content.txt 格式示例（根据实际变量结构生成）：
   ```yaml
   ---
   变量更新规则:
     变量路径:
       字段名:
         type: number  # 如果是数值类型
         range: 0~100  # 如果有范围
         check:
           - 更新条件描述1
           - 更新条件描述2
   ```

   变量初始化的 -content.txt 格式：以 `# [initvar]变量初始化勿开` 开头，然后是 YAML 格式的初始值。

## Phase 5: 生成 6 个正则脚本

10. **读取正则模板**: 读取模板目录下 `regex/` 子目录中的所有文件。

    模板目录 `regex/` 子目录结构：
    ```
    regex/
      [不发送]去除变量更新.json        # 移除旧楼层 UpdateVariable（minDepth:6）
      [不发送]仅格式思维链.json        # 移除 Analysis 块不发给 AI
      [不发送]界面占位符.json          # 移除 StatusPlaceHolderImpl 不发给 AI
      [隐藏]变量更新.json              # 隐藏已完成的 UpdateVariable 不显示
      [美化]完整变量完成.json          # 美化已完成的变量更新显示
      [美化]完整变量完成-replace.txt   # 美化 HTML 模板
      [美化]变量更新中.json            # 美化进行中的变量更新显示
      [美化]变量更新中-replace.txt     # 美化 HTML 模板
    ```

11. **写入 6 个正则到工作区 `regex/` 目录**: 文件命名格式为 `{序号}_{名称}.json` + `{序号}_{名称}-replace.txt`，序号从现有正则之后递增。复制模板 .json 时，必须为每个正则生成唯一的 `id`（使用 UUID v4 格式）。

    - 对于有 replace 模板的正则（[美化]完整变量完成、[美化]变量更新中），将模板的 -replace.txt 内容写入对应的 -replace.txt 文件
    - 对于 replaceString 为空的正则（[不发送]、[隐藏]），-replace.txt 文件内容为空

## Phase 6: 生成前端状态栏（可选）

12. **询问用户**: 是否需要生成前端状态栏界面？

13. **如果需要，生成状态栏正则**: 读取模板目录下 `regex/状态栏.json` 和 `regex/状态栏-replace.txt` 作为参考示例。额外添加一个正则到工作区 `regex/` 目录：
    - 复制 `状态栏.json` 模板作为正则配置
    - 读取 `状态栏-replace.txt` 模板了解前端代码的结构和 API 用法，然后根据实际变量结构生成定制的 -replace.txt

    前端代码要求（参考模板示例）：
    - 使用 ```` ```html ```` 包裹的完整 HTML 文档
    - 使用 `<script type="module">` 标签
    - 通过 `waitGlobalInitialized('Mvu')` 等待 MVU 初始化
    - 通过 `getAllVariables().stat_data` 获取变量数据
    - 通过 `eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, refresh)` 监听变量更新事件
    - 使用 lodash `_.get(data, '路径', '默认值')` 安全访问嵌套属性
    - 使用 jQuery `$()` 操作 DOM
    - 使用 `$(errorCatched(init))` 包裹初始化函数
    - 根据变量结构设计合适的 tab 式或分区布局
    - 样式应美观、紧凑，适配移动端

14. **为开场白添加占位符**: 读取 `greetings/` 目录下的所有 .txt 文件，在每个开场白末尾追加 `<StatusPlaceHolderImpl/>`（如果尚未包含）。这样前端状态栏才能在开场白和 AI 回复后显示。

## Phase 7: 写回角色卡

14. **写回**: 运行 `st-card-tools apply-card <name>` 将所有修改写回 PNG + 世界书。

15. **提示测试**: 告诉用户在 SillyTavern 中重新加载角色卡进行测试，检查：
    - 变量是否正确初始化（开新聊天）
    - AI 回复末尾是否输出 `<UpdateVariable>` 块
    - 变量更新是否正常解析
    - 状态栏是否正确显示（如果生成了）

</process>
