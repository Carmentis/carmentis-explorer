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
            <Column field="hash" header="Hash">
                <template #body="{ data }">
                    <span class="mono-cell" :title="data.hash">{{ data.hash }}</span>
                </template>
            </Column>
            <Column field="name" header="Name" />
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
const organizations = ref<Organization[]>([])

export interface Organization {
    hash: string
    name: string
}

const onRowClick = (event: any) => {
    router.push(`/organizations/${event.data.hash}`)
}

onMounted(async () => {
    try {
        const blockchain = blockchainStore.getProvider
        const fetchedOrgs = await blockchain.getAllOrganizationIds()
        organizations.value = []
        for (const org of fetchedOrgs) {
            const vb = await blockchain.loadOrganizationVirtualBlockchain(org)
            const nameDeclaration = await vb.getDescription()
            organizations.value.push({
                hash: org.encode(),
                name: nameDeclaration.name,
            })
        }
    } catch (error) {
        console.error('Error fetching organizations:', error)
    } finally {
        loading.value = false
    }
})
</script>

