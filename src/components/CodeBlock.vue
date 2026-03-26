<template>
  <div class="code-block-wrapper">
    <div class="code-header" v-if="$slots.header || label">
      <span v-if="label" class="code-label">{{ label }}</span>
      <slot name="header"></slot>
      <div v-if="copyButton" class="code-actions">
        <button
          type="button"
          class="copy-btn"
          @click="copyContent"
          :class="{ copied: isCopied }"
          title="Copy content"
        >
          {{ isCopied ? "Copied!" : "Copy" }}
        </button>
      </div>
    </div>
    <component
      :is="rendererComponent"
      :code="props.code"
      :language="props.language"
      :max-height="props.maxHeight"
      :enable-highlight="props.enableHighlight"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import JsonCodeBlock from "./JsonCodeBlock.vue";
import PlainCodeBlock from "./PlainCodeBlock.vue";
import { normalizeCodeForLanguage } from "./codeBlockUtils";

const props = withDefaults(
  defineProps<{
    code: string | object | null | undefined;
    language?: string;
    label?: string;
    copyButton?: boolean;
    maxHeight?: string;
    enableHighlight?: boolean;
  }>(),
  {
    language: "json",
    copyButton: true,
    enableHighlight: true,
  },
);

const isCopied = ref(false);

const rendererComponent = computed(() =>
  props.language === "json" ? JsonCodeBlock : PlainCodeBlock,
);

const normalizedCopyText = computed(() =>
  normalizeCodeForLanguage(props.code, props.language),
);

const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(normalizedCopyText.value);
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  } catch (err) {
    console.error("Failed to copy", err);
  }
};
</script>

<style scoped>
.code-block-wrapper {
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  margin: 0;
  display: block;
  width: 100%;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-tertiary);
}

.code-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.code-actions {
  margin-left: auto;
}

.copy-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-tertiary);
  border-radius: 4px;
  padding: 0.2rem 0.6rem;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
}

.copy-btn:hover {
  background: var(--bg-main);
  color: var(--text-main);
  border-color: var(--text-secondary);
}

.copy-btn.copied {
  background: #10b981;
  color: white;
  border-color: #10b981;
}
</style>
