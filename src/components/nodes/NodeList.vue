<template>
    <div class="page">
        <h2>Validator Nodes</h2>

        <DataTable :value="nodes" :loading="loading" stripedRows showGridlines>
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
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBlockchainStore } from '@/stores/blockchain'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'

const blockchainStore = useBlockchainStore()
const loading = ref(true)
const nodes = ref<Node[]>([])

export interface Node {
    hash: string
    publicKey: string
    url: string
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
            nodes.value.push({
                hash: node.encode(),
                publicKey: pk.cometbftPublicKey,
                url: rpcEndpoint,
            })
        }
    } catch (error) {
        console.error('Error fetching nodes:', error)
    } finally {
        loading.value = false
    }
})
</script>
