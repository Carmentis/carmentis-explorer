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

            <!-- Block ID -->
            <div class="details-card">
                <h3>Block ID</h3>
                <div class="detail-section">
                    <h4>Hash</h4>
                    <p class="mono">{{ block.blockId.hash }}</p>
                </div>
                <div class="detail-section">
                    <h4>Parts</h4>
                    <p class="mono">Total: {{ block.blockId.parts.total }}</p>
                    <p class="mono">Hash: {{ block.blockId.parts.hash }}</p>
                </div>
            </div>

            <!-- Last Block ID -->
            <div class="details-card">
                <h3>Last Block ID</h3>
                <div class="detail-section">
                    <h4>Hash</h4>
                    <p class="mono">{{ block.header.lastBlockId.hash }}</p>
                </div>
                <div class="detail-section">
                    <h4>Parts</h4>
                    <p class="mono">Total: {{ block.header.lastBlockId.parts.total }}</p>
                    <p class="mono">Hash: {{ block.header.lastBlockId.parts.hash }}</p>
                </div>
            </div>

            <!-- Hashes -->
            <div class="details-card">
                <h3>Merkle Roots</h3>
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
            </div>

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

            <!-- Last Commit -->
            <div v-if="block.lastCommit" class="details-card">
                <h3>Last Commit</h3>
                <div class="detail-section">
                    <h4>Height</h4>
                    <p class="mono">{{ block.lastCommit.height }}</p>
                </div>
                <div class="detail-section">
                    <h4>Round</h4>
                    <p class="mono">{{ block.lastCommit.round }}</p>
                </div>
                <div class="detail-section">
                    <h4>Block ID Hash</h4>
                    <p class="mono">{{ block.lastCommit.blockId.hash }}</p>
                </div>
                <div class="detail-section">
                    <h4>Signatures</h4>
                    <p>{{ block.lastCommit.signatures.length }} signatures</p>
                </div>
                <div v-if="block.lastCommit.signatures.length > 0" class="signatures-list">
                    <div
                        v-for="(sig, index) in block.lastCommit.signatures"
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
        </div>

        <p v-else-if="!loading" class="empty">Block not found.</p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Tendermint37Client } from '@cosmjs/tendermint-rpc'
import { useBlockchainStore } from '@/stores/blockchain'
import { Utils } from '@cmts-dev/carmentis-sdk/client'
import ProgressSpinner from 'primevue/progressspinner'
import TransactionDescription from '@/components/blocks/TransactionDescription.vue'

interface BlockData {
    blockHash: string
    blockId: {
        hash: string
        parts: {
            total: number
            hash: string
        }
    }
    header: {
        version: {
            block: string
            app: string
        }
        chainId: string
        height: number
        time: Date
        lastBlockId: {
            hash: string
            parts: {
                total: number
                hash: string
            }
        }
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
    txs: string[]
    lastCommit: {
        height: number
        round: number
        blockId: {
            hash: string
            parts: {
                total: number
                hash: string
            }
        }
        signatures: Array<{
            blockIdFlag: number
            validatorAddress: string
            timestamp: Date
            signature: string
        }>
    } | null
}

const route = useRoute()
const blockchainStore = useBlockchainStore()
const loading = ref(true)
const block = ref<BlockData | null>(null)

const formatTime = (date: Date): string => {
    return new Date(date).toLocaleString()
}

onMounted(async () => {
    try {
        const rpcUrl = blockchainStore.getRpcUrl
        const client = await Tendermint37Client.connect(rpcUrl)

        let blockResponse

        // Check if we're searching by hash or height
        if (route.params.blockHeight) {
            const height = parseInt(route.params.blockHeight as string)
            blockResponse = await client.block(height)
        } else {
            throw new Error('No block identifier provided')
        }

        const blockHeader = blockResponse.block.header
        const blockId = blockResponse.blockId

        block.value = {
            blockHash: Utils.binaryToHexa(blockId.hash),
            blockId: {
                hash: Utils.binaryToHexa(blockId.hash),
                parts: {
                    total: blockId.parts.total,
                    hash: Utils.binaryToHexa(blockId.parts.hash),
                },
            },
            header: {
                version: {
                    block: blockHeader.version.block.toString(),
                    app: blockHeader.version.app.toString(),
                },
                chainId: blockHeader.chainId,
                height: blockHeader.height,
                time: blockHeader.time,
                lastBlockId: {
                    hash: Utils.binaryToHexa(blockHeader.lastBlockId.hash),
                    parts: {
                        total: blockHeader.lastBlockId.parts.total,
                        hash: Utils.binaryToHexa(blockHeader.lastBlockId.parts.hash),
                    },
                },
                lastCommitHash: Utils.binaryToHexa(blockHeader.lastCommitHash),
                dataHash: Utils.binaryToHexa(blockHeader.dataHash),
                validatorsHash: Utils.binaryToHexa(blockHeader.validatorsHash),
                nextValidatorsHash: Utils.binaryToHexa(blockHeader.nextValidatorsHash),
                consensusHash: Utils.binaryToHexa(blockHeader.consensusHash),
                appHash: Utils.binaryToHexa(blockHeader.appHash),
                lastResultsHash: Utils.binaryToHexa(blockHeader.lastResultsHash),
                evidenceHash: Utils.binaryToHexa(blockHeader.evidenceHash),
                proposerAddress: Utils.binaryToHexa(blockHeader.proposerAddress),
            },
            txs: blockResponse.block.txs.map((tx: any) => Utils.binaryToHexa(tx)),
            lastCommit: blockResponse.block.lastCommit
                ? {
                      height: blockResponse.block.lastCommit.height,
                      round: blockResponse.block.lastCommit.round,
                      blockId: {
                          hash: Utils.binaryToHexa(blockResponse.block.lastCommit.blockId.hash),
                          parts: {
                              total: blockResponse.block.lastCommit.blockId.parts.total,
                              hash: Utils.binaryToHexa(
                                  blockResponse.block.lastCommit.blockId.parts.hash,
                              ),
                          },
                      },
                      signatures: blockResponse.block.lastCommit.signatures.map((sig: any) => ({
                          blockIdFlag: sig.blockIdFlag,
                          validatorAddress: Utils.binaryToHexa(sig.validatorAddress),
                          timestamp: sig.timestamp,
                          signature: Utils.binaryToHexa(sig.signature),
                      })),
                  }
                : null,
        }

        await client.disconnect()
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
