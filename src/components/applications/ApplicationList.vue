<template>
    <div class="page">
        <h2>Applications</h2>

        <DataTable
            :value="applications"
            :loading="loading"
            stripedRows
            showGridlines
            selectionMode="single"
            @row-click="onRowClick"
            class="clickable-table"
        >
            <template #empty>
                <div class="empty-state">No applications found.</div>
            </template>
            <template #loading>
                <ProgressSpinner />
            </template>
            <Column field="hash" header="ID">
                <template #body="{ data }">
                    {{ shortenHash(data.hash) }}
                </template>
            </Column>
            <Column field="organizationId" header="Organization ID">
                <template #body="{ data }">
                    <a
                        class="font-mono text-sm text-gray-900 truncate font-medium"
                        @click="(e) => visitOrganization(e, data.organizationId)"
                    >
                        {{ shortenHash(data.organizationId) }}
                    </a>
                </template>
            </Column>
            <Column field="name" header="Name" />
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
import * as api from '@/indexer-sdk/indexer-api'

const router = useRouter()
const loading = ref(true)
const applications = ref<Application[]>([])

export interface Application {
    hash: string
    organizationId: string
    name: string
}

function visitOrganization(e: Event, organizationId: string) {
    e.stopPropagation()
    router.push(`/organizations/${organizationId}`)
}

const onRowClick = (event: DataTableRowClickEvent) => {
    router.push(`/applications/${event.data.hash}`)
}

onMounted(async () => {
    try {
        const fetchedApps = await api.appControllerGetApplications()
        applications.value = []
        for (const app of fetchedApps.data.items) {
            applications.value.push({
                hash: app.virtualBlockchainId,
                organizationId: app.organizationId,
                name: app.name,
            })
        }
    } catch (error) {
        console.error('Error fetching applications:', error)
    } finally {
        loading.value = false
    }
})
</script>
