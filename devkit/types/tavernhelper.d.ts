/**
 * TavernHelper (酒馆助手 / JS-Slash-Runner) API — type definitions
 *
 * Declares the helper functions provided by the TavernHelper extension
 * in the script/iframe execution environment.
 *
 * Based on: https://github.com/n0vi028/JS-Slash-Runner (public API)
 *
 * MIT License
 */

// ---------------------------------------------------------------------------
// Script lifecycle
// ---------------------------------------------------------------------------

/** Get the unique ID of the currently running script */
declare function getScriptId(): string;

/** Get the display name of the currently running script */
declare function getScriptName(): string;

/** Wait for a global object to be initialized (e.g. 'Mvu') */
declare function waitGlobalInitialized(name: string): Promise<void>;

/**
 * Replace the script info panel content.
 * Supports HTML strings.
 */
declare function replaceScriptInfo(html: string): void;

// ---------------------------------------------------------------------------
// Chat message functions
// ---------------------------------------------------------------------------

/** Get chat messages by index. Returns an array of ChatMessage objects. */
declare function getChatMessages(
  ...ids: number[]
): SillyTavern.ChatMessage[];

/** Set (replace) chat messages at given indices */
declare function setChatMessages(
  messages: Record<number, Partial<SillyTavern.ChatMessage>>,
): Promise<void>;

/** Create new chat messages */
declare function createChatMessages(
  messages: Array<Partial<SillyTavern.ChatMessage>>,
): Promise<void>;

/** Delete chat messages by index */
declare function deleteChatMessages(...ids: number[]): Promise<void>;

/** Refresh a single message's display in the UI */
declare function refreshOneMessage(messageId: number): void;

// ---------------------------------------------------------------------------
// Macro-like helpers
// ---------------------------------------------------------------------------

/**
 * Substitute all macros in a string (e.g. {{user}}, {{char}}, custom macros).
 */
declare function substitudeMacros(text: string): string;

// ---------------------------------------------------------------------------
// TavernHelper version
// ---------------------------------------------------------------------------

/** Get the installed TavernHelper version string */
declare function getTavernHelperVersion(): Promise<string>;

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

/**
 * Format a raw message string as it would appear in the chat display,
 * applying all markdown rendering and regex scripts.
 */
declare function formatAsDisplayedMessage(
  message: string,
  messageId: number,
): string;

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

/**
 * Wrap a function with error catching that displays errors via toastr.
 * Returns the wrapped function.
 */
declare function errorCatched<T extends (...args: any[]) => any>(fn: T): T;

// ---------------------------------------------------------------------------
// Slash command helpers
// ---------------------------------------------------------------------------

/** Execute a slash command string and return results */
declare function executeSlash(command: string): Promise<string>;

// ---------------------------------------------------------------------------
// Generate helpers
// ---------------------------------------------------------------------------

/**
 * Generate a response from the LLM with a system prompt, without affecting chat.
 * Returns the generated text.
 */
declare function generateRaw(
  prompt: string,
  options?: {
    max_tokens?: number;
    system_prompt?: string;
  },
): Promise<string>;
