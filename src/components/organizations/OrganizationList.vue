<template>
    <div class="page">
        <h2>Organizations</h2>

        <DataTable
            :value="organizations"
            :loading="loading"
            stripedRows
            showGridlines
            selectionMode="single"
            @row-click="onRowClick"
            class="clickable-table"
        >
            <template #empty>
                <div class="empty-state">No organizations found.</div>
            </template>
            <template #loading>
                <ProgressSpinner />
            </template>
            <Column v-if="minWidth(1000)" field="hash" header="ID">
                <template #body="{ data }">
                    <span class="mono-cell mono" :title="data.hash">{{ shortenHash(data.hash) }}</span>
                </template>
            </Column>
            <Column field="name" header="Name" />
            <Column field="country" header="Country">
                <template #body="{ data }">
                    <span class="mono-cell">{{ data.countryCode }} - {{ data.country }}</span>
                </template>
            </Column>
            <Column field="city" header="City" />
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { minWidth } from '@/utils/minWidth'
import { shortenHash } from '@/utils/shortenHash'
import { getCountry } from '@/utils/countryCodes'
import DataTable from 'primevue/datatable'
import type { DataTableRowClickEvent } from 'primevue/datatable';
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'
import * as api from "@/indexer-sdk/indexer-api";

const router = useRouter()
const loading = ref(true)
const organizations = ref<Organization[]>([])

export interface Organization {
    hash: string
    name: string
    countryCode: string
    country: string
    city: string
}

const onRowClick = (event: DataTableRowClickEvent) => {
    router.push(`/organizations/${event.data.hash}`)
}

onMounted(async () => {
    try {
        const fetchedOrgs = await api.appControllerGetOrganizations();
        organizations.value = []
        for (const org of fetchedOrgs.data.items) {
            organizations.value.push({
                hash: org.virtualBlockchainId,
                name: org.name,
                countryCode: org.countryCode,
                country: getCountry(org.countryCode),
                city: org.city,
            })
        }
    } catch (error) {
        console.error('Error fetching organizations:', error)
    } finally {
        loading.value = false
    }
})
</script>
