<template>
    <div class="page">
        <h2>Organization Details</h2>

        <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading organization details...</p>
        </div>

        <div v-if="organization && !loading" class="details-card">
            <div class="detail-section">
                <h3>Hash</h3>
                <p class="mono">{{ organization.hash }}</p>
            </div>
            <div class="detail-section">
                <h3>Name</h3>
                <p>{{ organization.name }}</p>
            </div>
        </div>

        <p v-else-if="!loading" class="empty">Organization not found.</p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Hash } from '@cmts-dev/carmentis-sdk/client'
import { useBlockchainStore } from '@/stores/blockchain'

const route = useRoute()
const blockchainStore = useBlockchainStore()
const loading = ref(true)
const organization = ref<{ hash: string; name: string } | null>(null)

onMounted(async () => {
    try {
        const orgHash = route.params.organizationId as string
        const blockchain = blockchainStore.getProvider
        const orgId = Hash.from(orgHash)
        const vb = await blockchain.loadOrganizationVirtualBlockchain(orgId)
        const nameDeclaration = await vb.getDescription()

        organization.value = {
            hash: orgHash,
            name: nameDeclaration.name,
        }
    } catch (error) {
        console.error('Error fetching organization:', error)
    } finally {
        loading.value = false
    }
})
</script>

