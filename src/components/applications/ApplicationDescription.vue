<template>
    <div class="page">
        <h2>Application Details</h2>

        <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading application details...</p>
        </div>

        <div v-if="application && !loading" class="details-card">
            <div class="detail-section">
                <h3>Hash</h3>
                <p class="mono">{{ application.hash }}</p>
            </div>
            <div class="detail-section">
                <h3>Name</h3>
                <p>{{ application.name }}</p>
            </div>
            <div class="detail-section">
                <h3>Description</h3>
                <p>{{ application.description ?? 'No description provided' }}</p>
            </div>
            <div class="detail-section">
                <h3>Owner</h3>
                <p>{{ application.orgName }} (<a :href="`/organizations/${application.orgId}`">{{application.orgId}}</a>)</p>
            </div>
        </div>

        <p v-else-if="!loading" class="empty">Application not found.</p>
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
const application = ref<{
    hash: string
    name: string
    description: string
    orgId: string
    orgName: string
} | null>(null)

onMounted(async () => {
    try {
        const appHash = route.params.applicationId as string
        const blockchain = blockchainStore.getProvider
        const appId = Hash.from(appHash)
        const vb = await blockchain.loadApplicationVirtualBlockchain(appId)
        const nameDeclaration = await vb.getApplicationDescription()
        const orgId = await vb.getOrganizationId()
        const orgVb = await blockchain.loadOrganizationVirtualBlockchain(orgId)
        const orgDesc = await orgVb.getDescription()
        const orgName = orgDesc.name

        application.value = {
            hash: appHash,
            name: nameDeclaration.name,
            description: nameDeclaration.description,
            orgId: orgId.encode(),
            orgName: orgName,
        }
    } catch (error) {
        console.error('Error fetching application:', error)
    } finally {
        loading.value = false
    }
})
</script>
