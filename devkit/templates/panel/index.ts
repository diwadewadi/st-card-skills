/**
 * Panel entry point
 *
 * Creates a global UI panel (settings, diary, dashboard, etc.)
 * that lives in an iframe within SillyTavern.
 *
 * Build: outputs index.html (place index.html next to this file)
 */
import { createApp } from 'vue';
import App from './App.vue';

$(() => {
  const app = createApp(App).use(createPinia());
  app.mount('#app');
  $(window).on('pagehide', () => app.unmount());
});
