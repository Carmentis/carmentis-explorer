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
                <h3>Website</h3>
                <p>{{ application.website ?? 'No website provided' }}</p>
            </div>
            <div class="detail-section">
                <h3>Owner</h3>
                <p>
                    {{ application.orgName }} (<button
                        @click="() => goToOrganization(application!.orgId)"
                        type="button"
                        class="link-button"
                    >
                        {{ application.orgId }}</button
                    >)
                </p>
            </div>
        </div>

        <p v-else-if="!loading" class="empty">Application not found.</p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Hash } from '@cmts-dev/carmentis-sdk/client'
import { useBlockchainStore } from '@/stores/blockchain'

const router = useRouter()
const route = useRoute()
const blockchainStore = useBlockchainStore()
const loading = ref(true)
const application = ref<{
    hash: string
    name: string
    description: string
    orgId: string
    orgName: string,
    website: string,
} | null>(null)

function goToOrganization(orgId: string) {
    router.push(`/organizations/${orgId}`)
}

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
        const appWebsite = nameDeclaration.homepageUrl

        application.value = {
            hash: appHash,
            name: nameDeclaration.name,
            description: nameDeclaration.description,
            orgId: orgId.encode(),
            orgName: orgName,
            website: appWebsite,
        }
    } catch (error) {
        console.error('Error fetching application:', error)
    } finally {
        loading.value = false
    }
})
</script>
