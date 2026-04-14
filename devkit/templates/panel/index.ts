/**
 * 面板入口 — 通过酒馆助手脚本按钮触发弹窗
 *
 * 面板是一种特殊的脚本（无 index.html），构建输出 index.js (ES module)。
 * 与前端界面（状态栏等）不同，面板不在 iframe 中运行，而是直接在酒馆主页面执行，
 * 通过 callGenericPopup 弹出包含 Vue app 的 div。
 *
 * 集成方式:
 *   将构建产物 index.js 内容粘贴到酒馆助手脚本的 -content.js 中。
 *
 * 生命周期:
 *   - $(() => { ... }) 注册按钮事件
 *   - 点击按钮时创建 Vue app 并挂载到 popup 容器
 *   - $(window).on('pagehide', ...) 清理
 */
import { createMemoryHistory, createRouter } from 'vue-router';
import App from './App.vue';
import MainView from './views/MainView.vue';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: MainView }],
});

function openPanel() {
  const container = $('<div>').css({ minHeight: '200px' });
  const app = createApp(App).use(router).use(createPinia());

  SillyTavern.callGenericPopup(container, SillyTavern.POPUP_TYPE.TEXT, '', {
    wide: true,
    allowVerticalScrolling: true,
    okButton: '关闭',
  });

  app.mount(container[0]);
  $(window).on('pagehide', () => app.unmount());
}

$(() => {
  eventOn(getButtonEvent('面板'), openPanel);
});
