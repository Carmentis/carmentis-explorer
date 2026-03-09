<template>
    <div class="page">
        <h2>Validator Nodes</h2>

        <DataTable :value="nodes" :loading="loading" stripedRows showGridlines @row-click="onRowClick">
            <template #empty>
                <div class="empty-state">No nodes found.</div>
            </template>
            <template #loading>
                <ProgressSpinner />
            </template>
            <Column field="hash" header="Hash">
                <template #body="{ data }">
                    <span class="mono-cell" :title="data.hash">{{ data.hash }}</span>
                </template>
            </Column>
            <Column field="publicKey" header="Public Key">
                <template #body="{ data }">
                    <span class="mono-cell" :title="data.publicKey">{{ data.publicKey }}</span>
                </template>
            </Column>
            <Column field="url" header="RPC URL">
                <template #body="{ data }">
                    <span class="mono-cell">{{ data.url }}</span>
                </template>
            </Column>
            <Column field="validator" header="Validator">
                <template #body="{ data }">
                    <span class="mono-cell">{{ data.isValidator ? 'Validator' : 'Replicator' }}</span>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBlockchainStore } from '@/stores/blockchain'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()
const blockchainStore = useBlockchainStore()
const loading = ref(true)
const nodes = ref<Node[]>([])

export interface Node {
    hash: string
    publicKey: string
    url: string
    isValidator: boolean
}

function onRowClick(event: any) {
    router.push(`/nodes/${event.data.hash}`)
}

onMounted(async () => {
    try {
        const blockchain = blockchainStore.getProvider
        const fetchedNodes = await blockchain.getAllValidatorNodes()
        nodes.value = []
        for (const node of fetchedNodes) {
            const vb = await blockchain.loadValidatorNodeVirtualBlockchain(node)
            const rpcEndpoint = await vb.getRpcEndpointDeclaration()
            const pk = await vb.getCometbftPublicKeyDeclaration()
            const isValidator = (await vb.getInternalState()).getLastKnownApprovalStatus()
            nodes.value.push({
                hash: node.encode(),
                publicKey: pk.cometbftPublicKey,
                url: rpcEndpoint,
                isValidator: isValidator,
            })
        }
    } catch (error) {
        console.error('Error fetching nodes:', error)
    } finally {
        loading.value = false
    }
})
</script>
