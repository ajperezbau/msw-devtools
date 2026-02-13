<script setup lang="ts">
import { computed, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "icon" | "ghost";
    size?: "sm" | "md";
    type?: "button" | "submit" | "reset";
  }>(),
  {
    variant: "secondary",
    size: "md",
    type: "button",
  },
);

const attrs = useAttrs();

const restAttrs = computed(() => {
  const { class: _class, ...rest } = attrs as Record<string, unknown>;
  return rest;
});

const buttonClass = computed(() => {
  const externalClass = (attrs as Record<string, unknown>).class;
  return [
    "msw-button",
    `variant-${props.variant}`,
    `size-${props.size}`,
    externalClass,
  ];
});
</script>

<template>
  <button :type="type" v-bind="restAttrs" :class="buttonClass">
    <slot />
  </button>
</template>

<style scoped>
.msw-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border-radius: 0.5rem;
  border: 1px solid transparent;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1.1;
  user-select: none;
  background: transparent;
  color: inherit;
}

.msw-button:disabled,
.msw-button[aria-disabled="true"] {
  cursor: not-allowed;
  opacity: 0.6;
}

.size-sm {
  padding: 0.35rem 0.6rem;
  font-size: 0.75rem;
}

.size-md {
  padding: 0.5rem 0.9rem;
  font-size: 0.875rem;
}

.variant-primary {
  background-color: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.variant-primary:hover:not(:disabled) {
  background-color: var(--accent-hover);
  border-color: var(--accent-hover);
}

.variant-secondary {
  background-color: var(--bg-main);
  color: var(--text-main);
  border-color: var(--border-color);
}

.variant-secondary:hover:not(:disabled) {
  background-color: var(--bg-tertiary);
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.variant-ghost {
  background: transparent;
  color: var(--text-secondary);
  border-color: transparent;
}

.variant-ghost:hover:not(:disabled) {
  background-color: var(--bg-tertiary);
  color: var(--text-main);
}

.variant-icon {
  padding: 0.5rem;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  background-color: var(--bg-main);
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.variant-icon.size-sm {
  width: 2rem;
  height: 2rem;
  padding: 0.35rem;
}

.variant-icon:hover:not(:disabled) {
  background-color: var(--bg-tertiary);
  border-color: var(--accent-color);
  color: var(--accent-color);
}
</style>
