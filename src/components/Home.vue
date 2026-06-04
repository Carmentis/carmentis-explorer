<template>
    <div class="home">
        <div class="flex justify-between items-start mb-8">
            <div>
                <h2>Latest Blocks</h2>
                <p>Real-time blockchain activity</p>

                <div v-if="connectionStatus" class="connection-status">
                    <Tag
                        :value="connectionStatus"
                        :severity="isConnected ? 'success' : 'danger'"
                        icon="pi pi-circle-fill"
                    />
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-180">
                <div class="px-6 py-3 bg-gray-50 border-b border-gray-200">
                    <div class="text-sm font-medium text-gray-700">
                        <span class="font-bold">Statistics</span>
                        (last {{ STATS_BLOCKS }} blocks)
                    </div>
                </div>
                <div class="flex divide-x divide-gray-200">
                    <!-- Min Gas Price -->
                    <div class="flex-1 px-6 py-4">
                        <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                            Min Gas Price
                        </div>
                        <div class="text-xl font-semibold text-gray-900">
                            <div v-if="isGasPriceConsistent">
                                <AmountDisplay :value="minGasPrice" />
                            </div>
                            <div v-else>--</div>
                        </div>
                    </div>

                    <!-- Avg Gas Price -->
                    <div class="flex-1 px-6 py-4">
                        <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                            Avg Gas Price
                        </div>
                        <div class="text-xl font-semibold text-gray-900">
                            <div v-if="isGasPriceConsistent">
                                <AmountDisplay :value="avgGasPrice" />
                            </div>
                            <div v-else>--</div>
                        </div>
                    </div>

                    <!-- Max Gas Price -->
                    <div class="flex-1 px-6 py-4">
                        <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                            Max Gas Price
                        </div>
                        <div class="text-xl font-semibold text-gray-900">
                            <div v-if="isGasPriceConsistent">
                                <AmountDisplay :value="maxGasPrice" />
                            </div>
                            <div v-else>--</div>
                        </div>
                    </div>

                    <!-- Number of microblocks -->
                    <div class="flex-1 px-6 py-4">
                        <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                            Microblocks
                        </div>
                        <div class="text-xl font-semibold text-gray-900">
                            {{ microblocksCount }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="loading" class="rounded-lg border-2 border-gray-200 p-2 flex flex-col gap-2">
            <div
                v-for="(item, index) in 10"
                :key="index"
                class="flex p-2 gap-2 border-2 border-gray-200 rounded-lg divided-x h-16"
            >
                <Skeleton height="100%" v-for="(item, index) in 4" :key="index" />
            </div>
        </div>

        <!-- Blocks -->
        <DataView :value="blocks" v-if="!loading" class="mt-8">
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
                            <div class="text-sm text-gray-500">
                                <a
                                    class="font-mono text-sm text-gray-900 truncate font-medium"
                                    @click="(e) => visitNode(e, block.nodeId)"
                                >
                                    Proposer node
                                </a>
                                owned by
                                <a
                                    class="font-mono text-sm text-gray-900 truncate font-medium"
                                    @click="(e) => visitOrganization(e, block.nodeOwnerId)"
                                >
                                    {{ block.nodeOwnerName }}
                                </a>
                            </div>
                            <div class="text-sm text-gray-500">
                                {{ block.numTxs }} transaction{{ block.numTxs !== 1 ? 's' : '' }}
                            </div>
                        </div>

                        <!-- Reward -->
                        <div class="flex flex-col items-end min-w-[120px]">
                            <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                Fees
                            </div>
                            <div class="text-lg font-semibold text-gray-900">
                                <AmountDisplay :value="block.fees" />
                            </div>
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
import DataView from 'primevue/dataview'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import { CMTSToken } from '@cmts-dev/carmentis-sdk-core'
import * as api from '@/indexer-sdk/indexer-api'
import { formatTime, getTimeAgo } from '@/utils/formatTime'
import { appControllerGetGasPrice } from '@/indexer-sdk/indexer-api'
import AmountDisplay from '@/components/formatting/AmountDisplay.vue'

interface Block {
    height: number
    hash: string
    time: Date
    numTxs: number
    nodeId: string
    nodeOwnerId: string
    nodeOwnerName: string
    fees: number
}

const MAX_BLOCKS = 10
const STATS_BLOCKS = 100

const router = useRouter()
const loading = ref(true)
const blocks = ref<Block[]>([])
const connectionStatus = ref<string>('')
const isConnected = ref(false)
let schedulerTimer: number | null = null
let knownHeight = 0
const isGasPriceConsistent = ref(false)
const minGasPrice = ref(0)
const avgGasPrice = ref(0)
const maxGasPrice = ref(0)
const microblocksCount = ref(0)
const nodeCache = new Map()

const onBlockClick = (block: Block) => {
    router.push(`/block/height/${block.height}`)
}

const addBlock = (block: Block) => {
    // Add new block at the beginning
    blocks.value.unshift(block)
    // Keep only the latest MAX_BLOCKS blocks
    if (blocks.value.length > MAX_BLOCKS) {
        blocks.value = blocks.value.slice(0, MAX_BLOCKS)
    }
}

function visitNode(e: Event, nodeId: string) {
    e.stopPropagation()
    router.push(`/nodes/${nodeId}`)
}

function visitOrganization(e: Event, organizationId: string) {
    e.stopPropagation()
    router.push(`/organizations/${organizationId}`)
}

function scheduleNextSynchronization() {
    schedulerTimer = setTimeout(
        () =>
            synchronize()
                .then(() => {})
                .catch((err) => {}),
        1000,
    )
}

async function getNodeInfoFromAddress(address: string) {
    if (nodeCache.has(address)) {
        return nodeCache.get(address)
    }
    let res
    try {
        const validatorNodes = await api.appControllerGetValidatorNodes({
            address,
        })
        if (validatorNodes.data.items.length === 0) {
            throw new Error('node not found')
        }
        const node = validatorNodes.data.items[0]
        const organizations = await api.appControllerGetOrganizations({
            vb_id: node.organizationId,
        })
        if (validatorNodes.data.items.length === 0) {
            throw new Error('node owner not found')
        }
        const nodeOwner = organizations.data.items[0]
        res = {
            nodeId: node.virtualBlockchainId,
            nodeOwnerName: nodeOwner.name,
            nodeOwnerId: nodeOwner.virtualBlockchainId,
        }
    } catch (err) {
        res = {
            nodeId: '',
            nodeOwnerName: '(unknown)',
            nodeOwnerId: '',
        }
    }
    nodeCache.set(address, res)
    return res
}

async function synchronize() {
    try {
        const blocks = await api.appControllerGetBlocks({
            height_gte: knownHeight + 1,
            sort: 'height',
            order: 'DESC',
            limit: MAX_BLOCKS,
        })
        if (blocks.data.items.length == 0) {
            return
        }
        knownHeight = blocks.data.items[0].height
        blocks.data.items.reverse()
        for (const block of blocks.data.items) {
            const microblocks = await api.appControllerGetMicroblocks({
                block_height: block.height,
            })
            const { nodeId, nodeOwnerId, nodeOwnerName } = await getNodeInfoFromAddress(
                block.proposerAddress,
            )
            const feesInAtomics = microblocks.data.items.reduce((total, mb) => {
                return total + mb.gas * mb.gasPrice
            }, 0)
            console.log(`got block ${block.height} with ${microblocks.data.items.length} microblocks and fees ${feesInAtomics}`)
            const newBlock: Block = {
                height: block.height,
                hash: block.hash,
                time: new Date(block.milliseconds),
                numTxs: microblocks.data.items.length,
                nodeId,
                nodeOwnerName,
                nodeOwnerId,
                fees: CMTSToken.createAtomic(feesInAtomics).getAmountAsCMTS(),
            }
            addBlock(newBlock)
        }
        const gasPrice = await appControllerGetGasPrice({
            height_gte: knownHeight - STATS_BLOCKS,
        })
        isGasPriceConsistent.value = gasPrice.data.average !== null
        minGasPrice.value = gasPrice.data.min
        maxGasPrice.value = gasPrice.data.max
        avgGasPrice.value = gasPrice.data.average
        microblocksCount.value = gasPrice.data.microblocks
    } finally {
        scheduleNextSynchronization()
    }
}

onMounted(async () => {
    try {
        synchronize()
    } catch (error) {
        console.error('Error fetching blocks:', error)
        connectionStatus.value = 'Connection Failed'
        isConnected.value = false
    } finally {
        loading.value = false
    }
})

onUnmounted(() => {
    if (schedulerTimer !== null) {
        clearInterval(schedulerTimer)
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
