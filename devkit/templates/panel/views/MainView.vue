<template>
  <div class="main-view">
    <div class="clickdiv" tabindex="1" @click="$router.push('/options')">
      <span class="message-content">{{ display_text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const display_text = ref('');

function captureDisplayText() {
  // 通过 substitudeMacros 解析酒馆宏
  const character_name = substitudeMacros('{{char}}');
  // 通过 getCurrentMessageId 获取界面所在楼层号
  const message_id = getCurrentMessageId();
  // 通过 getChatMessages 获取楼层内容
  const chat_message = getChatMessages(message_id)[0];
  // 从消息中通过正则提取对话内容
  const dialogue = chat_message?.message?.match(/\[查看日记[:：]\s*(.+)\]/)?.[1] ?? '点击查看选项';

  display_text.value = `${character_name}: ${dialogue}`;
}

onMounted(() => {
  captureDisplayText();
});
</script>

<style lang="scss" scoped>
.main-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100px;
  padding: 10px;
}

.message-content {
  font-size: 14px;
  line-height: 1.4;
  letter-spacing: 0.7px;
  color: #7d6b6e;
  font-weight: bold;
  text-shadow: 0px 1px 1px rgba(255, 255, 255, 0.5);
}

.clickdiv {
  position: relative;
  margin: 10px;
  max-width: 150px;
  padding: 0.8em 1.2em;
  background: linear-gradient(135deg, rgba(255, 235, 240, 0.62), rgba(255, 202, 215, 0.62));
  border-radius: 16px;
  cursor: pointer;
  outline: none;
  border: 1px solid rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 12px rgba(145, 125, 138, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.4) inset,
    0 -3px 3px rgba(255, 255, 255, 0.25) inset;
  backdrop-filter: blur(13px);
  transition: all 0.3s ease;
  overflow: hidden;

  &:after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 65%);
    opacity: 0.4;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 6px 15px rgba(145, 125, 138, 0.2),
      0 0 0 1px rgba(255, 255, 255, 0.5) inset,
      0 -3px 3px rgba(255, 255, 255, 0.35) inset;
    background: linear-gradient(135deg, rgba(255, 235, 240, 0.7), rgba(255, 202, 215, 0.7));
  }

  &:active {
    transform: translateY(0);
    box-shadow:
      0 2px 8px rgba(145, 125, 138, 0.15),
      0 0 0 1px rgba(255, 255, 255, 0.4) inset;
  }

  @media (max-width: 999px) {
    padding: 0.7em 1em;
    font-size: 13px;
    max-width: 240px;
  }
}
</style>
