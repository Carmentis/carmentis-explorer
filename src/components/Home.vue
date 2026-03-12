<template>
    <div class="home">
        <div class="flex justify-between items-start mb-8">
            <div>
                <h1>Latest Blocks</h1>
                <p>Real-time blockchain activity</p>

                <div v-if="connectionStatus" class="connection-status">
                    <Tag
                        :value="connectionStatus"
                        :severity="isConnected ? 'success' : 'danger'"
                        icon="pi pi-circle-fill"
                    />
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-150">
                <div class="flex divide-x divide-gray-200">
                    <!-- Min Gas Price -->
                    <div class="flex-1 px-6 py-4">
                        <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                            Min Gas Price
                        </div>
                        <div class="text-2xl font-semibold text-gray-900">
                            {{ isMinMaxApplicable ? minGasPrice : '--' }}
                        </div>
                    </div>

                    <!-- Avg Gas Price -->
                    <div class="flex-1 px-6 py-4">
                        <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                            Avg Gas Price
                        </div>
                        <div class="text-2xl font-semibold text-gray-900">
                            {{ isMinMaxApplicable ? avgGasPrice.toFixed(2) : '--' }}
                        </div>
                    </div>

                    <!-- Max Gas Price -->
                    <div class="flex-1 px-6 py-4">
                        <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                            Max Gas Price
                        </div>
                        <div class="text-2xl font-semibold text-gray-900">
                            {{ isMinMaxApplicable ? maxGasPrice : '--' }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <DataView :value="blocks" :loading="loading" class="mt-8">
            <template #empty>
                <div class="text-center py-12 text-gray-500">No blocks found.</div>
            </template>
            <template #list="{ items }">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div
                        v-for="(block, index) in items"
                        :key="block.height"
                        class="flex items-center gap-6 px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
                        @click="onBlockClick(block)"
                    >
                        <!-- Icon -->
                        <div class="flex-shrink-0">
                            <div
                                :class="`w-12 h-12 ${block.numTxs === 0 ? 'bg-gray-100' : 'bg-green-100'} rounded-lg flex items-center justify-center`"
                            >
                                <i
                                    :class="`pi pi-box ${block.numTxs === 0 ? 'text-gray-600' : 'text-green-500'} text-xl`"
                                ></i>
                            </div>
                        </div>

                        <!-- Block Height & Time -->
                        <div class="flex flex-col min-w-[140px]">
                            <div class="text-lg font-semibold text-gray-900">
                                {{ block.height }}
                            </div>
                            <div class="text-sm text-gray-500" :title="formatTime(block.time)">
                                {{ getTimeAgo(block.time) }}
                            </div>
                        </div>

                        <!-- Proposer & Transactions -->
                        <div class="flex flex-col flex-1 min-w-0">
                            <div class="font-mono text-sm text-gray-900 truncate font-medium">
                                {{ block.proposer }}
                            </div>
                            <div class="text-sm text-gray-500">
                                {{ block.numTxs }} transaction{{ block.numTxs !== 1 ? 's' : '' }}
                            </div>
                        </div>

                        <!-- Reward -->
                        <div class="flex flex-col items-end min-w-[120px]">
                            <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                Reward
                            </div>
                            <div class="text-lg font-semibold text-gray-900">
                                {{ block.rewards }}
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </DataView>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Tendermint37Client } from '@cosmjs/tendermint-rpc'
import { useBlockchainStore } from '@/stores/blockchain'
import DataView from 'primevue/dataview'
import Tag from 'primevue/tag'
import { CMTSToken, Microblock, Utils } from '@cmts-dev/carmentis-sdk/client'

interface Block {
    height: number
    hash: string
    time: Date
    txs: Uint8Array[]
    numTxs: number
    proposer: string
    rewards: string
}

const router = useRouter()
const blockchainStore = useBlockchainStore()
const loading = ref(true)
const blocks = ref<Block[]>([])
const connectionStatus = ref<string>('')
const isConnected = ref(false)
let client: Tendermint37Client | null = null

const gasPrices = computed(() => {
    if (blocks.value.length === 0) return []
    return blocks.value
        .map((block) =>
            block.txs.map((tx) =>
                Microblock.loadFromSerializedMicroblock(tx).getGasPrice().getAmountAsAtomic(),
            ),
        )
        .reduce((acc, val) => acc.concat(val), [])
})
const isMinMaxApplicable = computed(() => gasPrices.value.length > 0)
const minGasPrice = computed(() =>
    gasPrices.value.length === 0 ? 0 : Math.min(...gasPrices.value),
)
const maxGasPrice = computed(() =>
    gasPrices.value.length === 0 ? 0 : Math.max(...gasPrices.value),
)
const avgGasPrice = computed(() => {
    if (gasPrices.value.length === 0) return 0
    return gasPrices.value.reduce((acc, val) => acc + val, 0) / gasPrices.value.length
})

const formatTime = (date: Date): string => {
    return new Date(date).toLocaleString()
}

const computeRewardsForTransactions = (txs: Uint8Array[]) => {
    const rewardsInAtomic = txs
        .map((tx: Uint8Array) => Microblock.loadFromSerializedMicroblock(tx))
        .map((mb: Microblock) => mb.getMaxFees().getAmountAsAtomic())
        .reduce((a, b) => a + b, 0)
    return CMTSToken.createAtomic(rewardsInAtomic).toString()
}

const getTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000)

    if (diffInSeconds < 60) {
        return `${diffInSeconds} sec${diffInSeconds !== 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60)
        return `${minutes} min${minutes !== 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600)
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    } else {
        const days = Math.floor(diffInSeconds / 86400)
        return `${days} day${days !== 1 ? 's' : ''} ago`
    }
}

const onBlockClick = (block: Block) => {
    router.push(`/block/height/${block.height}`)
}

const addBlock = (block: Block) => {
    // Add new block at the beginning
    blocks.value.unshift(block)
    // Keep only the latest 10 blocks
    if (blocks.value.length > 8) {
        blocks.value = blocks.value.slice(0, 8)
    }
}

let ws: WebSocket | null = null
//let reconnectTimeout: any = null

const subscribeToNewBlocks = () => {
    try {
        const rpcUrl = blockchainStore.getRpcUrl
        // Convert HTTP(S) URL to WebSocket URL
        const wsUrl = rpcUrl.replace(/^http/, 'ws') + '/websocket'

        ws = new WebSocket(wsUrl)

        ws.onopen = () => {
            console.log('WebSocket connected')
            connectionStatus.value = 'Connected - Live Updates'
            isConnected.value = true

            // Subscribe to new block events
            const subscribeMsg = {
                jsonrpc: '2.0',
                method: 'subscribe',
                id: '1',
                params: {
                    query: "tm.event='NewBlock'",
                },
            }
            ws?.send(JSON.stringify(subscribeMsg))
        }

        ws.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data)

                // Check if this is a new block event
                if (data.result?.data?.type === 'tendermint/event/NewBlock') {
                    const blockData = data.result.data.value.block
                    const header = blockData.header
                    const txs: Uint8Array[] = blockData.data?.txs ?? []

                    //console.log('New block:', header)

                    const newBlock: Block = {
                        txs,
                        height: parseInt(header.height),
                        hash: header.last_block_id.hash,
                        time: new Date(header.time),
                        numTxs: blockData.data?.txs?.length || 0,
                        proposer: header.proposer_address,
                        rewards: computeRewardsForTransactions(txs),
                    }

                    addBlock(newBlock)
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error)
            }
        }

        ws.onerror = (error) => {
            console.error('WebSocket error:', error)
            connectionStatus.value = 'Connection Error'
            isConnected.value = false
        }

        ws.onclose = () => {
            console.log('WebSocket disconnected')
            connectionStatus.value = 'Disconnected - Reconnecting...'
            isConnected.value = false

            // Attempt to reconnect after 5 seconds
            /*
            reconnectTimeout = setTimeout(() => {
                console.log('Attempting to reconnect...')
                subscribeToNewBlocks()
            }, 5000)

             */
        }
    } catch (error) {
        console.error('Error setting up WebSocket:', error)
        connectionStatus.value = 'Connection Failed'
        isConnected.value = false
    }
}

onMounted(async () => {
    try {
        const rpcUrl = blockchainStore.getRpcUrl

        // Connect to Tendermint RPC
        client = await Tendermint37Client.connect(rpcUrl)

        // Fetch latest blocks
        const latestBlock = await client.block()
        const currentHeight = latestBlock.block.header.height

        // Fetch the last 10 blocks
        const blockPromises: Promise<any>[] = []
        for (let i = 0; i < 8; i++) {
            const height = currentHeight - i
            if (height > 0) {
                blockPromises.push(client.block(height))
            }
        }

        const fetchedBlocks = await Promise.all(blockPromises)
        blocks.value = fetchedBlocks.map((b) => ({
            height: b.block.header.height,
            hash: Utils.binaryToHexa(b.blockId.hash),
            time: b.block.header.time,
            numTxs: b.block.txs.length,
            txs: b.block.txs,
            proposer: Utils.binaryToHexa(b.block.header.proposerAddress),
            rewards: computeRewardsForTransactions(b.block.txs ?? []),
        }))

        loading.value = false

        // Subscribe to new blocks via WebSocket
        subscribeToNewBlocks()
    } catch (error) {
        console.error('Error fetching blocks:', error)
        loading.value = false
        connectionStatus.value = 'Connection Failed'
        isConnected.value = false
    }
})

onUnmounted(() => {
    // Clean up WebSocket connection
    if (ws) {
        ws.close()
        ws = null
    }

    // Clear reconnection timeout
    /*
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
    }

     */

    // Disconnect Tendermint client
    if (client) {
        client.disconnect()
    }
})
</script>

<style scoped>
.home {
    padding: var(--spacing-xl) 0;
}

h1 {
    font-size: var(--font-size-4xl);
    margin-bottom: var(--spacing-sm);
}
</style>
