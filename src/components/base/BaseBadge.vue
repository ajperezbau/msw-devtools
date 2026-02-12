<template>
  <span :class="badgeClasses">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  variant?: "method" | "custom" | "native" | "status";
  method?: "get" | "post" | "put" | "patch" | "delete" | "all";
  mini?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "method",
  mini: false,
});

const badgeClasses = computed(() => {
  const classes = [];

  switch (props.variant) {
    case "method":
      classes.push("method-badge");
      if (props.method) {
        classes.push(props.method.toLowerCase());
      }
      break;
    case "custom":
      classes.push("custom-badge");
      break;
    case "native":
      classes.push("native-badge");
      break;
    case "status":
      classes.push("status-badge");
      break;
  }

  if (props.mini) {
    classes.push("mini");
  }

  return classes;
});
</script>

<style scoped>
.method-badge {
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  text-transform: uppercase;
  display: inline-block;
}

.method-badge.mini {
  font-size: 0.6rem;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  min-width: 32px;
  flex-shrink: 0;
}

:global(.theme-light) .method-badge.get {
  background-color: #dcfce7;
  color: #166534;
}
:global(.theme-light) .method-badge.post {
  background-color: #fef9c3;
  color: #854d0e;
}
:global(.theme-light) .method-badge.put {
  background-color: #dbeafe;
  color: #1e40af;
}
:global(.theme-light) .method-badge.patch {
  background-color: #f3e8ff;
  color: #6b21a8;
}
:global(.theme-light) .method-badge.delete {
  background-color: #fee2e2;
  color: #991b1b;
}

:global(.theme-dark) .method-badge.get {
  background-color: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}
:global(.theme-dark) .method-badge.post {
  background-color: rgba(234, 179, 8, 0.2);
  color: #facc15;
}
:global(.theme-dark) .method-badge.put {
  background-color: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}
:global(.theme-dark) .method-badge.patch {
  background-color: rgba(168, 85, 247, 0.2);
  color: #c084fc;
}
:global(.theme-dark) .method-badge.delete {
  background-color: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.custom-badge {
  background-color: var(--accent-soft);
  color: var(--accent-color);
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.native-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  background-color: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.native-badge.mini {
  font-size: 0.6rem;
  padding: 0.1rem 0.3rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 800;
}
</style>
