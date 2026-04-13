/**
 * Global ambient declarations for the SillyTavern iframe/script environment.
 *
 * These globals are available in all TavernHelper scripts and iframes.
 *
 * MIT License
 */

// jQuery is loaded globally in the ST environment
declare const $: JQueryStatic;

// lodash is loaded globally
declare const _: typeof import('lodash');

// YAML parser is globally available
declare const YAML: {
  parse(input: string, options?: any): any;
  parseDocument(input: string, options?: any): any;
  stringify(value: any, options?: any): string;
};

// Zod is globally available
declare const z: typeof import('zod').z;

// toastr is globally available
declare const toastr: {
  success(message: string, title?: string, options?: any): void;
  error(message: string, title?: string, options?: any): void;
  warning(message: string, title?: string, options?: any): void;
  info(message: string, title?: string, options?: any): void;
};
