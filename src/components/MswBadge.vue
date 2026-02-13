<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    variant: "method" | "status" | "native";
    label: string;
    size?: "sm" | "md";
  }>(),
  {
    size: "md",
  },
);

const isErrorStatus = computed(() => {
  if (props.variant !== "status") return false;
  const value = Number(props.label);
  return Number.isFinite(value) && value >= 400;
});

const methodClass = computed(() => {
  if (props.variant !== "method") return null;
  return `method-${props.label.toLowerCase()}`;
});

const badgeClass = computed(() => [
  "msw-badge",
  `variant-${props.variant}`,
  `size-${props.size}`,
  methodClass.value,
  props.variant === "method" ? "method-badge" : null,
  isErrorStatus.value ? "is-error" : null,
]);

const badgeAttrs = computed(() => {
  const attrs: Record<string, string> = {};
  if (props.variant === "method") {
    attrs.role = "status";
    attrs["aria-label"] = String(props.label);
  }
  if (props.variant === "status") {
    attrs["aria-label"] = String(props.label);
  }
  return attrs;
});
</script>

<template>
  <span :class="badgeClass" v-bind="badgeAttrs">{{ label }}</span>
</template>

<style scoped>
.msw-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  border: 1px solid transparent;
  font-weight: 700;
  line-height: 1.1;
  white-space: nowrap;
}

.size-sm {
  font-size: 0.6rem;
  padding: 0.1rem 0.3rem;
}

.size-md {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.variant-method {
  text-transform: uppercase;
  font-weight: 800;
}

.variant-status {
  min-width: 35px;
}

.variant-native {
  text-transform: uppercase;
  letter-spacing: 0.025em;
  background-color: var(--bg-tertiary);
  color: var(--text-tertiary);
  border-color: var(--border-color);
}

.variant-status {
  background-color: #dcfce7;
  color: #166534;
}

:global(.theme-dark) .msw-badge.variant-status {
  background-color: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.variant-status.is-error {
  background-color: #fee2e2;
  color: #991b1b;
}

:global(.theme-dark) .msw-badge.variant-status.is-error {
  background-color: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.msw-badge.variant-method.method-get {
  background-color: var(--method-get-bg);
  color: var(--method-get-text);
  border-color: var(--method-get-border);
}

.msw-badge.variant-method.method-post {
  background-color: var(--method-post-bg);
  color: var(--method-post-text);
  border-color: var(--method-post-border);
}

.msw-badge.variant-method.method-put {
  background-color: var(--method-put-bg);
  color: var(--method-put-text);
  border-color: var(--method-put-border);
}

.msw-badge.variant-method.method-patch {
  background-color: var(--method-patch-bg);
  color: var(--method-patch-text);
  border-color: var(--method-patch-border);
}

.msw-badge.variant-method.method-delete {
  background-color: var(--method-delete-bg);
  color: var(--method-delete-text);
  border-color: var(--method-delete-border);
}
</style>
