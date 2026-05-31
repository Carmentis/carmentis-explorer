<template>
    <div class="page">
        <div class="flex flex-row justify-between items-center">
            <h2>Microblock Details</h2>
            <Button icon="pi pi-link" label="Explore Virtual Blockchain" @click="visitVB" />
        </div>

        <div v-if="loading" class="loading">
            <ProgressSpinner />
            <p>Loading microblock details...</p>
        </div>

        <div v-if="microblock && !loading" class="details-container">
            <!-- Microblock Header -->
            <div class="details-card">
                <h3>Microblock Header</h3>
                <div class="detail-section">
                    <h4>Microblock Hash</h4>
                    <p class="mono">{{ microblock.header.hash }}</p>
                </div>
                <div class="detail-section">
                    <h4>Gas Price</h4>
                    <p class="mono">
                        {{ microblock.header.gasPrice }}
                    </p>
                </div>
                <div class="detail-section">
                    <h4>Paid fees</h4>
                    <p class="mono">
                        {{ microblock.header.paidFees }}
                    </p>
                </div>
                <div class="detail-section">
                    <h4>Previous Hash</h4>
                    <p class="mono">{{ microblock.header.previousHash }}</p>
                </div>
                <div class="detail-section">
                    <h4>Height</h4>
                    <p class="mono">{{ microblock.header.height }}</p>
                </div>
                <div class="detail-section">
                    <h4>Timestamp</h4>
                    <p>{{ formatTime(microblock.header.timestamp) }}</p>
                </div>
                <div class="detail-section">
                    <h4>Signer</h4>
                    <a :href="`/accounts/${microblock.header.signer}`">{{
                        microblock.header.signer
                    }}</a>
                </div>
                <div class="detail-section">
                    <h4>Signature</h4>
                    <p>{{ microblock.header.signature }}</p>
                </div>
            </div>

            <!-- Microblock Body -->
            <div class="details-card">
                <h3>Microblock Body</h3>
                <div class="detail-section">
                    <h4>Sections ({{ microblock.body.transactions.length }})</h4>
                    <div v-if="microblock.body.transactions.length > 0" class="transactions-list">
                        <div
                            v-for="(tx, index) in microblock.body.transactions"
                            :key="index"
                            class="transaction-item"
                        >
                            <MicroblockInVirtualBlockchainSection
                                :serializedMb="microblock.serializedMb"
                                :section-index="index"
                                :section="JSON.parse(tx)"
                            />
                        </div>
                    </div>
                    <p v-else class="empty">No transactions in this microblock</p>
                </div>
            </div>
        </div>

        <p v-else-if="!loading" class="empty">Microblock not found.</p>
    </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { onMounted, ref } from 'vue'
import { Base64, Microblock, Utils } from '@cmts-dev/carmentis-sdk-core'
import ProgressSpinner from 'primevue/progressspinner'
import Button from 'primevue/button'
import MicroblockInVirtualBlockchainSection from '@/components/vb/MicroblockInVirtualBlockchainSection.vue'
import { formatTime } from "@/utils/formatTime"
import * as api from "@/indexer-sdk/indexer-api";

interface MicroblockData {
    serializedMb: Uint8Array
    header: {
        gasPrice: string
        paidFees: string
        hash: string
        previousHash: string
        height: number
        timestamp: number
        signature: string
        signer: string
    }
    body: {
        transactions: string[]
    }
}
const router = useRouter()
const route = useRoute()
const mbHash = ref(route.params.mbHash as string)
const loading = ref(true)
const microblock = ref<MicroblockData | null>(null)

function visitVB() {
    router.push(`/vb/${route.params.vbId}`)
}

onMounted(async () => {
    try {
        const microblocks = await api.appControllerGetMicroblocks({
            hash: mbHash.value,
            include_content: true,
        });
        if (microblocks.data.items.length === 0) {
            throw new Error('Microblock not found');
        }
        const requestedMicroblock = microblocks.data.items[0];
        const serializedData = Base64.decodeBinary(requestedMicroblock.content);
        const mb = Microblock.loadFromSerializedMicroblock(serializedData);
        const gasPrice = mb.getGasPrice().toString()
        const paidFees = mb.getFees().toString()

        const signature = Utils.binaryToHexa(mb.getLastSignatureSection().signature)
        const signerAccount = mb.getFeesPayerAccount()

        microblock.value = {
            serializedMb: mb.serialize().microblockData,
            header: {
                gasPrice,
                paidFees,
                hash: mb.getHash().encode(),
                previousHash: mb.getPreviousHash().encode(),
                height: mb.getHeight(),
                timestamp: mb.getTimestampAsDate().getTime(),
                signature,
                signer: Utils.binaryToHexa(signerAccount),
            },
            body: {
                transactions: mb.getAllSections().map((tx) => JSON.stringify(tx)),
            },
        }
    } catch (error) {
        console.error('Error fetching microblock:', error)
    } finally {
        loading.value = false
    }
})
</script>

<style scoped>
.details-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
}

.transactions-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    margin-top: var(--spacing-md);
}

.transaction-item {
    padding: var(--spacing-md);
    background: var(--p-surface-50);
    border-radius: var(--p-border-radius);
    border: 1px solid var(--p-surface-200);
}

.transaction-item h5 {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--p-primary-500);
}

.transaction-item p {
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
