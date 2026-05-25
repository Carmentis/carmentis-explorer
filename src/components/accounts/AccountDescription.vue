<template>
    <div class="page">
        <div class="flex justify-between items-center">
            <h2>Account Details</h2>
            <Button label="Explore Virtual Blockchain" @click="visitVb" />
        </div>
        <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading account details...</p>
        </div>

        <div v-if="account && !loading" class="details-card">
            <div class="detail-section">
                <h3>Hash</h3>
                <p class="mono">{{ account.hash }}</p>
            </div>
            <div class="detail-section">
                <h3>Public Key</h3>
                <p class="mono">{{ account.pk }}</p>
            </div>
            <div class="detail-section">
                <h3>Spendable</h3>
                <p class="mono">{{ account.spendable }}</p>
            </div>
            <div class="detail-section">
                <h3>Staked</h3>
                <p class="mono">{{ account.staked }}</p>
            </div>
        </div>

        <p v-else-if="!loading" class="empty">Account not found.</p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BalanceAvailability, CryptoEncoderFactory, Hash } from '@cmts-dev/carmentis-sdk-core'
import { useBlockchainStore } from '@/stores/blockchain'
import Button from 'primevue/button'

const router = useRouter()
const route = useRoute()
const accountHash = route.params.accountId as string
const blockchainStore = useBlockchainStore()
const loading = ref(true)
const account = ref<{ hash: string; pk: string; spendable: string; staked: string } | null>(null)

function visitVb() {
    router.push(`/vb/${accountHash}`)
}

onMounted(async () => {
    try {
        const blockchain = blockchainStore.getProvider
        const accountId = Hash.from(accountHash)
        const vb = await blockchain.loadAccountVirtualBlockchain(accountId)
        const encoder = CryptoEncoderFactory.defaultStringSignatureEncoder()
        const pk = await encoder.encodePublicKey(await vb.getPublicKey())
        const accountState = await blockchain.getAccountState(accountId.toBytes())
        const tokenState = BalanceAvailability.createFromAccountStateAbciResponse(accountState)
        const spendable = tokenState.getSpendable()
        const staked = tokenState.getStaked()

        account.value = {
            hash: accountHash,
            pk,
            staked: staked.toString(),
            spendable: spendable.toString(),
        }
    } catch (error) {
        console.error('Error fetching account:', error)
    } finally {
        loading.value = false
    }
})
</script>
