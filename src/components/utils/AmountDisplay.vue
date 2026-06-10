<script setup lang="ts">
import { computed } from 'vue'
import { CMTSToken } from '@cmts-dev/carmentis-sdk-core'

const props = defineProps({
    atomics: Number,
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
    const amountInCMTS = CMTSToken.createAtomic(props.atomics).getAmountAsCMTS();
    const [integer, decimal] = amountInCMTS.toFixed(props.decimals).split('.')
    return { integer, decimal }
})
</script>

<template>
    <span>
        {{ parts.integer }}.<span class="text-sm">{{ parts.decimal }}</span>
        <span class="ml-1 text-xs text-gray-500">{{ unit }}</span>
    </span>
</template>
