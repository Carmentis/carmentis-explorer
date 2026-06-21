<template>
    <div class="page">
        <h2>Account Details</h2>
        <Button class="mr-3 mb-3 h-8" icon="pi pi-chart-line" label="See account history" @click="visitHistory" />
        <Button class="mr-3 mb-3 h-8" icon="pi pi-link" :disabled="accountObject?.isSpecial" label="Explore Virtual Blockchain" @click="visitVb" />
        <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading account details...</p>
        </div>

        <div v-if="accountObject && !loading" class="details-card">
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

        <p v-else-if="!loading" class="empty">Account not found.</p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
    spendable: string;
    staked: string;
    vested: string;
    escrowed: string;
    isSpecial: boolean;
} | null>(null)

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
