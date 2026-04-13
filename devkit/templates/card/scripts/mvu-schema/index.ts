/**
 * MVU Schema Registration Script
 *
 * This script registers the Zod schema with the MVU framework.
 * It runs as a TavernHelper script inside SillyTavern.
 *
 * Build: outputs index.js → reference from character card's
 *        tavern_helper.scripts or via CDN URL.
 */
import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';
import { Schema } from '../../schema';

$(() => {
  registerMvuSchema(Schema);
});
