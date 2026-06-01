<template>
    <div class="page">
        <h2>Accounts</h2>

        <DataTable
            :value="accounts"
            :loading="loading"
            stripedRows
            showGridlines
            selectionMode="single"
            @row-click="onRowClick"
            class="clickable-table"
        >
            <template #empty>
                <div class="empty-state">No accounts found.</div>
            </template>
            <template #loading>
                <ProgressSpinner />
            </template>
            <Column field="hash" header="ID">
                <template #body="{ data }">
                    <span class="mono-cell" :title="data.hash">{{ shortenHash(data.hash) }}</span>
                </template>
            </Column>
            <Column field="pk" header="Public Key">
                <template #body="{ data }">
                    <span class="mono-cell" :title="data.pk">{{ shortenHash(data.pk, 20, 4) || "(none)" }}</span>
                </template>
            </Column>
            <Column field="balance" header="Balance">
                <template #body="{ data }">
                    <span class="mono-cell" :title="data.balance">{{ data.balance }}</span>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { CMTSToken, TokenUnit } from '@cmts-dev/carmentis-sdk-core'
import { shortenHash } from '@/utils/shortenHash'
import DataTable from 'primevue/datatable'
import type { DataTableRowClickEvent } from 'primevue/datatable';
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'
import * as api from "@/indexer-sdk/indexer-api";

const router = useRouter()
const loading = ref(true)
const accounts = ref<Account[]>([])

export interface Account {
    hash: string
    pk: string
    balance: string
}

const onRowClick = (event: DataTableRowClickEvent) => {
    router.push(`/accounts/${event.data.hash}`)
}

onMounted(async () => {
    try {
        const fetchedAccounts = await api.appControllerGetAccounts({
            sort: "balance",
            order: "DESC",
        });
        accounts.value = []
        for (const account of fetchedAccounts.data.items) {
            accounts.value.push({
                hash: account.id,
                pk: account.publicKey,
                balance: CMTSToken.createAtomic(account.balance).toString(
                    TokenUnit.TOKEN,
                    { locale: "system", grouping: true, decimalPlaces: 2 }
                ),
            })
        }
    } catch (error) {
        console.error('Error fetching accounts:', error)
    } finally {
        loading.value = false
    }
})
</script>
