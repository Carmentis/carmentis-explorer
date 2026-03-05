<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
    Hash,
    type VirtualBlockchain,
    VirtualBlockchainLabel,
} from '@cmts-dev/carmentis-sdk/client'
import { useBlockchainStore } from '@/stores/blockchain.ts'
import ProgressSpinner from 'primevue/progressspinner'

interface VirtualBlockchainData {
    identifier: string
    height: number
    type: number
    expirationDay: number
    microblockHashes: string[]
}

const route = useRoute()
const router = useRouter()
const vbId = ref(route.params.vbId as string)
const vb = ref<VirtualBlockchain | null>(null)
const vbData = ref<VirtualBlockchainData | null>(null)
const loading = ref(true)
const blockchainStore = useBlockchainStore()

const formatDate = (dayNumber: number): string => {
    if (dayNumber === 0) return 'No expiration'
    // Assuming day 0 is epoch start (1970-01-01)
    const date = new Date(dayNumber * 24 * 60 * 60 * 1000)
    return date.toLocaleDateString()
}

const navigateToMicroblock = (mbHash: string) => {
    router.push(`/vb/${vbId.value}/mb/${mbHash}`)
}

onMounted(async () => {
    try {
        const provider = blockchainStore.getProvider
        vb.value = await provider.loadVirtualBlockchain(Hash.fromHex(vbId.value as string))

        vbData.value = {
            identifier: vb.value.getIdentifier().encode(),
            height: vb.value.getHeight(),
            type: vb.value.getType(),
            expirationDay: vb.value.getExpirationDay(),
            microblockHashes: vb.value.getAllMicroblockHashes().map((hash) => hash.encode()),
        }
    } catch (error) {
        console.error('Error loading virtual blockchain:', error)
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <div class="page">
        <h2>Virtual Blockchain Details</h2>

        <div v-if="loading" class="loading">
            <ProgressSpinner />
            <p>Loading virtual blockchain...</p>
        </div>

        <div v-if="vbData && !loading" class="details-container">
            <!-- Virtual Blockchain Info -->
            <div class="details-card">
                <h3>General Information</h3>
                <div class="detail-section">
                    <h4>Identifier</h4>
                    <p class="mono">{{ vbData.identifier }}</p>
                </div>
                <div class="detail-section">
                    <h4>Height</h4>
                    <p class="mono">{{ vbData.height }}</p>
                </div>
                <div class="detail-section">
                    <h4>Type</h4>
                    <p class="mono">{{ VirtualBlockchainLabel.getVirtualBlockchainLabelFromVirtualBlockchainType(vbData.type) }}</p>
                </div>
                <div class="detail-section">
                    <h4>Expiration Day</h4>
                    <p>{{ formatDate(vbData.expirationDay) }}</p>
                </div>
            </div>

            <!-- Microblocks List -->
            <div class="details-card">
                <h3>Microblocks ({{ vbData.microblockHashes.length }})</h3>
                <div v-if="vbData.microblockHashes.length > 0" class="microblocks-list">
                    <div
                        v-for="(mbHash, index) in vbData.microblockHashes"
                        :key="index"
                        class="microblock-item"
                        @click="navigateToMicroblock(mbHash)"
                    >
                        <h5>Microblock {{ index + 1 }}</h5>
                        <p class="mono">{{ mbHash }}</p>
                    </div>
                </div>
                <p v-else class="empty">No microblocks in this virtual blockchain</p>
            </div>
        </div>

        <p v-else-if="!loading" class="empty">Virtual blockchain not found.</p>
    </div>
</template>

<style scoped>
.details-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
}

.microblocks-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    margin-top: var(--spacing-md);
}

.microblock-item {
    padding: var(--spacing-md);
    background: var(--p-surface-50);
    border-radius: var(--p-border-radius);
    border: 1px solid var(--p-surface-200);
    cursor: pointer;
    transition: all 0.2s ease;
}

.microblock-item:hover {
    background: var(--p-surface-100);
    border-color: var(--p-primary-400);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.microblock-item h5 {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--p-primary-500);
}

.microblock-item p {
    margin: var(--spacing-xs) 0;
    word-break: break-all;
}

.loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-2xl);
}
</style>
