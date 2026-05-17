<script setup lang="ts">
import { computed, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null;
    size?: "sm" | "md";
  }>(),
  {
    size: "md",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const attrs = useAttrs();

const wrapperClass = computed(() => {
  const externalClass = (attrs as Record<string, unknown>).class;
  return ["msw-select-wrapper", `size-${props.size}`, externalClass];
});

const restAttrs = computed(() => {
  const { class: _class, ...rest } = attrs as Record<string, unknown>;
  return rest;
});

const onChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  emit("update:modelValue", value);
};
</script>

<template>
  <div :class="wrapperClass">
    <select
      :value="modelValue ?? ''"
      v-bind="restAttrs"
      class="msw-select-control"
      @change="onChange"
    >
      <slot />
    </select>

    <svg
      class="msw-select-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m5 7.5 5 5 5-5"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </div>
</template>

<style scoped>
.msw-select-wrapper {
  position: relative;
  width: 100%;
}

.msw-select-control {
  width: 100%;
  min-height: 2.25rem;
  box-sizing: border-box;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
  padding: 0.55rem 2.25rem 0.55rem 0.65rem;
  font: inherit;
  font-size: 0.875rem;
  line-height: 1.25;
  color: var(--text-main);
  background-color: var(--input-bg);
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s;
}

.msw-select-control:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-soft);
}

.msw-select-control:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.msw-select-icon {
  position: absolute;
  top: 50%;
  right: 0.7rem;
  width: 1rem;
  height: 1rem;
  color: var(--text-main);
  transform: translateY(-50%);
  pointer-events: none;
}

.msw-select-wrapper.is-modified .msw-select-control {
  border-color: var(--accent-color);
  font-weight: 600;
}

.size-sm .msw-select-control {
  min-height: 2rem;
  padding: 0.45rem 2rem 0.45rem 0.65rem;
  font-size: 0.8rem;
}

.size-md .msw-select-control {
  font-size: 0.875rem;
}
</style>
