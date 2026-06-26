<template>
    <div class="page">
        <h2>Nodes</h2>
        <Button
            class="mr-3 mb-3 h-8"
            label="See real-time activity of validators"
            icon="pi pi-chart-bar"
            @click="visitValidators"
        />

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
            <Column v-if="minWidth(1000)" field="hash" header="ID">
                <template #body="{ data }">
                    <span class="mono-cell mono" :title="data.hash">{{ shortenHash(data.hash) }}</span>
                </template>
            </Column>
            <Column field="moniker" header="Moniker">
                <template #body="{ data }">
                    <span class="mono-cell" :title="data.moniker">{{ data.moniker }}</span>
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
            <Column field="status" header="Status" headerClass="center-header" :bodyStyle="{ textAlign: 'center' }">
                <template #body="{ data }">
                    <span :class="['mono-cell', { 'opacity-50': data.statusIsExpired }]"><i :class="data.statusIcon"></i> {{ data.statusLabel }}</span>
                </template>
            </Column>
            <Column field="votingPower" header="Staking">
                <template #body="{ data }">
                    <span v-if="data.isValidator" class="mono-cell">
                        <NumberDisplay :value="data.votingPower" />
                    </span>
                    <span v-else class="mono-cell">Replicator</span>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { minWidth } from '@/utils/minWidth'
import { shortenHash } from '@/utils/shortenHash'
import NumberDisplay from '@/components/utils/NumberDisplay.vue'
import DataTable from 'primevue/datatable'
import type { DataTableRowClickEvent } from 'primevue/datatable';
import Column from 'primevue/column'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import * as api from "@/indexer-sdk/indexer-api";

const router = useRouter()
const loading = ref(true)
const nodes = ref<Node[]>([])

const NODE_STATUS_LIFESPAN = 10000;

export interface Node {
    hash: string
    moniker: string
    ownerName: string
    ownerVbId: string
    statusIcon: string
    statusLabel: string
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

function visitValidators(e: Event) {
    e.stopPropagation()
    router.push(`/nodes/validators`)
}

const NodeStatus = {
    "OK": { icon: "pi pi-check-circle", label: "OK" },
    "SYNC": { icon: "pi pi-sync", label: "Syncing" },
    "DOWN": { icon: "pi pi-times-circle", label: "Unreachable" },
    "BAD": { icon: "pi pi-question-circle", label: "Invalid" },
    "UNKNOWN": { icon: "", label: "(pending)" }
};

onMounted(async () => {
    try {
        const fetchedNodes = await api.appControllerGetValidatorNodes();
        nodes.value = []
        for (const node of fetchedNodes.data.items) {
            const isValidator = node.currentVotingPower > 0;

            const nodeObject = {
                hash: node.virtualBlockchainId,
                moniker: node.moniker,
                ownerName: shortenHash(node.organizationId),
                ownerVbId: node.organizationId,
                statusIcon: NodeStatus[node.status].icon,
                statusLabel: NodeStatus[node.status].label,
                isValidator: isValidator,
                votingPower: node.currentVotingPower,
            };

            const index = nodes.value.push(nodeObject) - 1;

            api.appControllerGetOrganizations({
                vb_id: node.organizationId
            })
            .then((answer) => {
                const owner = answer.data.items[0];
                nodes.value[index] = {
                    ...nodes.value[index],
                    ownerName: owner.name,
                }
            });

            if (node.statusTimestamp + NODE_STATUS_LIFESPAN < Date.now()) {
                api.appControllerGetNodeStatus({ node_id: node.virtualBlockchainId })
                .then((answer) => {
                    nodes.value[index] = {
                        ...nodes.value[index],
                        statusIcon: NodeStatus[answer.data.status].icon,
                        statusLabel: NodeStatus[answer.data.status].label,
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error fetching nodes:', error)
    } finally {
        loading.value = false
    }
})
</script>
