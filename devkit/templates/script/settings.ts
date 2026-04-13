/**
 * 脚本设置状态管理
 *
 * 使用 Zod 定义设置结构, 通过 Pinia 管理响应式状态,
 * 自动同步到 SillyTavern 脚本变量实现持久化.
 */

const Settings = z
  .object({
    enabled: z.boolean().default(true),
    greeting: z.string().default('你好!'),
    max_messages: z.coerce.number().default(10),
  })
  .prefault({});

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref(Settings.parse(getVariables({ type: 'script', script_id: getScriptId() })));

  // 自动保存: 每次设置变更自动写入脚本变量
  watchEffect(() => {
    insertOrAssignVariables(klona(settings.value), { type: 'script', script_id: getScriptId() });
  });

  return { settings };
});
