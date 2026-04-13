/**
 * MVU (MagVarUpdate) Framework — type definitions
 *
 * Based on the public MVU API exposed at `window.Mvu`.
 *
 * MIT License
 */

declare namespace Mvu {
  /** MVU data structure stored in the variable system */
  type MvuData = {
    /** Lorebooks that have been initialized by MVU */
    initialized_lorebooks: Record<string, any[]>;
    /** The actual stat/variable data managed by MVU */
    stat_data: Record<string, any>;
    [key: string]: any;
  };

  // -----------------------------------------------------------------------
  // Command types produced by MVU message parsing
  // -----------------------------------------------------------------------

  type CommandInfo =
    | SetCommandInfo
    | InsertCommandInfo
    | DeleteCommandInfo
    | AddCommandInfo
    | MoveCommandInfo;

  type SetCommandInfo = {
    type: 'set';
    full_match: string;
    args:
      | [path: string, new_value_literal: string]
      | [path: string, expected_old_value_literal: string, new_value_literal: string];
    reason: string;
  };

  type InsertCommandInfo = {
    type: 'insert';
    full_match: string;
    args:
      | [path: string, value_literal: string]
      | [path: string, index_or_key_literal: string, value_literal: string];
    reason: string;
  };

  type DeleteCommandInfo = {
    type: 'delete';
    full_match: string;
    args: [path: string] | [path: string, index_or_key_or_value_literal: string];
    reason: string;
  };

  type AddCommandInfo = {
    type: 'add';
    full_match: string;
    args: [path: string, delta_or_toggle_literal: string];
    reason: string;
  };

  type MoveCommandInfo = {
    type: 'move';
    full_match: string;
    args: [from: string, to: string];
    reason: string;
  };
}

/**
 * MVU global object. Call `await waitGlobalInitialized('Mvu')` before using.
 */
declare const Mvu: {
  events: {
    /** Fired when variables are initialized for a new chat */
    VARIABLE_INITIALIZED: 'mag_variable_initiailized';
    /** Fired when a variable update round starts */
    VARIABLE_UPDATE_STARTED: 'mag_variable_update_started';
    /** Fired after all update commands in a message have been parsed */
    COMMAND_PARSED: 'mag_command_parsed';
    /** Fired when a variable update round ends */
    VARIABLE_UPDATE_ENDED: 'mag_variable_update_ended';
    /** Fired just before the message floor is updated with new variables */
    BEFORE_MESSAGE_UPDATE: 'mag_before_message_update';
  };

  /**
   * Get the MVU data from a variable store.
   *
   * @example
   * const data = Mvu.getMvuData({ type: 'message', message_id: -1 });
   * console.log(data.stat_data);
   */
  getMvuData: (options: VariableOption) => Mvu.MvuData;

  /**
   * Replace the entire MVU data in a variable store.
   * Prefer using event listeners (VARIABLE_UPDATE_ENDED) for reactive updates.
   */
  replaceMvuData: (mvu_data: Mvu.MvuData, options: VariableOption) => Promise<void>;

  /**
   * Parse a message containing update commands and produce updated MvuData.
   * Returns undefined if no updates were found.
   */
  parseMessage: (message: string, old_data: Mvu.MvuData) => Promise<Mvu.MvuData>;

  /** Whether SillyTavern is currently doing an extra model analysis pass */
  isDuringExtraAnalysis: () => boolean;
};

// Extend ListenerType for MVU events
interface ListenerType {
  [Mvu.events.VARIABLE_INITIALIZED]: (variables: Mvu.MvuData, swipe_id: number) => void;
  [Mvu.events.VARIABLE_UPDATE_STARTED]: (variables: Mvu.MvuData) => void;
  [Mvu.events.COMMAND_PARSED]: (
    variables: Mvu.MvuData,
    commands: Mvu.CommandInfo[],
    message_content: string,
  ) => void;
  [Mvu.events.VARIABLE_UPDATE_ENDED]: (
    variables: Mvu.MvuData,
    variables_before_update: Mvu.MvuData,
  ) => void;
  [Mvu.events.BEFORE_MESSAGE_UPDATE]: (context: {
    variables: Mvu.MvuData;
    message_content: string;
  }) => void;
}
