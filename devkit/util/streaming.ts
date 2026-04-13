/**
 * Streaming Message Renderer
 *
 * Replaces SillyTavern's native message display with custom Vue components,
 * supporting both live streaming and static rendering.
 *
 * Clean room implementation — MIT License
 */

import { inject, reactive, readonly, type App, type Reactive } from 'vue';

// ---------------------------------------------------------------------------
// Context injected into each streaming message component
// ---------------------------------------------------------------------------

export type StreamingMessageContext = {
  /** Unique prefix for this renderer instance */
  prefix: string;
  /** DOM element ID: `${prefix}-${message_id}` */
  host_id: string;
  /** Index of the message being rendered */
  message_id: number;
  /** Raw message content (updated during streaming) */
  message: string;
  /** True while the message is actively streaming */
  during_streaming: boolean;
};

/**
 * Inject the streaming message context inside a component.
 * Must be called during setup() of a component rendered by mountStreamingMessages.
 */
export function injectStreamingMessageContext(): Readonly<StreamingMessageContext> {
  return readonly(inject('streaming_message_context')!);
}

// ---------------------------------------------------------------------------
// iframe / div host helpers
// ---------------------------------------------------------------------------

function createHostIframe(prefix: string, messageId: number): JQuery<HTMLIFrameElement> {
  return $('<iframe>')
    .attr({
      id: `${prefix}-${messageId}`,
      frameborder: '0',
      style: 'width:100%;border:none;',
    })
    .addClass('w-full') as JQuery<HTMLIFrameElement>;
}

function createHostDiv(prefix: string, messageId: number): JQuery<HTMLDivElement> {
  return $('<div>')
    .attr('id', `${prefix}-${messageId}`) as JQuery<HTMLDivElement>;
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ---------------------------------------------------------------------------
// Core mount logic
// ---------------------------------------------------------------------------

interface MountOptions {
  /**
   * How to host the component:
   * - `'iframe'` (default): isolates styles, supports Tailwind
   * - `'div'`: inherits SillyTavern styles, no Tailwind
   */
  host?: 'iframe' | 'div';

  /** Only mount on messages that pass this filter */
  filter?: (message_id: number, message: string) => boolean;

  /** Unique prefix for DOM IDs (auto-generated if omitted) */
  prefix?: string;
}

interface MountedState {
  app: App;
  data: Reactive<StreamingMessageContext>;
  destroy: () => void;
}

/**
 * Mount a Vue component onto every AI message in the chat, replacing
 * the native message text display. Supports live streaming updates.
 *
 * @param creator  Factory that returns a fresh Vue App for each message.
 * @param options  Mount configuration.
 * @returns Object with `unmount()` to tear everything down.
 *
 * @example
 * ```ts
 * import App from './App.vue';
 * $(() => {
 *   const { unmount } = mountStreamingMessages(
 *     () => createApp(App).use(createPinia()),
 *   );
 *   $(window).on('pagehide', () => unmount());
 * });
 * ```
 */
export function mountStreamingMessages(
  creator: () => App,
  options: MountOptions = {},
): { unmount: () => void } {
  const { host = 'iframe', filter, prefix = generateId() } = options;

  const states: Map<number, MountedState> = new Map();
  let stopped = false;

  // Helper: check if a message ID is still in the valid range
  const isValid = (mid: number): boolean => {
    const minId = Number($('#chat > .mes').first().attr('mesid'));
    return _.inRange(mid, minId, SillyTavern.chat.length);
  };

  // Helper: destroy invalid entries
  const cleanupInvalid = () => {
    for (const mid of [...states.keys()]) {
      if (!isValid(mid)) states.get(mid)?.destroy();
    }
  };

  // Render one message
  const renderOne = async (messageId: number, streamContent?: string) => {
    if (stopped) return;
    if (!isValid(messageId)) {
      states.get(messageId)?.destroy();
      return;
    }

    const message = streamContent ?? (getChatMessages(messageId)[0]?.message ?? '');
    if (filter && !filter(messageId, message)) {
      states.get(messageId)?.destroy();
      return;
    }

    const $mesEl = $(`.mes[mesid='${messageId}']`);
    const $mesText = $mesEl.find('.mes_text').addClass('hidden!');
    $mesEl.find('.TH-streaming').addClass('hidden!');

    // If component already mounted, just update data
    const existing = states.get(messageId);
    const $existingHost = $mesEl.find(`#${prefix}-${messageId}`);
    if ($existingHost.length > 0 && existing) {
      existing.data.message = message;
      existing.data.during_streaming = Boolean(streamContent);
      return;
    }

    // Teardown old instance
    existing?.destroy();
    $existingHost.remove();

    // Create streaming container
    let $container = $mesEl.find('.mes_streaming');
    if ($container.length === 0) {
      $container = $('<div class="mes_streaming">')
        .css({
          'font-weight': '500',
          'line-height': 'calc(var(--mainFontSize) + .5rem)',
          'max-width': '100%',
          'overflow-wrap': 'anywhere',
          padding: 'calc(var(--mainFontSize) * 0.8) 0 0 0',
        })
        .insertAfter($mesText);
    }

    // Create host element
    const $host = host === 'iframe'
      ? createHostIframe(prefix, messageId)
      : createHostDiv(prefix, messageId);
    $host.appendTo($container);

    // Reactive context
    const data = reactive<StreamingMessageContext>({
      prefix,
      host_id: `${prefix}-${messageId}`,
      message_id: messageId,
      message,
      during_streaming: Boolean(streamContent),
    });

    const app = creator().provide('streaming_message_context', data);

    if (host === 'iframe') {
      ($host as JQuery<HTMLIFrameElement>).on('load', function () {
        app.mount(this.contentDocument!.body);
      });
    } else {
      app.mount($host[0]!);
    }

    // Observer: toggle visibility when user edits a message
    const observer = new MutationObserver(() => {
      const $editArea = $('#chat').find('#curEditTextarea');
      if ($editArea.parent().is($mesText)) {
        $mesText.removeClass('hidden!');
        $host.addClass('hidden!');
      } else if ($editArea.length === 0) {
        $mesText.addClass('hidden!');
        $mesEl.find('.TH-streaming').addClass('hidden!');
        $host.removeClass('hidden!');
      }
    });
    observer.observe($mesText[0] as HTMLElement, { childList: true });

    states.set(messageId, {
      app,
      data,
      destroy: () => {
        const $th = $mesEl.find('.TH-streaming');
        if ($th.length > 0) $th.removeClass('hidden!');
        else $mesText.removeClass('hidden!');

        app.unmount();
        $host.remove();
        if ($container.children().length === 0) $container.remove();
        observer.disconnect();
        states.delete(messageId);
      },
    });
  };

  // Render all visible messages
  const renderAll = async (destroyAll = false) => {
    if (stopped) return;
    if (destroyAll) states.forEach(s => s.destroy());
    else cleanupInvalid();

    await Promise.all(
      $('#chat')
        .children(".mes[is_user='false'][is_system='false']")
        .map(async (_i, node) => {
          const mid = Number($(node).attr('mesid') ?? 'NaN');
          if (!isNaN(mid)) await renderOne(mid);
        }),
    );
  };

  // Subscribe to SillyTavern events
  const disposers: Array<() => void> = [];
  const on = <T extends EventType>(event: T, fn: (...args: any[]) => void, first?: boolean) => {
    const wrapped = errorCatched(fn);
    disposers.push(
      first ? eventMakeFirst(event, wrapped).stop : eventOn(event, wrapped).stop,
    );
  };

  on('chatLoaded', () => renderAll(true));
  on(tavern_events.CHARACTER_MESSAGE_RENDERED, mid => { cleanupInvalid(); renderOne(mid); }, true);
  on(tavern_events.MESSAGE_EDITED, mid => { cleanupInvalid(); states.get(mid)?.destroy(); renderOne(mid); });
  on(tavern_events.MESSAGE_DELETED, mid => { cleanupInvalid(); states.get(mid)?.destroy(); renderOne(mid); });
  on(tavern_events.MORE_MESSAGES_LOADED, () => setTimeout(errorCatched(() => renderAll()), 1000));
  on(tavern_events.STREAM_TOKEN_RECEIVED, msg => {
    renderOne(Number($('#chat').children('.mes.last_mes').attr('mesid')), msg);
  });

  // Initial render
  renderAll();

  return {
    unmount: () => {
      states.forEach(s => s.destroy());
      disposers.forEach(d => d());
      stopped = true;
    },
  };
}
