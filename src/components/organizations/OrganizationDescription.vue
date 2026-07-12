<template>
    <div class="page">
        <h2>Organization Details</h2>
        <Button
            class="mr-3 mb-3 h-8"
            label="Explore Virtual Blockchain"
            icon="pi pi-link"
            @click="navigation.virtualBlockchain(orgHash)"
        />

        <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading organization details...</p>
        </div>

        <div v-if="organization !== null && !loading" class="details-card">
            <div class="cards-grid">
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
                    <p v-if="!organization.website">{{ 'No website provided' }}</p>
                    <a v-else :href="organization.website" target="_blank">{{
                        organization.website
                    }}</a>
                </div>
                <div class="detail-section">
                    <h3>Account</h3>
                    <p>
                        <a
                            @click.stop="navigation.account(organization!.accountId)"
                            class="cursor-pointer"
                            type="button"
                        >
                            {{ organization.accountId }}
                        </a>
                    </p>
                </div>
            </div>
        </div>

        <p v-else-if="!loading" class="empty">Organization not found.</p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import * as api from "@/indexer-sdk/indexer-api";
import { useNavigation } from '@/router/navigation'

const navigation = useNavigation();

const route = useRoute()
const orgHash = route.params.organizationId as string
const loading = ref(true)
const organization = ref<{
    hash: string
    name: string
    localisation: string
    website: string
    accountId: string
} | null>(null)

onMounted(async () => {
    try {
        const orgs = await api.appControllerGetOrganizations({ vb_id: orgHash });
        const org = orgs.data.items[0];
        const localisation = `${org.city} (${org.countryCode.toUpperCase()})`
        const website = org.website
        const accountId = org.accountId;

        organization.value = {
            hash: orgHash,
            name: org.name,
            localisation,
            website,
            accountId,
        }
    } catch (error) {
        console.error('Error fetching organization:', error)
    } finally {
        loading.value = false
    }
})
</script>
