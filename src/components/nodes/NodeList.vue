<template>
    <div class="page">
        <h2>Validator Nodes</h2>

        <DataTable
            :value="nodes"
            :loading="loading"
            stripedRows
            showGridlines
            selectionMode="single"
            @row-click="onRowClick"
            class="clickable-table"
        >
            <template #empty>
                <div class="empty-state">No nodes found.</div>
            </template>
            <template #loading>
                <ProgressSpinner />
            </template>
            <Column field="hash" header="ID">
                <template #body="{ data }">
                    <span class="mono-cell" :title="data.hash">{{ shortenHash(data.hash) }}</span>
                </template>
            </Column>
            <Column field="owner" header="Owner">
                <template #body="{ data }">
                    <a
                        class="font-mono text-sm text-gray-900 truncate font-medium"
                        @click="(e) => visitOrganization(e, data.ownerVbId)"
                    >
                        {{ data.ownerName }}
                    </a>
                </template>
            </Column>
            <Column field="url" header="RPC URL">
                <template #body="{ data }">
                    <span class="mono-cell">{{ data.url }}</span>
                </template>
            </Column>
            <Column field="votingPower" header="Voting Power">
                <template #body="{ data }">
                    <span class="mono-cell">
                        {{
                            data.isValidator
                                ? Intl.NumberFormat().format(data.votingPower)
                                : 'Replicator'
                        }}
                    </span>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { shortenHash } from '@/utils/shortenHash'
import DataTable from 'primevue/datatable'
import type { DataTableRowClickEvent } from 'primevue/datatable';
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'
import * as api from "@/indexer-sdk/indexer-api";

const router = useRouter()
const loading = ref(true)
const nodes = ref<Node[]>([])

export interface Node {
    hash: string
    ownerName: string
    ownerVbId: string
    url: string
    votingPower: number
    isValidator: boolean
}

function onRowClick(event: DataTableRowClickEvent) {
    router.push(`/nodes/${event.data.hash}`)
}

function visitOrganization(e: Event, organizationId: string) {
    e.stopPropagation()
    router.push(`/organizations/${organizationId}`)
}

onMounted(async () => {
    try {
        const fetchedNodes = await api.appControllerGetValidatorNodes();
        nodes.value = []
        for (const node of fetchedNodes.data.items) {
            const isValidator = node.currentVotingPower > 0;
            const organizations = await api.appControllerGetOrganizations({
                vb_id: node.organizationId
            });
            const owner = organizations.data.items[0];
            nodes.value.push({
                hash: node.virtualBlockchainId,
                ownerName: owner.name,
                ownerVbId: owner.virtualBlockchainId,
                url: node.rpcEndpoint,
                isValidator: isValidator,
                votingPower: node.currentVotingPower,
            })
        }
    } catch (error) {
        console.error('Error fetching nodes:', error)
    } finally {
        loading.value = false
    }
})
</script>
