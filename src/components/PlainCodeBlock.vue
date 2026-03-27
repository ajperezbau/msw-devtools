<template>
  <pre :style="preStyle"><code class="code-block" :class="language" v-text="displayCode"></code></pre>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from "vue";
import { normalizePlainCode } from "./codeBlockUtils";

const props = withDefaults(
  defineProps<{
    code: string | object | null | undefined;
    language?: string;
    maxHeight?: string;
  }>(),
  {
    language: "text",
  },
);

const preStyle = computed<CSSProperties>(() => ({
  maxHeight: props.maxHeight,
  overflowY: props.maxHeight ? "auto" : undefined,
}));

const displayCode = computed(() => normalizePlainCode(props.code));
</script>

<style scoped>
pre {
  box-sizing: border-box;
  margin: 0;
  padding: 1rem;
  overflow-x: auto;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.8rem;
  line-height: 1.5;
  background: var(--bg-secondary);
  color: var(--text-main);
}

code {
  background: transparent !important;
  padding: 0 !important;
}
</style>


