<template>
    <div class="home">
        <h1>Latest Blocks</h1>
        <p>Real-time blockchain activity</p>

        <div v-if="connectionStatus" class="connection-status">
            <Tag
                :value="connectionStatus"
                :severity="isConnected ? 'success' : 'danger'"
                icon="pi pi-circle-fill"
            />
        </div>

        <DataView :value="blocks" :loading="loading" class="blocks-view mt-4">
            <template #empty>
                <div class="empty-state">No blocks found.</div>
            </template>
            <template #list="{ items }">
                <div class="blocks-list">
                    <div
                        v-for="block in items"
                        :key="block.height"
                        class="p-2 flex flex-row gap-2 justify-between border-b-2 border-b-neutral-100"
                        @click="onBlockClick(block)"
                    >
                        <div class="flex flex-row gap-2 items-center">
                            <div class="bg-gray-200 p-3 rounded">
                                <i class="pi pi-box"></i>
                            </div>
                            <div class="block-height">
                                <div class="height-value">{{ block.height }}</div>
                                <div class="time-ago" :title="formatTime(block.time)">
                                    {{ getTimeAgo(block.time) }}
                                </div>
                            </div>
                        </div>
                        <div class="block-proposer">
                            <div class="proposer-address mono-cell">{{ block.proposer }}</div>
                            <div class="tx-count">
                                {{ block.numTxs }} transaction{{ block.numTxs !== 1 ? 's' : '' }}
                            </div>
                        </div>
                        <div class="block-reward">
                            <div class="reward-label">Reward</div>
                            <div class="reward-value">{{ block.numTxs }}</div>
                        </div>
                    </div>
                </div>
            </template>
        </DataView>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Tendermint37Client } from '@cosmjs/tendermint-rpc'
import { useBlockchainStore } from '@/stores/blockchain'
import DataView from 'primevue/dataview'
import Tag from 'primevue/tag'
import { Utils } from '@cmts-dev/carmentis-sdk/client'

interface Block {
    height: number
    hash: string
    time: Date
    numTxs: number
    proposer: string
}

const router = useRouter()
const blockchainStore = useBlockchainStore()
const loading = ref(true)
const blocks = ref<Block[]>([])
const connectionStatus = ref<string>('')
const isConnected = ref(false)
let client: Tendermint37Client | null = null

const formatTime = (date: Date): string => {
    return new Date(date).toLocaleString()
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
    if (blocks.value.length > 10) {
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
                    //console.log('New block:', header)

                    const newBlock: Block = {
                        height: parseInt(header.height),
                        hash: header.last_block_id.hash,
                        time: new Date(header.time),
                        numTxs: blockData.data?.txs?.length || 0,
                        proposer: header.proposer_address,
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
            proposer: Utils.binaryToHexa(b.block.header.proposerAddress),
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

.mono-cell {
    font-family: var(--font-family-mono);
    font-size: 0.875rem;
}

.empty-state {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--color-text-tertiary);
}
</style>
