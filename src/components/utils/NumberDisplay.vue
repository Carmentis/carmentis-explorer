<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
    value: Number,
})

const parts = computed(() => {
    const formatted = Intl.NumberFormat().format(props.value);
    return { formatted }
})
</script>

<template>
    <span>
        {{ parts.formatted }}
    </span>
</template>
