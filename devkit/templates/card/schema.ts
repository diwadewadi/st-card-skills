/**
 * Zod schema defining the character card's variable structure.
 *
 * This schema is used by MVU to:
 * 1. Validate and transform variable data from AI updates
 * 2. Provide type safety in frontend components
 * 3. Generate schema.json for documentation
 *
 * Edit this file to define your character's variable structure.
 */

export const Schema = z.object({
  // Example structure — customize for your character:
  //
  // world: z.object({
  //   time: z.string().describe('Current in-story time'),
  //   location: z.string().describe('Current location'),
  // }),
  // character_name: z.object({
  //   affection: z.coerce.number()
  //     .transform(v => _.clamp(v, 0, 100))
  //     .describe('0-100, how much they like the user'),
  //   mood: z.string().describe('Current emotional state'),
  // }),
});

export type Schema = z.output<typeof Schema>;
