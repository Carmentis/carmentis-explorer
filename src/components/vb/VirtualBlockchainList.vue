<template>
    <div class="page">
        <h2>Last updated Virtual Blockchains</h2>

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
            <Column field="hash" header="ID">
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
                        @click="(e) => visitMicroblock(e, data.id, data.lastMicroblockHash)"
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
import { shortenHash } from '@/utils/shortenHash'
import DataTable from 'primevue/datatable'
import type { DataTableRowClickEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'
import { VB_NAME } from '@cmts-dev/carmentis-sdk-core'
import { getTimeAgo } from "@/utils/formatTime"
import * as api from '@/indexer-sdk/indexer-api'

const router = useRouter()
const loading = ref(true)
const vbs = ref<Vb[]>([])

export interface Vb {
    id: string
    type: string
    height: number
    lastModified: Date
    lastMicroblockHash: string
}

function visitMicroblock(e: Event, vbId: string, microblockHash: string) {
    e.stopPropagation()
    router.push(`/vb/${vbId}/mb/${microblockHash}`)
}

const onRowClick = (event: DataTableRowClickEvent) => {
    router.push(`/vb/${event.data.id}`)
}

onMounted(async () => {
    try {
        const fetchedVbs = await api.appControllerGetVirtualBlockchains({
            sort: 'modificationTimestamp',
            order: 'DESC',
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
    } catch (error) {
        console.error('Error fetching virtual blockchains:', error)
    } finally {
        loading.value = false
    }
})
</script>
