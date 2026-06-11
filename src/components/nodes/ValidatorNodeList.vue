<template>
    <div class="page">
        <div class="flex justify-between items-center">
            <h2>Validator Nodes</h2>
            <Button
                label="See all nodes"
                icon="pi pi-server"
                @click="visitNodes"
            />
        </div>

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
            <Column field="moniker" header="Moniker">
                <template #body="{ data }">
                    <span class="mono-cell" :title="data.moniker">{{ data.moniker }}</span>
                </template>
            </Column>
            <Column field="url" header="RPC URL">
                <template #body="{ data }">
                    <span class="mono-cell">{{ data.url }}</span>
                </template>
            </Column>
            <Column field="status" header="Status" headerClass="center-header" :bodyStyle="{ textAlign: 'center' }">
                <template #body="{ data }">
                    <span :class="['mono-cell', { 'opacity-50': data.statusIsExpired }]"><i :class="data.statusIcon"></i> {{ data.statusLabel }}</span>
                </template>
            </Column>
            <Column field="height" header="Height" headerClass="center-header" :bodyStyle="{ textAlign: 'center' }">
                <template #body="{ data }">
                    <span class="mono-cell">{{ data.height }}</span>
                </template>
            </Column>
            <Column field="latency" header="Latency" headerClass="center-header" :bodyStyle="{ textAlign: 'center' }">
                <template #body="{ data }">
                    <span class="mono-cell">{{ data.latency }}ms</span>
                </template>
            </Column>
            <Column field="txInMempool" header="TX in Mempool" headerClass="center-header" :bodyStyle="{ textAlign: 'center' }">
                <template #body="{ data }">
                    <span class="mono-cell">{{ data.txInMempool }}</span>
                </template>
            </Column>
            <Column field="votingPower" header="Voting Power">
                <template #body="{ data }">
                    <span class="mono-cell">
                        {{ Intl.NumberFormat().format(data.votingPower) }}
                    </span>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import type { DataTableRowClickEvent } from 'primevue/datatable';
import Column from 'primevue/column'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import * as api from "@/indexer-sdk/indexer-api";

const router = useRouter()
const loading = ref(true)
const nodes = ref<Node[]>([])
const isMounted = ref(false);
let schedulerTimer: number | null = null

export interface Node {
    hash: string
    moniker: string
    url: string
    statusIcon: string
    statusLabel: string
    votingPower: number
    latency: number
    height: number
    txInMempool: number
}

function onRowClick(event: DataTableRowClickEvent) {
    router.push(`/nodes/${event.data.hash}`)
}

function visitOrganization(e: Event, organizationId: string) {
    e.stopPropagation()
    router.push(`/organizations/${organizationId}`)
}

function visitNodes(e: Event) {
    e.stopPropagation()
    router.push(`/nodes`)
}

const NodeStatus = {
    "OK": { icon: "pi pi-check-circle", label: "OK" },
    "SYNC": { icon: "pi pi-sync", label: "Syncing" },
    "DOWN": { icon: "pi pi-times-circle", label: "Unreachable" },
    "BAD": { icon: "pi pi-question-circle", label: "Invalid" },
    "UNKNOWN": { icon: "", label: "(pending)" }
};

function scheduleNextSynchronization() {
    schedulerTimer = setTimeout(
        () =>
            synchronize()
                .then(() => {})
                .catch((err) => {}),
        1000,
    )
}

async function synchronize() {
    try {
        for (const index in nodes.value) {
            const status = await api.appControllerGetNodeStatus({
                node_id: nodes.value[index].hash,
            });
            nodes.value[index] = {
                ...nodes.value[index],
                statusIcon: NodeStatus[status.data.status].icon,
                statusLabel: NodeStatus[status.data.status].label,
                latency: status.data.latency,
                height: status.data.height,
                txInMempool: status.data.txInMempool,
            }
        }
    } finally {
        if (isMounted.value) {
            scheduleNextSynchronization()
        }
    }
}

onMounted(async () => {
    isMounted.value = true;
    try {
        const fetchedNodes = await api.appControllerGetValidatorNodes({
            is_validator: true
        });
        nodes.value = []
        for (const node of fetchedNodes.data.items) {
            const status = await api.appControllerGetNodeStatus({
                node_id: node.virtualBlockchainId,
            });

            const nodeObject = {
                hash: node.virtualBlockchainId,
                moniker: status.data.moniker,
                url: node.rpcEndpoint,
                statusIcon: NodeStatus[status.data.status].icon,
                statusLabel: NodeStatus[status.data.status].label,
                votingPower: node.currentVotingPower,
                latency: status.data.latency,
                height: status.data.height,
                txInMempool: status.data.txInMempool,
            };

            nodes.value.push(nodeObject);
        }
    } catch (error) {
        console.error('Error fetching nodes:', error)
    } finally {
        loading.value = false
        scheduleNextSynchronization()
    }
})

onUnmounted(() => {
    isMounted.value = false;
    if (schedulerTimer !== null) {
        clearTimeout(schedulerTimer)
    }
})
</script>
