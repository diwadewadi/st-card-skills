/**
 * Zod schema — 角色卡变量结构定义
 *
 * 本 schema 被 MVU 用于:
 * 1. 校验并转换 AI 产出的变量更新
 * 2. 为前端组件提供类型安全
 * 3. 生成 schema.json 供 initvar 编写时校验
 *
 * 常用 Zod 模式:
 *   z.string()                                   — 文本
 *   z.coerce.number()                             — 数字 (自动从字符串转换)
 *   .transform(v => _.clamp(v, 0, 100))           — 钳制到有效范围
 *   .describe('...')                              — 提示 AI 理解字段含义
 *   z.record(z.string(), z.object({...}))         — 动态键值映射 (如物品栏)
 *   z.array(z.string())                           — 列表
 *   .prefault('default')                          — AI 遗漏字段时的默认值
 */

export const Schema = z.object({
  // ── 世界状态 ──────────────────────────────────────
  世界: z.object({
    当前时间: z.string().describe('格式: YYYY-MM-DD HH:MM'),
    当前地点: z.string().describe('精确到建筑/房间级别'),
    近期事务: z.record(
      z.string().describe('事务名'),
      z.string().describe('事务描述'),
    ).prefault({}),
  }),

  // ── 角色状态 (请替换为你的角色名) ───────────────────
  alice: z
    .object({
      好感度: z.coerce.number()
        .transform(v => _.clamp(v, 0, 100))
        .describe('0-100, 角色对用户的好感'),
      心情: z.string().describe('当前情绪状态'),
      活动: z.string().describe('当前正在做的事'),

      // 着装记录
      着装: z.record(
        z.enum(['上装', '下装', '内衣', '袜子', '鞋子', '饰品']),
        z.string().describe('服装描述'),
      ),

      // 称号系统: { [称号名]: { 效果, 自我评价 } }
      称号: z.record(
        z.string().describe('称号名'),
        z.object({
          效果: z.string(),
          自我评价: z.string().prefault('待评价'),
        }),
      ).prefault({}),
    })
    .transform(data => {
      // 根据好感度计算阶段 (派生字段以 $ 开头表示只读)
      const $好感阶段 =
        data.好感度 < 20 ? '戒备'
        : data.好感度 < 40 ? '疏离'
        : data.好感度 < 60 ? '熟识'
        : data.好感度 < 80 ? '亲近'
        : '依恋';

      // 称号数量上限随好感度提升: Math.ceil(好感度 / 10)
      const 称号 = _(data.称号)
        .entries()
        .takeRight(Math.ceil(data.好感度 / 10))
        .fromPairs()
        .value();

      return { ...data, 称号, $好感阶段 };
    }),

  // ── 主角 ────────────────────────────────────────
  主角: z.object({
    物品栏: z.record(
      z.string().describe('物品名'),
      z.object({
        描述: z.string(),
        数量: z.coerce.number().transform(v => Math.max(0, Math.round(v))),
      }),
    )
    // 自动移除数量为 0 的物品
    .transform(data => _.pickBy(data, ({ 数量 }) => 数量 > 0))
    .prefault({}),
  }),
});

export type Schema = z.output<typeof Schema>;
