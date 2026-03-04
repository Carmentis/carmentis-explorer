<template>
    <div class="page">
        <h2>Account Details</h2>

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
        </div>

        <p v-else-if="!loading" class="empty">Account not found.</p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { CryptoEncoderFactory, Hash } from '@cmts-dev/carmentis-sdk/client'
import { useBlockchainStore } from '@/stores/blockchain'

const route = useRoute()
const blockchainStore = useBlockchainStore()
const loading = ref(true)
const account = ref<{ hash: string; pk: string } | null>(null)

onMounted(async () => {
    try {
        const accountHash = route.params.accountId as string
        const blockchain = blockchainStore.getProvider
        const accountId = Hash.from(accountHash)
        const vb = await blockchain.loadAccountVirtualBlockchain(accountId)
        const encoder = CryptoEncoderFactory.defaultStringSignatureEncoder()
        const pk = await encoder.encodePublicKey(await vb.getPublicKey())

        account.value = {
            hash: accountHash,
            pk,
        }
    } catch (error) {
        console.error('Error fetching account:', error)
    } finally {
        loading.value = false
    }
})
</script>

