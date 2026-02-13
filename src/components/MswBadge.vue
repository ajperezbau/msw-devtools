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
  isErrorStatus.value ? "is-error" : null,
]);
</script>

<template>
  <span :class="badgeClass">{{ label }}</span>
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

:global(.theme-light) .msw-badge.variant-method.method-get,
.msw-badge.variant-method.method-get {
  background-color: #dcfce7;
  color: #166534;
}

:global(.theme-dark) .msw-badge.variant-method.method-get {
  background-color: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

:global(.theme-light) .msw-badge.variant-method.method-post,
.msw-badge.variant-method.method-post {
  background-color: #fef9c3;
  color: #854d0e;
}

:global(.theme-dark) .msw-badge.variant-method.method-post {
  background-color: rgba(234, 179, 8, 0.2);
  color: #facc15;
}

:global(.theme-light) .msw-badge.variant-method.method-put,
.msw-badge.variant-method.method-put {
  background-color: #dbeafe;
  color: #1e40af;
}

:global(.theme-dark) .msw-badge.variant-method.method-put {
  background-color: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

:global(.theme-light) .msw-badge.variant-method.method-patch,
.msw-badge.variant-method.method-patch {
  background-color: #f3e8ff;
  color: #6b21a8;
}

:global(.theme-dark) .msw-badge.variant-method.method-patch {
  background-color: rgba(168, 85, 247, 0.2);
  color: #c084fc;
}

:global(.theme-light) .msw-badge.variant-method.method-delete,
.msw-badge.variant-method.method-delete {
  background-color: #fee2e2;
  color: #991b1b;
}

:global(.theme-dark) .msw-badge.variant-method.method-delete {
  background-color: rgba(239, 68, 68, 0.2);
  color: #f87171;
}
</style>
