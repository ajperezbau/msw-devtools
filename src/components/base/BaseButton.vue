<template>
  <button
    :type="type"
    :class="buttonClasses"
    :disabled="disabled"
    :title="title"
    :aria-label="ariaLabel"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  variant?: "primary" | "secondary" | "icon" | "tab" | "text" | "mini-icon";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  active?: boolean;
  title?: string;
  ariaLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  type: "button",
  disabled: false,
  active: false,
});

defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();

const buttonClasses = computed(() => {
  const classes = [];

  switch (props.variant) {
    case "primary":
      classes.push("base-button", "primary-button");
      break;
    case "secondary":
      classes.push("base-button", "secondary-button");
      break;
    case "icon":
      classes.push("icon-button");
      break;
    case "tab":
      classes.push("tab-button");
      if (props.active) {
        classes.push("active");
      }
      break;
    case "text":
      classes.push("text-button");
      break;
    case "mini-icon":
      classes.push("mini-icon-button");
      break;
  }

  return classes;
});
</script>

<style scoped>
.base-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.base-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary-button {
  background-color: var(--accent-color);
  color: white;
}

.primary-button:hover:not(:disabled) {
  background-color: var(--accent-hover);
}

.secondary-button {
  background-color: var(--bg-main);
  color: var(--text-main);
  border: 1px solid var(--border-color);
}

.secondary-button:hover:not(:disabled) {
  background-color: var(--bg-tertiary);
}

.icon-button {
  color: var(--text-tertiary);
  padding: 0.4rem;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-button:hover:not(:disabled) {
  background-color: var(--bg-tertiary);
  color: var(--text-main);
}

.tab-button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button:hover:not(:disabled) {
  background-color: var(--bg-secondary);
  color: var(--text-main);
}

.tab-button.active {
  background-color: var(--bg-main);
  color: var(--accent-color);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.text-button {
  background: none;
  border: none;
  color: var(--accent-color);
  font-weight: 600;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  text-decoration: none;
  transition: opacity 0.2s;
}

.text-button:hover:not(:disabled) {
  opacity: 0.8;
}

.mini-icon-button {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0.15rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.mini-icon-button:hover:not(:disabled) {
  background-color: var(--bg-tertiary);
  color: var(--text-main);
}
</style>
