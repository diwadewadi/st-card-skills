<template>
  <div class="favorability-strip">
    <span class="favorability-label">好感度</span>
    <div class="favorability-track">
      <div class="favorability-fill" :style="{ width: store.data.alice.好感度 + '%' }"></div>
    </div>
    <span class="favorability-value">{{ store.data.alice.好感度 }}%</span>
    <div class="favorability-controls">
      <button
        class="favorability-button"
        :disabled="store.data.alice.好感度 <= 0"
        type="button"
        @click="adjust(-1)"
      >
        -
      </button>
      <button
        class="favorability-button"
        :disabled="store.data.alice.好感度 >= 100"
        type="button"
        @click="adjust(1)"
      >
        +
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';

const store = useDataStore();

function adjust(delta: number) {
  store.data.alice.好感度 = store.data.alice.好感度 + delta;
}
</script>

<style lang="scss" scoped>
.favorability-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 10px;
  background: #fff;
  border-bottom: 2px dashed var(--c-granite);
}

.favorability-label,
.favorability-value {
  font-weight: bold;
  font-size: 0.9rem;
}

.favorability-track {
  flex: 1;
  max-width: 360px;
  height: 10px;
  border: 1.5px solid var(--c-granite);
  background: var(--c-mint-cream);
  position: relative;
  overflow: hidden;
}

.favorability-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: var(--c-celadon);
  border-right: 1.5px solid var(--c-granite);
  transition: width 0.25s ease;
}

.favorability-controls {
  display: flex;
  gap: 4px;
}

.favorability-button {
  width: 24px;
  height: 22px;
  padding: 0;
  border: 1.5px solid var(--c-granite);
  background: var(--c-mint-cream);
  color: var(--c-granite);
  font-family: inherit;
  font-weight: bold;
  line-height: 1;
  cursor: pointer;
  box-shadow: 2px 2px 0px rgba(60, 73, 63, 0.16);
}

.favorability-button:active:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0px rgba(60, 73, 63, 0.16);
}

.favorability-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.favorability-button:focus-visible {
  outline: 2px dashed var(--c-granite);
  outline-offset: 2px;
}
</style>
