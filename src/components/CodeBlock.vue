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
    <pre><code :class="language">{{ displayCode }}</code></pre>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";


const props = withDefaults(
  defineProps<{
    code: string | object | null | undefined;
    language?: string;
    label?: string;
    copyButton?: boolean;
  }>(),
  {
    language: "json",
    copyButton: true,
  },
);

const isCopied = ref(false);
const displayCode = ref(""); 

const updateCodeDisplay = () => {
    let rawCode = "";
    
    if (props.code === undefined || props.code === null) {
        displayCode.value = "";
        return;
    }

    if (typeof props.code === "string") {
        try {
             if (props.language === "json") {
                 const parsed = JSON.parse(props.code);
                 rawCode = JSON.stringify(parsed, null, 2);
             } else {
                 rawCode = props.code;
             }
        } catch {
            rawCode = props.code;
        }
    } else {
        rawCode = JSON.stringify(props.code, null, 2);
    }
    
    displayCode.value = rawCode;
};

onMounted(() => {
  updateCodeDisplay();
});

watch(() => [props.code, props.language], () => {
  updateCodeDisplay();
});



const copyContent = async () => {
  try {
    let textToCopy = "";
    if (typeof props.code === "object") {
        textToCopy = JSON.stringify(props.code, null, 2);
    } else {
         try {
             if (props.language === 'json') {
                 textToCopy = JSON.stringify(JSON.parse(props.code || ""), null, 2);
             } else {
                 textToCopy = props.code || "";
             }
         } catch {
             textToCopy = props.code || "";
         }
    }

    await navigator.clipboard.writeText(textToCopy);
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

