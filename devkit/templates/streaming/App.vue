<template>
  <SearchBar v-model="query" />

  <!-- 主体消息内容 (roleplay_options 之前) -->
  <Segment v-if="before_html" :query :html="before_html" />

  <!-- roleplay_options 区域 -->
  <template v-if="before_index !== -1">
    <!-- 如果 options 还在流式输出中, 渲染为普通分段 -->
    <Segment v-if="middle_html" :query :html="middle_html" />
    <!-- 如果已完成, 渲染为交互选择框 -->
    <Highlighter v-else :query>
      <OptionsView :message="context.message" />
    </Highlighter>
  </template>

  <!-- roleplay_options 之后的内容 -->
  <Segment v-if="after_html" :query :html="after_html" />
</template>

<script setup lang="ts">
import { injectStreamingMessageContext } from '@util/streaming';
import OptionsView from '../panel/views/OptionsView.vue';
import Segment from './components/Segment.vue';
import SearchBar from './components/SearchBar.vue';
import Highlighter from './components/Highlighter.vue';

const context = injectStreamingMessageContext();

const query = ref('');

// ── 消息分割: 提取 <roleplay_options> 前后内容 ─────────
const before_index = computed(() => {
  return context.message.lastIndexOf('<roleplay_options>');
});
const before_html = computed(() => {
  return formatAsDisplayedMessage(
    context.message.slice(0, before_index.value === -1 ? undefined : before_index.value).trim(),
    { message_id: context.message_id },
  );
});

const after_index = computed(() => {
  return context.message.lastIndexOf('</roleplay_options>');
});
const after_html = computed(() => {
  if (after_index.value === -1) return null;
  return formatAsDisplayedMessage(context.message.slice(after_index.value + 19).trim(), {
    message_id: context.message_id,
  });
});

const middle_html = computed(() => {
  if (before_index.value !== -1 && after_index.value === -1) {
    return formatAsDisplayedMessage(context.message.slice(before_index.value).trim(), {
      message_id: context.message_id,
    });
  }
  return null;
});

// ── 流式完成通知 ──────────────────────────────────
watch(
  () => context.during_streaming,
  () => {
    if (!context.during_streaming) {
      toastr.success(`第 ${context.message_id} 楼流式传输已完成`);
    }
  },
);

onMounted(() => {
  toastr.success(`成功挂载第 ${context.message_id} 条消息的流式楼层界面`);
});
</script>
