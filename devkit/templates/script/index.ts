/**
 * 脚本示例 — 展示 TavernHelper 脚本的各项核心能力
 *
 * 包含:
 *   - 加载/卸载生命周期
 *   - 按钮注册与事件绑定
 *   - 消息事件监听
 *   - 设置界面 (挂载到酒馆扩展面板)
 *   - 聊天文件切换时重载
 *   - 自定义宏 ({{macro}})
 *   - 函数工具 (AI 可调用)
 *   - 立即事件注入 (injectPrompts)
 *
 * 构建: 输出 index.js
 *
 * 生命周期规则:
 *   - 在 $(() => { ... }) 内初始化
 *   - 在 $(window).on('pagehide', ...) 内清理
 *   - 禁止使用 DOMContentLoaded (iframe 中不触发)
 *   - 禁止在全局作用域执行代码
 *   - 顶层异步函数用 errorCatched() 包裹
 */
import { reloadOnChatChange } from '@util/script';
import { createScriptIdDiv, teleportStyle } from '@util/script';
import SettingsPanel from './settings-panel.vue';
import { useSettingsStore } from './settings';

// ── 聊天文件切换时自动重载脚本 ─────────────────────────
reloadOnChatChange();

// ── 加载时执行 ──────────────────────────────────────
$(() => {
  toastr.success(`[${getScriptName()}] 脚本已加载`);

  // ── 按钮注册 & 事件绑定 ──────────────────────────
  replaceScriptButtons([{ name: '打招呼', visible: true }]);

  const { stop: stopButtonListener } = eventOn(getButtonEvent('打招呼'), () => {
    toastr.info('你好呀!');
  });

  // ── 监听消息修改事件 ─────────────────────────────
  const { stop: stopMessageListener } = eventOn(
    tavern_events.MESSAGE_UPDATED,
    (message_id: number) => {
      console.info(`[${getScriptName()}] 消息 #${message_id} 被修改`);
    },
  );

  // ── 监听 AI 消息渲染 ─────────────────────────────
  const { stop: stopRenderListener } = eventOn(
    tavern_events.CHARACTER_MESSAGE_RENDERED,
    (message_id: number) => {
      const msg = getChatMessages(message_id)[0];
      if (!msg) return;
      console.info(`[${getScriptName()}] AI 消息 #${message_id}:`, msg.mes.slice(0, 80));
    },
  );

  // ── 自定义宏 — 在提示词中使用 {{mood}} ────────────
  SillyTavern.registerMacro('mood', () => {
    const data = getAllVariables()?.stat_data ?? {};
    return _.get(data, 'alice.心情', '未知');
  }, '返回角色当前心情');

  // ── 函数工具 — AI 可调用查询物品栏 ─────────────────
  SillyTavern.registerFunctionTool({
    name: 'check_inventory',
    displayName: '查询物品栏',
    description: '查看主角当前持有的物品',
    parameters: {
      type: 'object',
      properties: {
        item_name: {
          type: 'string',
          description: '可选: 要查询的特定物品名',
        },
      },
    },
    action: async (args) => {
      const data = getAllVariables()?.stat_data ?? {};
      const inventory = _.get(data, '主角.物品栏', {});

      if (args.item_name) {
        const item = inventory[args.item_name];
        return item
          ? JSON.stringify(item)
          : `未找到物品「${args.item_name}」`;
      }
      return Object.keys(inventory).length > 0
        ? JSON.stringify(inventory)
        : '物品栏为空';
    },
  });

  // ── 立即事件注入 (基于变量条件触发世界书条目) ─────────
  injectPrompts([
    {
      id: '好感度归零事件',
      position: 'none',
      depth: 0,
      role: 'system',
      content: '【【好感度归零事件】】',
      filter: () => _.get(getAllVariables(), 'stat_data.alice.好感度') === 0,
      should_scan: true,
    },
    {
      id: '好感度满值事件',
      position: 'none',
      depth: 0,
      role: 'system',
      content: '【【好感度满值事件】】',
      filter: () => _.get(getAllVariables(), 'stat_data.alice.好感度') === 100,
      should_scan: true,
    },
  ]);

  // ── 设置界面 (挂载到酒馆扩展设置面板) ─────────────
  const app = createApp(SettingsPanel).use(createPinia());
  const $app = createScriptIdDiv().appendTo('#extensions_settings2');
  app.mount($app[0]);
  const { destroy: destroyStyles } = teleportStyle();

  // ── 卸载清理 — 务必释放所有监听器/宏/工具 ──────────
  $(window).on('pagehide', () => {
    console.info(`[${getScriptName()}] 脚本卸载中`);
    stopButtonListener();
    stopMessageListener();
    stopRenderListener();
    SillyTavern.unregisterMacro('mood');
    SillyTavern.unregisterFunctionTool('check_inventory');
    app.unmount();
    $app.remove();
    destroyStyles();
  });
});
