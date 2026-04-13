<template>
  <div class="p-3 text-sm">
    <!-- Status bar UI — displayed after each AI message -->
    <!-- Access MVU data via the store -->
    <div class="flex items-center gap-2 mb-2">
      <span class="font-bold">Status</span>
    </div>

    <!-- Example: display a variable -->
    <!-- <div>Mood: {{ store.data.character_name?.mood ?? '—' }}</div> -->
    <!-- <div>Affection: {{ store.data.character_name?.affection ?? 0 }}/100</div> -->
  </div>
</template>

<script setup lang="ts">
import { defineMvuDataStore } from '@util/mvu-store';
import { Schema } from '../../schema';

const useStatStore = defineMvuDataStore(Schema, { type: 'message', message_id: -1 });
const store = useStatStore();
</script>

<style scoped>
/* Tailwind classes are available in iframe mode */
</style>
