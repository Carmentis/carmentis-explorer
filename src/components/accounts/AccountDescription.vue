<template>
    <div class="page">
        <div class="flex justify-between items-center">
            <h2>Account Details</h2>
            <div class="flex gap-2">
                <Button icon="pi pi-chart-line" label="See account history" @click="visitHistory" />
                <Button icon="pi pi-external-link" label="Explore Virtual Blockchain" @click="visitVb" />
            </div>
        </div>
        <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading account details...</p>
        </div>

        <div v-if="accountObject && !loading" class="details-card">
            <div class="detail-section">
                <h3>Hash</h3>
                <p class="mono">{{ accountObject.hash }}</p>
            </div>
            <div class="detail-section">
                <h3>Public Key</h3>
                <p class="mono">{{ accountObject.pk }}</p>
            </div>
            <div class="detail-section">
                <h3>Spendable</h3>
                <p class="mono">{{ accountObject.spendable }}</p>
            </div>
            <div class="detail-section">
                <h3>Staked</h3>
                <p class="mono">{{ accountObject.staked }}</p>
            </div>
        </div>

        <p v-else-if="!loading" class="empty">Account not found.</p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getBalanceAvailability } from '@/utils/accountBalanceAvailability.ts'
import Button from 'primevue/button'
import * as api from "@/indexer-sdk/indexer-api";
import { TokenUnit } from '@cmts-dev/carmentis-sdk-core'

const router = useRouter()
const route = useRoute()
const accountHash = route.params.accountId as string
const loading = ref(true)
const accountObject = ref<{ hash: string; pk: string; spendable: string; staked: string } | null>(null)

function visitHistory() {
    router.push(`/account-history/${accountHash}`)
}

function visitVb() {
    router.push(`/vb/${accountHash}`)
}

onMounted(async () => {
    try {
        const accounts = await api.appControllerGetAccounts({ id: accountHash });
        const account = accounts.data.items[0];
        const balanceAvaibility = getBalanceAvailability(account);
        const spendable = balanceAvaibility.getSpendable();
        const staked = balanceAvaibility.getStaked();

        accountObject.value = {
            hash: accountHash,
            pk: account.publicKey,
            staked: staked.toString(
                TokenUnit.TOKEN,
                { locale: "system", grouping: true, decimalPlaces: 2 }
            ),
            spendable: spendable.toString(
                TokenUnit.TOKEN,
                { locale: "system", grouping: true, decimalPlaces: 2 }
            ),
        }
    } catch (error) {
        console.error('Error fetching account:', error)
    } finally {
        loading.value = false
    }
})
</script>
