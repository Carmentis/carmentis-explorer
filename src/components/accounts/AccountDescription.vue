<template>
    <div class="page">
        <h2>Account Details</h2>
        <Button class="mr-3 mb-3 h-8" icon="pi pi-chart-line" label="See account history" @click="visitHistory" />
        <Button class="mr-3 mb-3 h-8" icon="pi pi-link" :disabled="accountObject?.isSpecial" label="Explore Virtual Blockchain" @click="visitVb" />
        <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading account details...</p>
        </div>

        <div v-if="accountObject && !loading">
            <div class="details-card mb-8">
                <div class="cards-grid">
                    <div class="detail-section">
                        <h3>Hash</h3>
                        <p class="mono">{{ accountObject.hash }}</p>
                    </div>
                    <div class="detail-section">
                        <h3>Type</h3>
                        {{ accountObject.type }}
                    </div>
                    <div class="detail-section">
                        <h3>Public Key</h3>
                        <p class="mono">{{ accountObject.isSpecial ? "(none)" : accountObject.pk }}</p>
                    </div>
                    <div class="detail-section">
                        <h3>Balance</h3>
                        {{ accountObject.balance }}
                    </div>
                    <div class="detail-section">
                        <h3>Spendable</h3>
                        {{ accountObject.spendable }}
                    </div>
                    <div class="detail-section">
                        <h3>Locked in Staking</h3>
                        {{ accountObject.staked }}
                    </div>
                    <div class="detail-section">
                        <h3>Locked in Vesting</h3>
                        {{ accountObject.vested }}
                    </div>
                    <div class="detail-section">
                        <h3>Locked in Escrows</h3>
                        {{ accountObject.escrowed }}
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="px-6 py-3 bg-gray-50 border-b border-gray-200 font-bold">
                    Balance Evolution
                </div>
                <div class="p-6 h-96">
                    <LineChart :chart-data="stats.balanceChart" />
                </div>
            </div>
        </div>

        <p v-else-if="!loading" class="empty">Account not found.</p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import LineChart from '@/components/charts/LineChart.vue'
import { type LineChartData } from '@/components/charts/ChartData'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import * as api from "@/indexer-sdk/indexer-api";
import {
    CMTSToken,
    TokenUnit,
    Utils,
    Economics,
    ACCOUNT_NAMES,
    ACCOUNT_STANDARD,
} from '@cmts-dev/carmentis-sdk-core'

const router = useRouter()
const route = useRoute()
const accountHash = route.params.accountId as string
const loading = ref(true)
const accountObject = ref<{
    hash: string;
    type: string;
    pk: string;
    balance: string;
    spendable: string;
    staked: string;
    vested: string;
    escrowed: string;
    isSpecial: boolean;
} | null>(null)
const stats = ref<{ balanceChart: LineChartData } | null>(null)

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
        const balance = CMTSToken.createAtomic(account.balance);
        const spendable = CMTSToken.createAtomic(account.spendable);
        const staked = CMTSToken.createAtomic(account.lockedInStaking);
        const vested = CMTSToken.createAtomic(account.lockedInVesting);
        const escrowed = CMTSToken.createAtomic(account.lockedInEscrows);
        const accountType = Economics.getAccountTypeFromIdentifier(Utils.binaryFromHexa(account.id));

        accountObject.value = {
            hash: accountHash,
            type: ACCOUNT_NAMES[accountType],
            isSpecial: accountType !== ACCOUNT_STANDARD,
            pk: account.publicKey,
            balance: balance.toString(
                TokenUnit.TOKEN,
                { locale: "system", grouping: true, decimalPlaces: 2 }
            ),
            spendable: spendable.toString(
                TokenUnit.TOKEN,
                { locale: "system", grouping: true, decimalPlaces: 2 }
            ),
            staked: staked.toString(
                TokenUnit.TOKEN,
                { locale: "system", grouping: true, decimalPlaces: 2 }
            ),
            vested: vested.toString(
                TokenUnit.TOKEN,
                { locale: "system", grouping: true, decimalPlaces: 2 }
            ),
            escrowed: escrowed.toString(
                TokenUnit.TOKEN,
                { locale: "system", grouping: true, decimalPlaces: 2 }
            ),
        }
        const balanceChart = { label: "balance", labels: [], data: [], beginAtZero: false };
        const fetchedHistory = await api.appControllerGetAccountHistory({
            account_id: accountHash,
            sort: 'height',
            order: 'DESC',
            limit: 50,
        })
        const entries = fetchedHistory.data.items;
        entries.sort((a, b) => a.height - b.height);
        for (const entry of fetchedHistory.data.items) {
            const balance = CMTSToken.createAtomic(entry.newBalance);
            balanceChart.labels.push(entry.height);
            balanceChart.data.push(balance.getAmountAsCMTS());
        }
        stats.value = { balanceChart };
    } catch (error) {
        console.error('Error fetching account:', error)
    } finally {
        loading.value = false
    }
})
</script>
