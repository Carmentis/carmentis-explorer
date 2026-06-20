<template>
    <div class="page">
        <h2>Last updated Virtual Blockchains</h2>
        <SelectButton
            class="mb-3"
            v-model="vbType"
            :options="vbOptions"
            optionLabel="label"
            optionValue="value"
            @change="vbSelect"
            :allowEmpty="false"
        />
        <DataTable
            :value="vbs"
            :loading="loading"
            stripedRows
            showGridlines
            selectionMode="single"
            @row-click="onRowClick"
            class="clickable-table"
        >
            <template #empty>
                <div class="empty-state">No virtual blockchains found.</div>
            </template>
            <template #loading>
                <ProgressSpinner />
            </template>
            <Column v-if="minWidth(1000)" field="hash" header="ID">
                <template #body="{ data }">
                    <span class="mono-cell mono" :title="data.id">{{ shortenHash(data.id) }}</span>
                </template>
            </Column>
            <Column field="type" header="Type" />
            <Column field="height" header="Height" />
            <Column field="lastModified" header="Last modified">
                <template #body="{ data }">
                    <span class="mono-cell" :title="data.lastModified">{{
                        getTimeAgo(data.lastModified)
                    }}</span>
                </template>
            </Column>
            <Column field="lastMicroblockHash" header="Last microblock">
                <template #body="{ data }">
                    <a
                        class="font-mono text-sm text-gray-900 truncate font-medium"
                        @click="(e) => visitMicroblock(e, data.lastMicroblockHash)"
                    >
                        {{ shortenHash(data.lastMicroblockHash) }}
                    </a>
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
import DataTable from 'primevue/datatable'
import type { DataTableRowClickEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'
import SelectButton from 'primevue/selectbutton'
import { VB_NAME, VirtualBlockchainType } from '@cmts-dev/carmentis-sdk-core'
import { getTimeAgo } from "@/utils/formatTime"
import * as api from '@/indexer-sdk/indexer-api'

const router = useRouter()
const loading = ref(true)
const vbs = ref<Vb[]>([])
interface Option {
    label: string;
    value: number;
}
const vbOptions = ref<Option[]>([
    { label: 'All', value: -1 },
    { label: 'Protocol', value: VirtualBlockchainType.PROTOCOL_VIRTUAL_BLOCKCHAIN },
    { label: 'Accounts', value: VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN },
    { label: 'Organizations', value: VirtualBlockchainType.ORGANIZATION_VIRTUAL_BLOCKCHAIN },
    { label: 'Nodes', value: VirtualBlockchainType.NODE_VIRTUAL_BLOCKCHAIN },
    { label: 'Applications', value: VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN },
    { label: 'App. Ledgers', value: VirtualBlockchainType.APP_LEDGER_VIRTUAL_BLOCKCHAIN },
])
const vbType = ref<Number>(-1)

export interface Vb {
    id: string
    type: string
    height: number
    lastModified: Date
    lastMicroblockHash: string
}

async function vbSelect(event: any) {
    loading.value = true
    try {
        await load(event.value)
    } finally {
        loading.value = false
    }
}

function visitMicroblock(e: Event, microblockHash: string) {
    e.stopPropagation()
    router.push(`/vb/mb/${microblockHash}`)
}

const onRowClick = (event: DataTableRowClickEvent) => {
    router.push(`/vb/${event.data.id}`)
}

async function load(type: number) {
    const fetchedVbs = await api.appControllerGetVirtualBlockchains({
        sort: 'modificationTimestamp',
        order: 'DESC',
        ...type !== -1 && { type },
    })
    vbs.value = []
    for (const vb of fetchedVbs.data.items) {
        vbs.value.push({
            id: vb.virtualBlockchainId,
            height: vb.height,
            type: VB_NAME[vb.type],
            lastModified: new Date(vb.modificationTimestamp * 1000),
            lastMicroblockHash: vb.lastMicroblockHash,
        })
    }
}

onMounted(async () => {
    try {
        await load(-1)
    } catch (error) {
        console.error('Error fetching virtual blockchains:', error)
    } finally {
        loading.value = false
    }
})
</script>
