/**
 * SillyTavern Event System — type definitions
 *
 * Based on the public SillyTavern event system (eventSource).
 * These are independent declarations of the public API surface.
 *
 * MIT License
 */

// ---------------------------------------------------------------------------
// Event name constants
// ---------------------------------------------------------------------------

/** All known SillyTavern event names */
declare const tavern_events: {
  readonly CHAT_CHANGED: 'chatLoaded';
  readonly CHARACTER_MESSAGE_RENDERED: 'characterMessageRendered';
  readonly USER_MESSAGE_RENDERED: 'userMessageRendered';
  readonly MESSAGE_SENT: 'messageSent';
  readonly MESSAGE_RECEIVED: 'messageReceived';
  readonly MESSAGE_SWIPED: 'messageSwiped';
  readonly MESSAGE_EDITED: 'messageEdited';
  readonly MESSAGE_DELETED: 'messageDeleted';
  readonly MESSAGE_UPDATED: 'messageUpdated';
  readonly MESSAGE_FILE_EMBEDDED: 'messageFileEmbedded';
  readonly IMPERSONATE_READY: 'impersonateReady';
  readonly GENERATION_STARTED: 'generationStarted';
  readonly GENERATION_STOPPED: 'generationStopped';
  readonly GENERATION_ENDED: 'generationEnded';
  readonly GENERATION_AFTER_COMMANDS: 'generationAfterCommands';
  readonly STREAM_TOKEN_RECEIVED: 'streamTokenReceived';
  readonly SMOOTH_STREAM_TOKEN_RECEIVED: 'smoothStreamTokenReceived';
  readonly SETTINGS_UPDATED: 'settingsUpdated';
  readonly WORLD_INFO_ACTIVATED: 'worldInfoActivated';
  readonly CHARACTER_FIRST_MESSAGE_SELECTED: 'characterFirstMessageSelected';
  readonly GROUP_CHAT_CREATED: 'groupChatCreated';
  readonly GROUP_CHAT_DELETED: 'groupChatDeleted';
  readonly GROUP_MEMBER_DRAFTED: 'groupMemberDrafted';
  readonly MORE_MESSAGES_LOADED: 'moreMessagesLoaded';
  readonly FILE_ATTACHMENT_DELETED: 'fileAttachmentDeleted';
  readonly WORLDINFO_FORCE_ACTIVATE: 'worldInfoForceActivate';
  readonly CHARACTER_DELETED: 'characterDeleted';
  readonly CHARACTER_DUPLICATED: 'characterDuplicated';
  readonly CHARACTER_PAGE_LOADED: 'characterPageLoaded';
  readonly CHARACTER_GROUP_OVERLAY_STATE_CHANGE_BEFORE: 'characterGroupOverlayStateChangeBefore';
  readonly CHARACTER_GROUP_OVERLAY_STATE_CHANGE_AFTER: 'characterGroupOverlayStateChangeAfter';
  readonly OPEN_CHARACTER_LIBRARY: 'openCharacterLibrary';
  readonly ONLINE_STATUS_CHANGED: 'onlineStatusChanged';
  readonly LLM_FUNCTION_TOOL_REGISTER: 'llmFunctionToolRegister';
};

// ---------------------------------------------------------------------------
// Event type → listener signature mapping
// ---------------------------------------------------------------------------

type EventType = (typeof tavern_events)[keyof typeof tavern_events] | string;

interface ListenerType {
  chatLoaded: (chatId: string) => void;
  characterMessageRendered: (messageId: number) => void;
  userMessageRendered: (messageId: number) => void;
  messageSent: (messageId: number) => void;
  messageReceived: (messageId: number) => void;
  messageSwiped: (messageId: number) => void;
  messageEdited: (messageId: number) => void;
  messageDeleted: (messageId: number) => void;
  messageUpdated: (messageId: number) => void;
  streamTokenReceived: (message: string) => void;
  smoothStreamTokenReceived: (data: { token: string; messageId: number }) => void;
  generationStarted: () => void;
  generationStopped: () => void;
  generationEnded: (messageId: number) => void;
  moreMessagesLoaded: () => void;
  settingsUpdated: () => void;
  [key: string]: (...args: any[]) => void;
}

// ---------------------------------------------------------------------------
// Event helper functions
// ---------------------------------------------------------------------------

interface EventOnReturn {
  stop: () => void;
}

declare function eventOn<T extends EventType>(
  event: T,
  listener: T extends keyof ListenerType ? ListenerType[T] : (...args: any[]) => void,
): EventOnReturn;

declare function eventOnce<T extends EventType>(
  event: T,
  listener: T extends keyof ListenerType ? ListenerType[T] : (...args: any[]) => void,
): EventOnReturn;

declare function eventMakeFirst<T extends EventType>(
  event: T,
  listener: T extends keyof ListenerType ? ListenerType[T] : (...args: any[]) => void,
): EventOnReturn;

declare function eventMakeLast<T extends EventType>(
  event: T,
  listener: T extends keyof ListenerType ? ListenerType[T] : (...args: any[]) => void,
): EventOnReturn;

declare function eventRemoveListener<T extends EventType>(
  event: T,
  listener: (...args: any[]) => void,
): void;

declare function eventEmit<T extends EventType>(
  event: T,
  ...args: any[]
): void;

declare function eventEmitAndWait<T extends EventType>(
  event: T,
  ...args: any[]
): Promise<void>;
