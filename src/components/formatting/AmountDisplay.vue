<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
    value: Number,
    decimals: {
        type: Number,
        default: 4,
    },
    unit: {
        type: String,
        default: "CMTS",
    },
})

const parts = computed(() => {
    const [integer, decimal] = props.value.toFixed(props.decimals).split('.')
    return { integer, decimal }
})
</script>

<template>
    <span>
        {{ parts.integer }}.<span class="text-sm">{{ parts.decimal }}</span>
        <span class="ml-1 text-xs text-gray-500">{{ unit }}</span>
    </span>
</template>
