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
            <Column field="hash" header="Hash">
                <template #body="{ data }">
                    <span class="mono-cell" :title="data.hash">{{ data.hash }}</span>
                </template>
            </Column>
            <Column field="pk" header="Public Key">
                <template #body="{ data }">
                    <span class="mono-cell" :title="data.pk">{{ data.pk }}</span>
                </template>
            </Column>
            <Column field="balance" header="Balance">
                <template #body="{ data }">
                    <span class="mono-cell" :title="data.spendable">{{ data.spendable }}</span>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { BalanceAvailability, CryptoEncoderFactory } from '@cmts-dev/carmentis-sdk-core'
import { useBlockchainStore } from '@/stores/blockchain'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()
const blockchainStore = useBlockchainStore()
const loading = ref(true)
const accounts = ref<Account[]>([])

export interface Account {
    hash: string
    pk: string
    spendable: string
}

const onRowClick = (event: any) => {
    router.push(`/accounts/${event.data.hash}`)
}

onMounted(async () => {
    try {
        const blockchain = blockchainStore.getProvider
        const fetchedAccounts = await blockchain.getAllAccounts()
        accounts.value = []
        for (const account of fetchedAccounts) {
            const vb = await blockchain.loadAccountVirtualBlockchain(account)
            const encoder = CryptoEncoderFactory.defaultStringSignatureEncoder()
            const pk = await encoder.encodePublicKey(await vb.getPublicKey())
            const accounsState = await blockchain.getAccountState(account.toBytes())
            const balance = BalanceAvailability.createFromAccountStateAbciResponse(accounsState)
            accounts.value.push({
                hash: account.encode(),
                pk,
                spendable: balance.getSpendable().toString(),
            })
        }
    } catch (error) {
        console.error('Error fetching accounts:', error)
    } finally {
        loading.value = false
    }
})
</script>
