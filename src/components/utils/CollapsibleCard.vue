<template>
    <div class="details-card" :class="{ 'is-collapsed': !isOpen }">
        <div class="card-header" @click="toggle">
            <h3>
                <slot name="title" />
            </h3>
            <button
                class="toggle-btn"
                :aria-expanded="isOpen"
                :aria-label="isOpen ? 'Collapse' : 'Expand'"
            >
                <svg
                    class="chevron"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>
        </div>

        <div class="card-body-wrapper" ref="bodyWrapper">
            <div class="card-body" ref="body">
                <slot />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
    defaultOpen: {
        type: Boolean,
        default: true,
    },
})

const isOpen = ref(props.defaultOpen)
const bodyWrapper = ref(null)
const body = ref(null)

function setHeight() {
    if (!bodyWrapper.value || !body.value) return
    if (isOpen.value) {
        bodyWrapper.value.style.maxHeight = body.value.scrollHeight + 'px'
    } else {
        bodyWrapper.value.style.maxHeight = '0px'
    }
}

function toggle() {
    isOpen.value = !isOpen.value
}

onMounted(() => {
    // Set initial height without transition on mount
    if (bodyWrapper.value) {
        bodyWrapper.value.style.transition = 'none'
        setHeight()
        // Force reflow then re-enable transition
        bodyWrapper.value.getBoundingClientRect()
        bodyWrapper.value.style.transition = ''
    }
})

watch(isOpen, () => {
    setHeight()
})
</script>

<style scoped>

/* ── Header ── */
.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    user-select: none;
}

.card-header:hover .toggle-btn {
    background: var(--btn-hover-bg, #eee);
    color: var(--btn-hover-color, #666);
}

/* ── Toggle button ── */
.toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: var(--btn-bg, #ddd);
    color: var(--btn-color, #444);
    cursor: pointer;
    flex-shrink: 0;
    transition:
        background 0.2s ease,
        color 0.2s ease;
}

/* ── Chevron animation ── */
.chevron {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: block;
}

.is-collapsed .chevron {
    transform: rotate(-90deg);
}

/* ── Collapsible body ── */
.card-body-wrapper {
    overflow: hidden;
    max-height: 9999px; /* fallback before JS kicks in */
    transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-body {
    padding: 0 1.25rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

/* Separator between header and body */
.details-card:not(.is-collapsed) .card-header {
    border-bottom: 1px solid var(--card-border, rgba(255, 255, 255, 0.08));
}
</style>
