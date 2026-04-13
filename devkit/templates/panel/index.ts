/**
 * 前端界面入口
 *
 * 创建一个带路由的 Vue 应用, 嵌入酒馆消息的 iframe 中.
 * 支持多页面切换 (如日记 ↔ 选择框 等).
 *
 * 构建: 输出 index.html (需要 index.html 模板)
 *
 * 生命周期:
 *   - $(() => { ... }) 初始化
 *   - $(window).on('pagehide', ...) 清理
 */
import { createMemoryHistory, createRouter } from 'vue-router';
import App from './App.vue';
import MainView from './views/MainView.vue';
import OptionsView from './views/OptionsView.vue';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: MainView },
    {
      path: '/options',
      component: OptionsView,
      props: { message: getChatMessages(getCurrentMessageId())[0]?.message ?? '' },
    },
  ],
});

$(() => {
  const app = createApp(App).use(router).use(createPinia());
  app.mount('#app');

  $(window).on('pagehide', () => app.unmount());
});
