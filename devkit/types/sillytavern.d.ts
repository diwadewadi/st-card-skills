/**
 * SillyTavern Context API — type definitions
 *
 * Declares the `SillyTavern` global object exposed via `window.SillyTavern`
 * (also known as `SillyTavern.getContext()`).
 *
 * Based on: SillyTavern/public/scripts/st-context.js (public API)
 *
 * MIT License
 */

// ---------------------------------------------------------------------------
// Data structures
// ---------------------------------------------------------------------------

declare namespace SillyTavern {
  type ChatMessage = {
    name: string;
    is_user: boolean;
    /** Whether the message is hidden from the LLM */
    is_system: boolean;
    mes: string;
    swipe_id?: number;
    swipes?: string[];
    swipe_info?: Record<string, any>[];
    extra?: Record<string, any>;
    variables?: Record<string, any>[] | { [swipe_id: number]: Record<string, any> };
  };

  type SendingMessage = {
    role: 'user' | 'assistant' | 'system';
    content:
      | string
      | Array<
          | { type: 'text'; text: string }
          | { type: 'image_url'; image_url: { url: string; detail: 'auto' | 'low' | 'high' } }
        >;
  };

  type v1CharData = {
    name: string;
    description: string;
    personality: string;
    scenario: string;
    first_mes: string;
    mes_example: string;
    creatorcomment: string;
    tags: string[];
    talkativeness: number;
    fav: boolean | string;
    create_date: string;
    data: v2CharData;
    chat: string;
    avatar: string;
    json_data: string;
    shallow?: boolean;
  };

  type v2CharData = {
    name: string;
    description: string;
    character_version: string;
    personality: string;
    scenario: string;
    first_mes: string;
    mes_example: string;
    creator_notes: string;
    tags: string[];
    system_prompt: string;
    post_history_instructions: string;
    creator: string;
    alternate_greetings: string[];
    character_book: v2WorldInfoBook;
    extensions: v2CharDataExtensions;
  };

  type v2WorldInfoBook = {
    name: string;
    entries: Record<number, v2WorldInfoEntry>;
  };

  type v2WorldInfoEntry = {
    keys: string[];
    secondary_keys: string[];
    comment: string;
    content: string;
    constant: boolean;
    selective: boolean;
    insertion_order: number;
    enabled: boolean;
    position: string;
    extensions: Record<string, any>;
    id: number;
  };

  type v2CharDataExtensions = {
    talkativeness: number;
    fav: boolean;
    world: string;
    depth_prompt: {
      depth: number;
      prompt: string;
      role: 'system' | 'user' | 'assistant';
    };
    regex_scripts: RegexScriptData[];
    [key: string]: any;
  };

  type RegexScriptData = {
    id: string;
    scriptName: string;
    findRegex: string;
    replaceString: string;
    trimStrings: string[];
    placement: number[];
    disabled: boolean;
    markdownOnly: boolean;
    promptOnly: boolean;
    runOnEdit: boolean;
    substituteRegex: number;
    minDepth: number;
    maxDepth: number;
  };

  type PopupOptions = {
    okButton?: string | boolean;
    cancelButton?: string | boolean;
    rows?: number;
    wide?: boolean;
    wider?: boolean;
    large?: boolean;
    transparent?: boolean;
    allowHorizontalScrolling?: boolean;
    allowVerticalScrolling?: boolean;
    leftAlign?: boolean;
    animation?: 'slow' | 'fast' | 'none';
    defaultResult?: number;
    customButtons?: Array<{
      text: string;
      result?: number;
      classes?: string[] | string;
      action?: () => void;
      appendAtEnd?: boolean;
    }> | string[];
    customInputs?: Array<{
      id: string;
      label: string;
      tooltip?: string;
      defaultState?: boolean;
      type?: string;
    }>;
    onClosing?: (popup: any) => Promise<boolean | void>;
    onClose?: (popup: any) => Promise<void>;
    onOpen?: (popup: any) => Promise<void>;
  };
}

// ---------------------------------------------------------------------------
// SillyTavern global context
// ---------------------------------------------------------------------------

declare const SillyTavern: {
  readonly chat: Array<SillyTavern.ChatMessage>;
  readonly characters: SillyTavern.v1CharData[];
  readonly groups: any;
  readonly name1: string;
  readonly name2: string;
  readonly characterId: string;
  readonly groupId: string;
  readonly chatId: string;
  readonly getCurrentChatId: () => string;
  readonly getRequestHeaders: () => { 'Content-Type': string; 'X-CSRF-TOKEN': string };

  // Chat management
  readonly reloadCurrentChat: () => Promise<void>;
  readonly saveChat: () => Promise<void>;
  readonly openCharacterChat: (file_name: string) => Promise<void>;
  readonly clearChat: () => Promise<void>;
  readonly printMessages: () => Promise<void>;

  // Message operations
  readonly addOneMessage: (
    mes: SillyTavern.ChatMessage,
    options?: {
      type?: 'swipe';
      insertAfter?: number;
      scroll?: true;
      insertBefore?: number;
      forceId?: number;
      showSwipes?: boolean;
    },
  ) => JQuery<HTMLElement>;
  readonly deleteLastMessage: () => Promise<void>;
  readonly sendSystemMessage: (type: string, text: string, extra?: any) => Promise<void>;
  readonly updateMessageBlock: (
    message_id: number,
    message: object,
    options?: { rerenderMessage?: boolean },
  ) => void;

  // Generation
  readonly generate: Function;
  readonly stopGeneration: () => boolean;
  readonly generateQuietPrompt: () => (
    quiet_prompt: string,
    quiet_to_loud: boolean,
    skip_wian: boolean,
    quiet_image?: string,
    quiet_name?: string,
    response_length?: number,
    force_chid?: number,
  ) => Promise<string>;

  // Token counting
  readonly getTokenCountAsync: (text: string, padding?: number) => Promise<number>;

  // Extension prompts
  readonly extensionPrompts: Record<string, {
    value: string;
    position: number;
    depth: number;
    scan: boolean;
    role: number;
    filter: () => Promise<boolean> | boolean;
  }>;
  readonly setExtensionPrompt: (
    prompt_id: string,
    content: string,
    position: -1 | 1,
    depth: number,
    scan?: boolean,
    role?: number,
    filter?: () => Promise<boolean> | boolean,
  ) => Promise<void>;

  // Metadata
  readonly chatMetadata: Record<string, any>;
  readonly updateChatMetadata: (new_values: any, reset: boolean) => void;
  readonly saveMetadata: () => Promise<void>;

  // Slash commands
  readonly SlashCommandParser: any;
  readonly SlashCommand: any;
  readonly executeSlashCommandsWithOptions: (
    text: string,
    options?: any,
  ) => Promise<{
    interrupt: boolean;
    pipe: string;
    isBreak: boolean;
    isAborted: boolean;
    isQuietlyAborted: boolean;
    abortReason: string;
    isError: boolean;
    errorMessage: string;
  }>;

  // Macros
  readonly registerMacro: (key: string, value: string | ((uid: string) => string), description?: string) => void;
  readonly unregisterMacro: (key: string) => void;
  readonly substituteParams: (
    content: string,
    name1?: string,
    name2?: string,
    original?: string,
    group?: string,
    replace_character_card?: boolean,
    additional_macro?: Record<string, any>,
  ) => Promise<void>;

  // Function tools
  readonly registerFunctionTool: (tool: {
    name: string;
    displayName: string;
    description: string;
    parameters: Record<string, any>;
    action: ((args: any) => string) | ((args: any) => Promise<string>);
    formatMessage?: (args: any) => string;
    shouldRegister?: (() => boolean) | (() => Promise<boolean>);
    stealth?: boolean;
  }) => void;
  readonly unregisterFunctionTool: (name: string) => void;

  // Popup
  readonly callGenericPopup: (
    content: JQuery<HTMLElement> | string | Element,
    type: number,
    inputValue?: string,
    popupOptions?: SillyTavern.PopupOptions,
  ) => Promise<number | string | boolean | undefined>;
  readonly POPUP_TYPE: {
    TEXT: number;
    CONFIRM: number;
    INPUT: number;
    DISPLAY: number;
    CROP: number;
  };
  readonly POPUP_RESULT: {
    AFFIRMATIVE: number;
    NEGATIVE: number;
    CANCELLED: number;
  };

  // Event system
  readonly eventSource: {
    on: typeof eventOn;
    makeLast: typeof eventMakeLast;
    makeFirst: typeof eventMakeFirst;
    removeListener: typeof eventRemoveListener;
    emit: typeof eventEmit;
    emitAndWait: typeof eventEmitAndWait;
    once: typeof eventOnce;
  };
  readonly eventTypes: typeof tavern_events;

  // World info
  readonly loadWorldInfo: (name: string) => Promise<any | null>;
  readonly saveWorldInfo: (name: string, data: any, immediately?: boolean) => Promise<void>;

  // Rendering
  readonly messageFormatting: (
    message: string,
    ch_name: string,
    is_system: boolean,
    is_user: boolean,
    message_id: number,
  ) => string;

  // Utilities
  readonly isMobile: () => boolean;
  readonly uuidv4: () => string;
  readonly humanizedDateTime: () => string;
  readonly extensionSettings: Record<string, any>;
  readonly maxContext: number;
  readonly onlineStatus: string;
  readonly mainApi: any;
};
