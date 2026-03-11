<template>
    <div class="page">
        <div class="flex justify-between items-center">
            <h2>Organization Details</h2>
            <Button
                label="Explore Virtual Blockchain"
                icon="pi pi-external-link"
                @click="visitVb"
            />
        </div>

        <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading organization details...</p>
        </div>

        <div v-if="organization !== null && !loading" class="details-card">
            <div class="detail-section">
                <h3>Hash</h3>
                <p class="mono">{{ organization.hash }}</p>
            </div>
            <div class="detail-section">
                <h3>Name</h3>
                <p>{{ organization.name }}</p>
            </div>
            <div class="detail-section">
                <h3>Localisation</h3>
                <p>{{ organization.localisation }}</p>
            </div>
            <div class="detail-section">
                <h3>Website</h3>
                <p>{{ organization.website }}</p>
            </div>
            <div class="detail-section">
                <h3>Account</h3>
                <p>
                    <button
                        @click="() => goToAccount(organization!.accountId)"
                        type="button"
                        class="link-button"
                    >
                        {{ organization.accountId }}
                    </button>
                </p>
            </div>
        </div>

        <p v-else-if="!loading" class="empty">Organization not found.</p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Hash } from '@cmts-dev/carmentis-sdk/client'
import { useBlockchainStore } from '@/stores/blockchain'
import Button from 'primevue/button'

const router = useRouter()
const route = useRoute()
const orgHash = route.params.organizationId as string
const blockchainStore = useBlockchainStore()
const loading = ref(true)
const organization = ref<{
    hash: string
    name: string
    localisation: string
    website: string
    accountId: string
} | null>(null)

function visitVb() {
    router.push(`/vb/${orgHash}`)
}

function goToAccount(accountId: string) {
    router.push(`/accounts/${accountId}`)
}

onMounted(async () => {
    try {
        const blockchain = blockchainStore.getProvider
        const orgId = Hash.from(orgHash)
        const vb = await blockchain.loadOrganizationVirtualBlockchain(orgId)
        const nameDeclaration = await vb.getDescription()
        const localisation = `${nameDeclaration.city} (${nameDeclaration.countryCode.toUpperCase()})`
        const website = nameDeclaration.website
        const accountId = await vb.getAccountId()
        const accountVb = await blockchain.loadAccountVirtualBlockchain(accountId)

        organization.value = {
            hash: orgHash,
            name: nameDeclaration.name,
            localisation,
            website,
            accountId: accountId.encode(),
        }
    } catch (error) {
        console.error('Error fetching organization:', error)
    } finally {
        loading.value = false
    }
})
</script>
