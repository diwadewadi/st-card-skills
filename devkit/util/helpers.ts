/**
 * Common helper utilities
 *
 * Clean room implementation — MIT License
 */

/** Generate a UUID v4 string */
export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Try to parse a string as YAML, then JSON5, then JSON with repair.
 * Returns the parsed object or throws.
 */
export function parseFlexible(content: string): any {
  // Try YAML first for most ST content
  try {
    return YAML.parse(content);
  } catch {
    // fall through
  }
  // Try JSON
  try {
    return JSON.parse(content);
  } catch {
    // fall through
  }
  throw new Error(`Cannot parse content as YAML or JSON: ${content.slice(0, 200)}...`);
}

/**
 * Clamp a number between min and max (inclusive).
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
