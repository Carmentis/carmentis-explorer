<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VB_NAME } from '@cmts-dev/carmentis-sdk-core'
import ProgressSpinner from 'primevue/progressspinner'
import * as api from "@/indexer-sdk/indexer-api";

interface MicroblockData {
    hash: string
    height: number
}

interface VirtualBlockchainData {
    identifier: string
    height: number
    type: number
    creationTimestamp: number
    modificationTimestamp: number
    expirationTimestamp: number
    microblockData: MicroblockData[]
}

const route = useRoute()
const router = useRouter()
const vbId = ref(route.params.vbId as string)
const vbData = ref<VirtualBlockchainData | null>(null)
const loading = ref(true)

const formatDate = (timestampInSeconds: number): string => {
    const date = new Date(timestampInSeconds * 1000)
    return date.toLocaleDateString()
}

const getDaysRemaining = (dayNumber: number): number | null => {
    if (dayNumber === 0) return null
    const expirationDate = new Date(dayNumber * 1000)
    const now = new Date()
    const diffTime = expirationDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
}

const navigateToMicroblock = (mbHash: string) => {
    router.push(`/vb/mb/${mbHash}`)
}

onMounted(async () => {
    try {
        const vbs = await api.appControllerGetVirtualBlockchains({
            vb_id: vbId.value as string
        });
        if (vbs.data.items.length === 0) {
            throw new Error("virtual blockchain not found");
        }
        const vb = vbs.data.items[0];
        const microblocks = await api.appControllerGetMicroblocks({
            vb_id: vb.virtualBlockchainId,
            sort: "height",
            order: "DESC",
        });
        const microblockData: MicroblockData[] = microblocks.data.items.map((mb) => ({
            hash: mb.hash,
            height: mb.height,
        }));
        vbData.value = {
            identifier: vb.virtualBlockchainId,
            height: vb.height,
            type: vb.type,
            creationTimestamp: vb.creationTimestamp,
            modificationTimestamp: vb.modificationTimestamp,
            expirationTimestamp: vb.expirationTimestamp,
            microblockData,
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
                <div class="cards-grid">
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
                        <p>{{ VB_NAME[vbData.type] }}</p>
                    </div>
                    <div class="detail-section">
                        <h4>Creation</h4>
                        <p>{{ formatDate(vbData.creationTimestamp) }}</p>
                    </div>
                    <div class="detail-section">
                        <h4>Last modification</h4>
                        <p>{{ formatDate(vbData.modificationTimestamp) }}</p>
                    </div>
                    <div class="detail-section">
                        <h4>Expiration</h4>
                        <p>
                            {{ vbData.expirationTimestamp !== 0
                                ? formatDate(vbData.expirationTimestamp)
                                : 'No expiration' }}
                        </p>
                        <p v-if="getDaysRemaining(vbData.expirationTimestamp) !== null" class="days-remaining">
                            {{ getDaysRemaining(vbData.expirationTimestamp)! > 0
                                ? `${getDaysRemaining(vbData.expirationTimestamp)} days remaining`
                                : 'Expired' }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Microblocks List -->
            <div class="details-card">
                <h3>Microblocks ({{ vbData.height }})</h3>
                <div v-if="vbData.microblockData.length > 0" class="microblocks-list">
                    <div
                        v-for="({hash, height}) in vbData.microblockData"
                        :key="height"
                        class="microblock-item"
                        @click="navigateToMicroblock(hash)"
                    >
                        <h5>Microblock #{{ height }}</h5>
                        <p class="mono">{{ hash }}</p>
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
    border-color: var(--p-sky-400);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.microblock-item h5 {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--p-sky-500);
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

.days-remaining {
    margin-top: var(--spacing-xs);
    font-style: italic;
    color: var(--p-text-muted-color);
}
</style>
