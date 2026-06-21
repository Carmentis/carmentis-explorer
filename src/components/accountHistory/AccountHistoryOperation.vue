<template>
    <div class="page">
        <div class="flex justify-between items-center">
            <h2>Operation Details</h2>
        </div>
        <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading operation details...</p>
        </div>

        <div v-if="operation && !loading" class="details-card">
            <div class="cards-grid">
                <div class="detail-section">
                    <h3>Account ID</h3>
                    <p class="mono">{{ operation.accountId }}</p>
                </div>
                <div class="detail-section">
                    <h3>Linked account ID</h3>
                    <p class="mono">{{ operation.linkedAccountId }}</p>
                </div>
                <div class="detail-section">
                    <h3>Time</h3>
                    {{ formatDate(operation.timestamp) }}
                </div>
                <div class="detail-section">
                    <h3>Type</h3>
                    {{ operation.type }}
                </div>
                <div class="detail-section">
                    <h3>Amount</h3>
                    {{ operation.amount }}
                </div>
                <div class="detail-section">
                    <h3>Public reference</h3>
                    {{ operation.publicReference }}
                </div>
            </div>
        </div>

        <p v-else-if="!loading" class="empty">Operation not found.</p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import * as api from "@/indexer-sdk/indexer-api";
import { formatDate } from '@/utils/formatTime'
import { BK_NAMES, BK_PLUS, CMTSToken, TokenUnit } from '@cmts-dev/carmentis-sdk-core'

const route = useRoute()
const accountId = route.params.accountId as string
const height = parseInt(route.params.height as string, 10)
const loading = ref(true)
const operation = ref<{
    accountId: string
    linkedAccountId: string
    timestamp: Date
    incoming: boolean
    type: string
    amount: string
    publicReference: string
} | null>(null)

onMounted(async () => {
    try {
        const entries = await api.appControllerGetAccountHistory({
            account_id: accountId,
            height,
        });
        const entry = entries.data.items[0];

        operation.value = {
            accountId,
            linkedAccountId: entry.linkedAccountId,
            timestamp: new Date(entry.timestamp * 1000),
            incoming: !!(entry.type & BK_PLUS),
            type: BK_NAMES[entry.type],
            amount: CMTSToken.createAtomic(entry.amount).toString(
                TokenUnit.TOKEN,
                { locale: "system", grouping: true, decimalPlaces: 3 }
            ),
            publicReference: entry.publicReference,
        }
    } catch (error) {
        console.error('Error fetching history:', error)
    } finally {
        loading.value = false
    }
})
</script>
