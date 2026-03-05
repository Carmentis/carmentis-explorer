<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Hash, type VirtualBlockchain } from '@cmts-dev/carmentis-sdk/client'
import { useBlockchainStore } from '@/stores/blockchain.ts'

const route = useRoute()
const vbId = ref(route.params.vbId)
const vb = ref<VirtualBlockchain | null>(null)
const blockchainStore = useBlockchainStore()
onMounted(async () => {
    const provider = blockchainStore.getProvider
    vb.value = await provider.loadVirtualBlockchain(Hash.fromHex(vbId.value))
})
</script>

<template>
    <h3>Virtual Blockchain Details</h3>
</template>
