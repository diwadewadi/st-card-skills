/**
 * Script entry point
 *
 * A pure-logic script with no UI. Use this for:
 * - Event listeners (message sent/received, chat changed, etc.)
 * - Custom slash commands
 * - Custom macros ({{my_macro}})
 * - Function tools (AI-callable functions)
 * - Message post-processing
 *
 * Build: outputs index.js
 */

$(() => {
  console.log(`[${getScriptName()}] Script loaded`);

  // Example: listen for new AI messages
  // eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, (messageId) => {
  //   console.log('New AI message:', messageId);
  // });

  // Example: register a custom macro
  // SillyTavern.registerMacro('my_macro', (uid) => {
  //   return 'Hello from my macro!';
  // });

  // Example: register a function tool
  // SillyTavern.registerFunctionTool({
  //   name: 'my_tool',
  //   displayName: 'My Tool',
  //   description: 'Does something useful',
  //   parameters: { type: 'object', properties: {} },
  //   action: async (args) => 'Tool result',
  // });
});

// Cleanup on unload
$(window).on('pagehide', () => {
  console.log(`[${getScriptName()}] Script unloading`);
});
