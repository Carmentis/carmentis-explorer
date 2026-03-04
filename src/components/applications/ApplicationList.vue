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
const applications = ref<Application[]>([])

export interface Application {
    hash: string
    name: string
}

const onRowClick = (event: any) => {
    router.push(`/applications/${event.data.hash}`)
}

onMounted(async () => {
    try {
        const blockchain = blockchainStore.getProvider
        const fetchedApps = await blockchain.getAllApplicationIds()
        applications.value = []
        for (const app of fetchedApps) {
            const vb = await blockchain.loadApplicationVirtualBlockchain(app)
            const nameDeclaration = await vb.getApplicationDescription()
            applications.value.push({
                hash: app.encode(),
                name: nameDeclaration.name,
            })
        }
    } catch (error) {
        console.error('Error fetching applications:', error)
    } finally {
        loading.value = false
    }
})
</script>

