/**
 * 流式楼层界面入口
 *
 * 替换酒馆原生消息显示为自定义 Vue 组件,
 * 支持实时流式更新、搜索高亮、分段模糊揭示.
 *
 * 构建: 输出 index.js (无 index.html → JS-only 构建)
 *
 * 工作原理:
 *   1. mountStreamingMessages 挂钩酒馆消息渲染管线
 *   2. 对每条 AI 消息创建 Vue 应用并渲染 App.vue
 *   3. 流式传输期间组件接收实时 token 更新
 *   4. 传输完成后保持最终渲染
 *
 * 选项:
 *   - host: 'iframe' (默认) — 样式隔离, 支持 Tailwind
 *   - host: 'div'           — 继承酒馆样式, 不能用 Tailwind
 *   - filter: (id, msg) => bool — 过滤需要渲染的消息
 */
import { mountStreamingMessages } from '@util/streaming';
import App from './App.vue';

$(() => {
  const { unmount } = mountStreamingMessages(
    () => createApp(App),
    { host: 'div' },
  );
  $(window).on('pagehide', () => unmount());
});
