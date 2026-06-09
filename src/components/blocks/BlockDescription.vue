<template>
    <div class="page">
        <h2>Block Details</h2>

        <div v-if="loading" class="loading">
            <ProgressSpinner />
            <p>Loading block details...</p>
        </div>

        <div v-if="block && !loading" class="details-container">
            <!-- Block Header -->
            <div class="details-card">
                <h3>Block Header</h3>
                <div class="cards-grid">
                    <div class="detail-section">
                        <h4>Height</h4>
                        <p class="mono">{{ block.header.height }}</p>
                    </div>
                    <div class="detail-section">
                        <h4>Block Hash</h4>
                        <p class="mono">{{ block.blockHash }}</p>
                    </div>
                    <div class="detail-section">
                        <h4>Time</h4>
                        <p>{{ formatTime(block.header.time) }}</p>
                    </div>
                    <div class="detail-section">
                        <h4>Chain ID</h4>
                        <p class="mono">{{ block.header.chainId }}</p>
                    </div>
                    <div class="detail-section">
                        <h4>CometBFT Address</h4>
                        <p class="mono">{{ block.header.proposerAddress }}</p>
                    </div>
                </div>
            </div>

            <!-- Comet Hashes -->
            <CollapsibleCard :default-open="false">
                <template #title>Comet BFT Hashes</template>
                <div class="detail-section">
                    <h4>Last Commit Hash</h4>
                    <p class="mono">{{ block.header.lastCommitHash }}</p>
                </div>
                <div class="detail-section">
                    <h4>Data Hash</h4>
                    <p class="mono">{{ block.header.dataHash }}</p>
                </div>
                <div class="detail-section">
                    <h4>Validators Hash</h4>
                    <p class="mono">{{ block.header.validatorsHash }}</p>
                </div>
                <div class="detail-section">
                    <h4>Next Validators Hash</h4>
                    <p class="mono">{{ block.header.nextValidatorsHash }}</p>
                </div>
                <div class="detail-section">
                    <h4>Consensus Hash</h4>
                    <p class="mono">{{ block.header.consensusHash }}</p>
                </div>
                <div class="detail-section">
                    <h4>App Hash</h4>
                    <p class="mono">{{ block.header.appHash }}</p>
                </div>
                <div class="detail-section">
                    <h4>Last Results Hash</h4>
                    <p class="mono">{{ block.header.lastResultsHash }}</p>
                </div>
                <div class="detail-section">
                    <h4>Evidence Hash</h4>
                    <p class="mono">{{ block.header.evidenceHash }}</p>
                </div>
            </CollapsibleCard>

            <!-- ABCI Hashes -->
            <CollapsibleCard :default-open="false">
                <template #title>ABCI Hashes</template>
                <div class="detail-section">
                    <h4>Virtual Blockchain Radix Hash</h4>
                    <p class="mono">{{ block.abci.vbRadixHash }}</p>
                </div>
                <div class="detail-section">
                    <h4>Token Radix Hash</h4>
                    <p class="mono">{{ block.abci.tokenRadixHash }}</p>
                </div>
                <div class="detail-section">
                    <h4>Storage Hash</h4>
                    <p class="mono">{{ block.abci.storageHash }}</p>
                </div>
                <div class="detail-section">
                    <h4>App Hash</h4>
                    <p class="mono">{{ block.abci.appHash }}</p>
                </div>
            </CollapsibleCard>

            <!-- Transactions -->
            <div class="details-card">
                <h3>Transactions ({{ block.txs.length }})</h3>
                <div v-if="block.txs.length > 0" class="transactions-list">
                    <div v-for="(tx, index) in block.txs" :key="index" class="transaction-item">
                        <TransactionDescription :index="index" :tx="tx" />
                    </div>
                </div>
                <p v-else class="empty">No transactions in this block</p>
            </div>

            <div v-if="block.signatures.length > 0" class="signatures-list">
                <div
                    v-for="(sig, index) in block.signatures"
                    :key="index"
                    class="signature-item"
                >
                    <h5>Signature {{ index + 1 }}</h5>
                    <p class="mono"><strong>Type:</strong> {{ sig.blockIdFlag }}</p>
                    <p class="mono"><strong>Validator:</strong> {{ sig.validatorAddress }}</p>
                    <p class="mono">
                        <strong>Timestamp:</strong> {{ formatTime(sig.timestamp) }}
                    </p>
                    <p class="mono"><strong>Signature:</strong> {{ sig.signature }}</p>
                </div>
            </div>
        </div>

        <p v-else-if="!loading" class="empty">Block not found.</p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ProgressSpinner from 'primevue/progressspinner'
import TransactionDescription from '@/components/blocks/TransactionDescription.vue'
import CollapsibleCard from '@/components/utils/CollapsibleCard.vue'
import { formatTime } from "@/utils/formatTime"
import * as api from "@/indexer-sdk/indexer-api";

interface BlockData {
    blockHash: string
    header: {
        version: {
            block: string
            app: string
        }
        chainId: string
        height: number
        time: Date
        lastCommitHash: string
        dataHash: string
        validatorsHash: string
        nextValidatorsHash: string
        consensusHash: string
        appHash: string
        lastResultsHash: string
        evidenceHash: string
        proposerAddress: string
    }
    abci: {
        vbRadixHash: string
        tokenRadixHash: string
        storageHash: string
        appHash: string
    }
    txs: string[]
    signatures: Array<{
        blockIdFlag: number
        validatorAddress: string
        timestamp: Date
        signature: string
    }>
}

const route = useRoute()
const loading = ref(true)
const block = ref<BlockData | null>(null)

onMounted(async () => {
    try {
        if (!route.params.blockHeight) {
            throw new Error('No block identifier provided');
        }
        const height = parseInt(route.params.blockHeight as string);
        const blockResponse = await api.appControllerGetBlocks({ height });
        if (blockResponse.data.items.length !== 1) {
            throw new Error('Block not found');
        }
        const requestedBlock = blockResponse.data.items[0];
        const microblocks = await api.appControllerGetMicroblocks({
            block_height: height,
            include_content: true,
        });
        const txs = microblocks.data.items.map((mb) => mb.content);

        block.value = {
            blockHash: requestedBlock.hash,
            header: {
                version: {
                    block: requestedBlock.blockVersion.toString(),
                    app: requestedBlock.appVersion.toString(),
                },
                chainId: requestedBlock.chainId,
                height: requestedBlock.height,
                time: new Date(requestedBlock.milliseconds),
                lastCommitHash: requestedBlock.lastCommitHash,
                dataHash: requestedBlock.dataHash,
                validatorsHash: requestedBlock.validatorsHash,
                nextValidatorsHash: requestedBlock.nextValidatorsHash,
                consensusHash: requestedBlock.consensusHash,
                appHash: requestedBlock.appHash,
                lastResultsHash: requestedBlock.lastResultsHash,
                evidenceHash: requestedBlock.evidenceHash,
                proposerAddress: requestedBlock.proposerAddress,
            },
            abci: {
                vbRadixHash: requestedBlock.appVbRadixHash,
                tokenRadixHash: requestedBlock.appTokenRadixHash,
                storageHash: requestedBlock.appStorageHash,
                appHash: requestedBlock.appHash,
            },
            txs,
            signatures: requestedBlock.signatures.map((sig) => ({
                blockIdFlag: sig.blockIdFlag,
                validatorAddress: sig.validatorAddress,
                timestamp: new Date(sig.milliseconds),
                signature: sig.signature,
            })),
        }
    } catch (error) {
        console.error('Error fetching block:', error)
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

.transactions-list,
.signatures-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    margin-top: var(--spacing-md);
}

.transaction-item,
.signature-item {
    padding: var(--spacing-md);
    background: var(--p-surface-50);
    border-radius: var(--p-border-radius);
    border: 1px solid var(--p-surface-200);
}

.transaction-item h5,
.signature-item h5 {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--p-primary-500);
}

.transaction-item p,
.signature-item p {
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
