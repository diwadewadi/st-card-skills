/**
 * MVU Pinia Store Helper
 *
 * Creates a Pinia store that bidirectionally syncs with SillyTavern's
 * MVU variable system. Changes in the store are written back to ST,
 * and external changes (from AI variable updates) are pulled in.
 *
 * Clean room implementation — MIT License
 */

import { ref, type Ref } from 'vue';
import { defineStore, type StoreDefinition } from 'pinia';
import { useIntervalFn, watchIgnorable } from '@vueuse/core';
import { z } from 'zod';

/**
 * Create a Pinia store definition that stays in sync with MVU stat_data.
 *
 * The store polls the variable system every 2 seconds to pick up changes
 * from AI variable updates (via MVU), and writes back immediately when
 * the reactive `data` ref is mutated locally.
 *
 * @param schema  A Zod schema defining the variable structure.
 *                Used for parsing, validation, and default values.
 * @param varOpt  Specifies which variable store to bind to.
 *                Typically `{ type: 'message', message_id: -1 }`.
 * @param setup   Optional callback for additional reactive setup.
 *
 * @example
 * ```ts
 * import { Schema } from './schema';
 * const useStatStore = defineMvuDataStore(Schema, { type: 'message', message_id: -1 });
 * // In a component:
 * const store = useStatStore();
 * console.log(store.data.character.mood);
 * ```
 */
export function defineMvuDataStore<T extends z.ZodObject<any>>(
  schema: T,
  varOpt: VariableOption,
  setup?: (data: Ref<z.infer<T>>) => void,
): StoreDefinition {
  // Normalise 'latest' to -1 for consistent store keying
  if (varOpt.type === 'message' && (varOpt.message_id === undefined || varOpt.message_id === 'latest')) {
    varOpt.message_id = -1;
  }

  // Build a deterministic store ID from the option
  const storeId = `mvu_data.${Object.entries(varOpt)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)
    .join('.')}`;

  return defineStore(storeId, errorCatched(() => {
    // Initial parse from current variable state
    const current = _.get(getVariables(varOpt), 'stat_data', {});
    const data = ref(schema.parse(current)) as Ref<z.infer<T>>;

    if (setup) {
      setup(data);
    }

    // Pull: poll external changes every 2 seconds
    useIntervalFn(() => {
      const raw = _.get(getVariables(varOpt), 'stat_data', {});
      const result = schema.safeParse(raw);
      if (!result.success) return;

      if (!_.isEqual(data.value, result.data)) {
        ignoreUpdates(() => {
          data.value = result.data;
        });
        // If schema transformed the data, write back the canonical form
        if (!_.isEqual(raw, result.data)) {
          updateVariablesWith(
            vars => _.set(vars, 'stat_data', result.data),
            varOpt,
          );
        }
      }
    }, 2000);

    // Push: write local changes back to ST immediately
    const { ignoreUpdates } = watchIgnorable(
      data,
      newData => {
        const result = schema.safeParse(newData);
        if (!result.success) return;

        // Auto-correct if schema transforms differ
        if (!_.isEqual(newData, result.data)) {
          ignoreUpdates(() => {
            data.value = result.data;
          });
        }
        updateVariablesWith(
          vars => _.set(vars, 'stat_data', result.data),
          varOpt,
        );
      },
      { deep: true },
    );

    return { data };
  }));
}
