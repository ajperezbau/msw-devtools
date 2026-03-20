<script setup lang="ts">
import { computed, nextTick, onActivated, ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null;
    type?: string;
    variant?: "default" | "inline";
    size?: "sm" | "md";
    autofocus?: boolean;
  }>(),
  {
    type: "text",
    variant: "default",
    size: "md",
    autofocus: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const attrs = useAttrs();
const inputRef = ref<HTMLInputElement | null>(null);

const restAttrs = computed(() => {
  const { class: _class, ...rest } = attrs as Record<string, unknown>;
  return rest;
});

const inputClass = computed(() => {
  const externalClass = (attrs as Record<string, unknown>).class;
  return [
    "msw-input",
    `variant-${props.variant}`,
    `size-${props.size}`,
    externalClass,
  ];
});

const onInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  emit("update:modelValue", value);
};

const applyAutofocus = async () => {
  if (!props.autofocus) return;
  await nextTick();
  inputRef.value?.focus();
};

onActivated(() => {
  void applyAutofocus();
});
</script>

<template>
  <input
    ref="inputRef"
    :type="type"
    :value="modelValue ?? ''"
    v-bind="restAttrs"
    :class="inputClass"
    @input="onInput"
  />
</template>

<style scoped>
.msw-input {
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  color: var(--text-main);
  background-color: var(--input-bg);
  transition: all 0.2s;
}

.msw-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-soft);
}

.variant-inline {
  border: none;
  background: transparent;
  padding: 0.25rem 0;
  box-shadow: none;
}

.variant-inline:focus {
  box-shadow: none;
}

.size-sm {
  font-size: 0.8rem;
  padding: 0.45rem 0.65rem;
  border-radius: 0.5rem;
}

.size-md {
  font-size: 0.95rem;
}
</style>
