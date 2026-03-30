---
name: st:quick_start
description: Learn st-card-tools capabilities, then ask the user what they want to do
---

<objective>
了解 st-card-tools 的全部功能，然后主动询问用户想要做什么操作。
</objective>

<process>
1. **了解工具能力**: 运行 `st-card-tools --help` 获取完整命令列表和用法。

2. **检查配置状态**: 运行 `st-card-tools list-cards` 确认工具已配置可用。如果报错，提示用户先运行 `/st:setup` 完成配置。

3. **浏览当前资源**: 运行以下命令了解用户有哪些素材：
   - `st-card-tools list-cards` — 查看所有角色卡
   - `st-card-tools list-worlds` — 查看所有世界书

4. **向用户展示能力并询问需求**: 用简洁的方式告诉用户你可以帮他做什么，然后问他想做什么。例如：

   角色卡相关：
   - 查看/读取角色卡内容
   - 提取角色卡到工作区进行编辑（包括开场白、世界书）
   - 修改角色卡的特定字段（描述、性格、开场白等）
   - 编辑完成后写回 PNG

   世界书相关：
   - 查看/读取世界书条目
   - 提取世界书到工作区编辑
   - 修改世界书条目内容
   - 编辑完成后写回 JSON

5. **执行用户请求**: 根据用户的回答，调用对应的 st-card-tools 命令完成操作。如果用户的需求涉及多个步骤，先说明流程再逐步执行。
</process>
