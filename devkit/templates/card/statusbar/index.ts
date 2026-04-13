/**
 * Status bar entry point
 *
 * Renders a status bar UI at the bottom of each AI message,
 * displaying the current state of MVU variables.
 *
 * Integrated via regex: StatusPlaceHolderImpl → loads this HTML.
 *
 * Build: outputs index.html (with index.html template)
 */
import { createApp } from 'vue';
import App from './App.vue';

$(() => {
  const app = createApp(App).use(createPinia());
  app.mount('#app');
  $(window).on('pagehide', () => app.unmount());
});
