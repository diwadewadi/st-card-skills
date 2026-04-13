<template>
  <!-- Use Tailwind CSS for styling (iframe mode isolates styles) -->
  <div class="p-2">
    <p class="text-sm">Message #{{ context.message_id }}</p>
    <div v-html="context.message"></div>
    <p v-if="context.during_streaming" class="text-xs text-gray-400">Streaming...</p>
  </div>
</template>

<script setup lang="ts">
import { injectStreamingMessageContext } from '@util/streaming';

const context = injectStreamingMessageContext();
</script>
