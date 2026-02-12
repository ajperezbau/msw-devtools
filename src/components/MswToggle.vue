<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const position = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const hasMoved = ref(false);

const startDrag = (e: MouseEvent | TouchEvent) => {
  isDragging.value = true;
  hasMoved.value = false;

  let clientX: number;
  let clientY: number;

  if ("touches" in e) {
    const touch = e.touches[0];
    if (!touch) return;
    clientX = touch.clientX;
    clientY = touch.clientY;
  } else {
    clientX = (e as MouseEvent).clientX;
    clientY = (e as MouseEvent).clientY;
  }

  dragStart.value = {
    x: clientX - position.value.x,
    y: clientY - position.value.y,
  };

  window.addEventListener("mousemove", onDrag);
  window.addEventListener("mouseup", endDrag);
  window.addEventListener("touchmove", onDrag, { passive: false });
  window.addEventListener("touchend", endDrag);
};

const onDrag = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return;

  let clientX: number;
  let clientY: number;

  if ("touches" in e) {
    const touch = e.touches[0];
    if (!touch) return;
    clientX = touch.clientX;
    clientY = touch.clientY;
  } else {
    clientX = (e as MouseEvent).clientX;
    clientY = (e as MouseEvent).clientY;
  }

  const newX = clientX - dragStart.value.x;
  const newY = clientY - dragStart.value.y;

  // Small threshold to avoid accidental drags when clicking
  if (
    !hasMoved.value &&
    Math.abs(newX - position.value.x) < 5 &&
    Math.abs(newY - position.value.y) < 5
  ) {
    return;
  }

  hasMoved.value = true;

  // Constrain position to viewport
  const padding = 10;
  const buttonSize = 60; // Approximate size of the button
  position.value = {
    x: Math.max(
      padding,
      Math.min(window.innerWidth - buttonSize - padding, newX),
    ),
    y: Math.max(
      padding,
      Math.min(window.innerHeight - buttonSize - padding, newY),
    ),
  };
};

const endDrag = () => {
  if (isDragging.value) {
    isDragging.value = false;
    localStorage.setItem("msw-devtools-x", String(position.value.x));
    localStorage.setItem("msw-devtools-y", String(position.value.y));
  }

  window.removeEventListener("mousemove", onDrag);
  window.removeEventListener("mouseup", endDrag);
  window.removeEventListener("touchmove", onDrag);
  window.removeEventListener("touchend", endDrag);
};

const toggleDevtools = () => {
  if (!hasMoved.value) {
    emit("update:modelValue", !props.modelValue);
  }
};

const handleResize = () => {
  const padding = 10;
  const buttonSize = 60;
  position.value = {
    x: Math.max(
      padding,
      Math.min(window.innerWidth - buttonSize - padding, position.value.x),
    ),
    y: Math.max(
      padding,
      Math.min(window.innerHeight - buttonSize - padding, position.value.y),
    ),
  };
};

onMounted(() => {
  const savedX = localStorage.getItem("msw-devtools-x");
  const savedY = localStorage.getItem("msw-devtools-y");

  if (savedX !== null && savedY !== null) {
    position.value = { x: Number(savedX), y: Number(savedY) };
  } else {
    position.value = {
      x: window.innerWidth - 80,
      y: window.innerHeight - 80,
    };
  }

  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  // Clean up drag events just in case
  window.removeEventListener("mousemove", onDrag);
  window.removeEventListener("mouseup", endDrag);
  window.removeEventListener("touchmove", onDrag);
  window.removeEventListener("touchend", endDrag);
});
</script>

<template>
  <div
    class="scenario-selector-overlay"
    :style="{
      left: position.x + 'px',
      top: position.y + 'px',
      bottom: 'auto',
      right: 'auto',
    }"
  >
    <button
      type="button"
      @mousedown="startDrag"
      @touchstart="startDrag"
      @click="toggleDevtools"
      class="toggle-button"
      title="MSW Devtools (Ctrl + Shift + M)"
      aria-label="Toggle MSW DevTools"
      :class="{ 'is-dragging': isDragging }"
    >
      <svg
        class="msw-logo-svg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 128 128"
      >
        <g fill="none" fill-rule="nonzero">
          <rect width="128" height="128" fill="#000" rx="24"></rect>
          <path
            fill="#7A1818"
            d="M25.52 45.538a19.62 19.62 0 0 1 7.165-13.23 19.62 19.62 0 0 1 14.423-4.289 19.66 19.66 0 0 1 12.574 6.399l33.9 37.648a19.62 19.62 0 0 1 5.022 14.184 19.62 19.62 0 0 1-6.478 13.58 19.66 19.66 0 0 1-13.174 5.05L33 104.832a12.3 12.3 0 0 1-8.705-3.615 12.3 12.3 0 0 1-3.598-8.712v-.46zm18.508.746c-.346.28-.558.665-.605 1.113l-4.09 39.442 39.637.04c.36 0 .708-.115.993-.328l.119-.097c.337-.304.523-.701.547-1.146.023-.445-.12-.86-.424-1.197l-33.9-37.649a1.66 1.66 0 0 0-1.06-.54 1.63 1.63 0 0 0-1.217.362"
          ></path>
          <path
            fill="#FF6A33"
            d="m32.53 23.103 62.47.065a12.3 12.3 0 0 1 8.705 3.616 12.3 12.3 0 0 1 3.598 8.711v.461l-.048.459-6.484 62.477a12.3 12.3 0 0 1-4.49 8.287 12.315 12.315 0 0 1-16.912-1.322L23.367 43.66a12.3 12.3 0 0 1-3.146-8.885 12.315 12.315 0 0 1 12.31-11.67m12.767 18.012 38.89 43.192 4.478-43.147z"
          ></path>
        </g>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.scenario-selector-overlay {
  position: fixed;
  z-index: 10000;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  user-select: none;
}

.toggle-button {
  background-color: #000;
  padding: 6px;
  border-radius: 12px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.4),
    0 2px 4px -1px rgba(0, 0, 0, 0.2);
  border: 1px solid #27272a;
  cursor: move;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  width: 48px;
  height: 48px;
  overflow: hidden;
}

.msw-logo-svg {
  width: 100%;
  height: 100%;
}

.toggle-button.is-dragging {
  cursor: grabbing;
  transform: scale(1.1);
  opacity: 1;
  border-color: #ff6a33;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.5),
    0 10px 10px -5px rgba(0, 0, 0, 0.3);
}

.toggle-button:hover {
  border-color: #ff6a33;
  transform: scale(1.08) translateY(-2px);
  box-shadow:
    0 12px 20px -5px rgba(0, 0, 0, 0.5),
    0 4px 6px -2px rgba(0, 0, 0, 0.3);
}

.toggle-button:active {
  transform: scale(0.95);
}
</style>
