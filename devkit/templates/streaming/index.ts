/**
 * Streaming message entry point
 *
 * Replaces the native SillyTavern message display with a custom
 * Vue component for each AI message. Supports live streaming.
 *
 * Build: outputs index.js (no index.html → JS-only build)
 */
import { mountStreamingMessages } from '@util/streaming';
import App from './App.vue';

$(() => {
  const { unmount } = mountStreamingMessages(
    () => createApp(App).use(createPinia()),
    // { host: 'iframe' }  // default; use 'div' to inherit ST styles
  );
  $(window).on('pagehide', () => unmount());
});
