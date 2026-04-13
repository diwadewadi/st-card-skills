/**
 * SillyTavern Variable System — type definitions
 *
 * Based on the public TavernHelper variable API.
 *
 * MIT License
 */

// ---------------------------------------------------------------------------
// Variable option — specifies which variable store to access
// ---------------------------------------------------------------------------

interface VariableOption {
  /**
   * Which variable store to use:
   * - `'message'` — per-message variables (most common for MVU)
   * - `'chat'`    — chat-level variables
   * - `'character'` — character card variables
   * - `'global'`  — global variables
   * - `'script'`  — script-scoped variables
   */
  type?: 'message' | 'chat' | 'character' | 'global' | 'script';

  /**
   * When type is 'message', which message to target.
   * - positive number: specific message index
   * - negative number: depth from latest (-1 = latest)
   * - `'latest'`: alias for -1
   */
  message_id?: number | 'latest';

  /**
   * When type is 'script', which script to target.
   * Use `getScriptId()` inside a script to get the current ID.
   */
  script_id?: string;
}

// ---------------------------------------------------------------------------
// Variable access functions
// ---------------------------------------------------------------------------

/**
 * Get the variable store for the given option.
 * Returns a plain object where keys are variable names.
 */
declare function getVariables(option?: VariableOption): Record<string, any>;

/**
 * Alias for `getVariables({ type: 'message', message_id: -1 })`
 * Returns all variables from the latest message floor.
 */
declare function getAllVariables(): Record<string, any>;

/**
 * Update variables by applying a mutator function.
 * The mutator receives the current variables object and can modify it in place.
 */
declare function updateVariablesWith(
  mutator: (variables: Record<string, any>) => void,
  option?: VariableOption,
): void;

/**
 * Get the current message ID (valid inside a per-message iframe).
 */
declare function getCurrentMessageId(): number;
