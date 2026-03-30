# MVU 变量系统介绍

## 什么是 MVU

MVU（MagVarUpdate）是 SillyTavern 的变量管理框架，依赖**酒馆助手**和**提示词模板**两个插件运行。它让角色卡拥有持久化的结构化变量，AI 可以在每次回复中通过特定格式更新这些变量，前端界面可以实时展示变量状态。

MVU 本身**不与 AI 直接交互**，它只做三件事：

1. **初始化变量** — 新开聊天时，读取 `[initvar]` 世界书条目中的 YAML 数据，写入消息楼层变量
2. **尾附占位符** — 在 AI 回复末尾自动附加 `<StatusPlaceHolderImpl/>`，配合正则实现零 token 的界面显示
3. **解析更新命令** — 解析 AI 回复中的 `<UpdateVariable>` 块，用 JSON Patch 操作更新变量

## 为什么用 MVU

- **状态持久化**: 变量跟随消息楼层存储，即使角色 100 楼前消失又出现，AI 仍能通过变量列表知道她的好感度
- **游戏化交互**: 可以制作商城、技能树、大地图等前端界面，玩家通过点击操作而非打字输入
- **token 优化**: 变量列表只发送最新版本；配合提示词模板（EJS），可以根据变量值动态发送对应阶段的提示词，而非全部发送
- **结构化校验**: 通过 Zod schema 定义变量结构，自动校验类型、范围、默认值，防止 AI 输出错误数据

## MVU 的核心组件

### 1. 变量结构（Zod Schema 脚本）

在角色卡的酒馆助手脚本中，用 Zod 定义变量的类型和约束：

```javascript
import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

export const Schema = z.object({
  世界: z.object({
    当前时间: z.string(),
    当前地点: z.string(),
  }),
  角色名: z.object({
    好感度: z.coerce.number().transform(v => _.clamp(v, 0, 100)).describe('0-100'),
    心情: z.string().describe('当前情绪状态'),
  }),
});

$(() => { registerMvuSchema(Schema); });
```

常用 Zod 方法：
- `z.string()` / `z.coerce.number()` — 基本类型
- `.describe('说明')` — 为 AI 提供变量含义
- `.transform(fn)` — 自动校验/修正（如 clamp 范围、限制数组长度）
- `z.record(key, value)` — 动态键值对（如角色列表、物品栏）
- `.prefault('默认值')` — AI 省略时的默认值

### 2. MVU 运行时脚本

单独一个脚本导入 MVU 引擎：

```javascript
import 'https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate@beta/artifact/bundle.js'
```

### 3. 三大变量提示词（世界书条目）

这是 AI 理解和操作变量的核心，缺一不可：

**变量列表** — 告诉 AI 当前变量值是什么
```
---
<status_current_variables>
{{format_message_variable::stat_data}}
</status_current_variables>
```
`{{format_message_variable::stat_data}}` 是酒馆助手宏，发送时自动替换为 YAML 格式的变量内容。建议放在 depth 0（D0）位置，让 AI 知道这是最新数据。

**变量更新规则** — 告诉 AI 什么时候更新、怎么更新
```yaml
---
变量更新规则:
  角色名:
    好感度:
      type: number
      range: 0~100
      check:
        - 仅当该角色出场时才更新
        - 单次变化不超过 ±5
    心情:
      check:
        - 根据事件实时调整
```

**变量输出格式** — 告诉 AI 用什么格式输出更新命令
```yaml
---
变量输出格式:
  rule:
    - 在回复末尾输出更新分析和更新命令
    - 更新命令遵循 JSON Patch (RFC 6902) 标准，支持 replace/delta/insert/remove/move
  format: |-
    <UpdateVariable>
    <Analysis>$(英文，不超过80词)
    - ${分析时间流逝}
    - ${分析每个变量的变化}
    </Analysis>
    <JSONPatch>
    [
      { "op": "replace", "path": "/角色名/心情", "value": "开心" },
      { "op": "delta", "path": "/角色名/好感度", "value": 3 },
      ...
    ]
    </JSONPatch>
    </UpdateVariable>
```

### 4. 变量初始化（[InitVar] 世界书条目）

设置变量的初始值，条目默认关闭（disable: true），MVU 会在新聊天时自动读取：

```yaml
# [initvar]变量初始化勿开

世界:
  当前时间: 2024年4月8日 上午10:00
  当前地点: 教室
角色名:
  好感度: 30
  心情: 平静
```

### 5. 正则脚本（6 个标准正则）

| 正则 | 作用 | 类型 |
|------|------|------|
| [不发送]去除变量更新 | 移除旧楼层的 `<UpdateVariable>` 块，只保留最近几楼 | promptOnly |
| [不发送]仅格式思维链 | 移除 `<Analysis>` 块不发给 AI | promptOnly |
| [不发送]界面占位符 | 移除 `<StatusPlaceHolderImpl/>` 不发给 AI | promptOnly |
| [隐藏]变量更新 | 隐藏已完成的 `<UpdateVariable>` 不显示给玩家 | markdownOnly |
| [美化]完整变量完成 | 将已完成的变量更新美化为可折叠面板 | markdownOnly |
| [美化]变量更新中 | 将进行中的变量更新美化为可折叠面板 | markdownOnly |

### 6. 前端状态栏（可选）

利用 `<StatusPlaceHolderImpl/>` 占位符 + 正则替换，在 AI 回复末尾显示自定义界面，**不消耗任何 token**：

```javascript
// 前端脚本核心模式
async function init() {
  await waitGlobalInitialized('Mvu');
  refresh();
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, () => refresh());
}

function refresh() {
  const data = _.get(getAllVariables(), 'stat_data', {});
  // 用 jQuery 更新 DOM
  $('#mood').text(_.get(data, '角色名.心情', '—'));
}
```


