<template>
  <div class="panel-view p-4 min-w-[280px] bg-[#1a1a1e] text-[#d4d4d4]">
    <h1 class="text-[#c9a96e] text-lg font-bold mb-4 flex items-center gap-2">
      <i class="fa fa-columns" />
      面板标题
    </h1>

    <div class="bg-[#242428] border border-[#333] rounded-lg p-4">
      <p class="text-sm">这是一个面板模板示例。</p>
      <p class="text-xs text-[#888] mt-2">在此处添加你的面板内容。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 面板在酒馆主页面运行（非 iframe），所有全局变量天然可用。
// 如需 MVU 数据绑定:
//   import { defineMvuDataStore } from '@util/mvu-store';
//   const useStore = defineMvuDataStore(Schema, { type: 'message', message_id: -1 });
//   const store = useStore();
</script>
