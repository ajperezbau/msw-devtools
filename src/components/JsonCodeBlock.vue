<template>
  <pre :style="preStyle"><code v-if="useJsonHighlight" class="code-block json"><span v-for="(token, index) in highlightedTokens" :key="index" :style="tokenStyles[token.type]">{{ token.value }}</span></code><code v-else class="code-block json" v-text="displayCode"></code></pre>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from "vue";
import { normalizeJsonCode } from "./codeBlockUtils";

type JsonTokenType =
  | "plain"
  | "punctuation"
  | "key"
  | "string"
  | "number"
  | "boolean"
  | "null";

interface JsonToken {
  type: JsonTokenType;
  value: string;
}

const JSON_HIGHLIGHT_MAX_CHARS = 200 * 1024;

const props = withDefaults(
  defineProps<{
    code: string | object | null | undefined;
    language?: string;
    maxHeight?: string;
    enableHighlight?: boolean;
  }>(),
  {
    language: "json",
    enableHighlight: true,
  },
);

const preStyle = computed<CSSProperties>(() => ({
  maxHeight: props.maxHeight,
  overflowY: props.maxHeight ? "auto" : undefined,
}));

const displayCode = computed(() => normalizeJsonCode(props.code));

const useJsonHighlight = computed(
  () =>
    props.enableHighlight &&
    displayCode.value.length > 0 &&
    displayCode.value.length <= JSON_HIGHLIGHT_MAX_CHARS,
);

const tokenStyles: Record<JsonTokenType, { color: string }> = {
  plain: { color: "var(--text-main)" },
  punctuation: { color: "var(--text-main)" },
  key: { color: "var(--method-put-text)" },
  string: { color: "var(--method-delete-text)" },
  number: { color: "var(--method-get-text)" },
  boolean: { color: "var(--method-patch-text)" },
  null: { color: "var(--method-post-text)" },
};

const highlightJson = (jsonText: string): JsonToken[] => {
  const tokens: JsonToken[] = [];
  const tokenRegex =
    /"(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\],:]/g;
  let lastIndex = 0;

  const pushPlain = (text: string) => {
    if (text) {
      tokens.push({ type: "plain", value: text });
    }
  };

  let match = tokenRegex.exec(jsonText);
  while (match) {
    const matchIndex = match.index;
    const matchedValue = match[0];

    if (matchIndex > lastIndex) {
      pushPlain(jsonText.slice(lastIndex, matchIndex));
    }

    let type: JsonTokenType = "plain";
    if (/^[{}\[\],:]$/.test(matchedValue)) {
      type = "punctuation";
    } else if (matchedValue === "true" || matchedValue === "false") {
      type = "boolean";
    } else if (matchedValue === "null") {
      type = "null";
    } else if (matchedValue.startsWith('"')) {
      const isKey = /^\s*:/.test(jsonText.slice(tokenRegex.lastIndex));
      type = isKey ? "key" : "string";
    } else {
      type = "number";
    }

    tokens.push({ type, value: matchedValue });
    lastIndex = tokenRegex.lastIndex;
    match = tokenRegex.exec(jsonText);
  }

  if (lastIndex < jsonText.length) {
    pushPlain(jsonText.slice(lastIndex));
  }

  return tokens;
};

const highlightedTokens = computed(() => {
  if (!useJsonHighlight.value) {
    return [];
  }

  return highlightJson(displayCode.value);
});
</script>

<style scoped>
pre {
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



