<template>
  <div class="example-extension-settings">
    <div class="inline-drawer">
      <div class="inline-drawer-toggle inline-drawer-header">
        <b>{{ `脚本示例设置` }}</b>
        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
      </div>
      <div class="inline-drawer-content">
        <!-- 示例按钮 -->
        <div class="example-extension_block flex-container">
          <input class="menu_button" type="submit" :value="`测试按钮`" @click="handleClick" />
        </div>

        <!-- 示例开关 -->
        <div class="example-extension_block flex-container">
          <input v-model="settings.enabled" type="checkbox" />
          <label>{{ `启用功能` }}</label>
        </div>

        <!-- 示例文本输入 -->
        <div class="example-extension_block flex-container">
          <label>{{ `自定义问候语` }}</label>
          <input
            v-model="settings.greeting"
            type="text"
            class="text_pole"
            placeholder="输入问候语..."
          />
        </div>

        <!-- 示例数字滑块 -->
        <div class="example-extension_block flex-container">
          <label>{{ `最大消息数: ${settings.max_messages}` }}</label>
          <input
            v-model.number="settings.max_messages"
            type="range"
            min="1"
            max="50"
          />
        </div>

        <hr class="sysHR" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useSettingsStore } from './settings';

const { settings } = storeToRefs(useSettingsStore());

const handleClick = () => {
  toastr.success(settings.value.greeting);
};
</script>

<style scoped></style>
