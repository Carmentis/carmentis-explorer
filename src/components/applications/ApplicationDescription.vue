<template>
    <div class="page">
        <h2>Application Details</h2>
        <Button class="mr-3 mb-3 h-8" icon="pi pi-link" label="Explore Virtual Blockchain" @click="visitVb" />

        <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading application details...</p>
        </div>

        <div v-if="application && !loading" class="details-card">
            <div class="cards-grid">
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
                    <p v-if="!application.website">{{ 'No website provided' }}</p>
                    <a v-else :href="application.website" target="_blank">{{ application.website  }}</a>
                </div>
                <div class="detail-section">
                    <h3>Owner</h3>
                    <p>{{ application.orgName }}</p>
                    <Button
                        class="h-8 mt-3"
                        label="See organization"
                        icon="pi pi-building"
                        @click="() => goToOrganization(application!.orgId)"
                    />
                </div>
            </div>
        </div>

        <p v-else-if="!loading" class="empty">Application not found.</p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import * as api from "@/indexer-sdk/indexer-api";

const router = useRouter()
const route = useRoute()
const appHash = route.params.applicationId as string
const loading = ref(true)
const application = ref<{
    hash: string
    name: string
    description: string
    orgId: string
    orgName: string
    website: string
} | null>(null)

function goToOrganization(orgId: string) {
    router.push(`/organizations/${orgId}`)
}

function visitVb() {
    router.push(`/vb/${appHash}`)
}

onMounted(async () => {
    try {
        const apps = await api.appControllerGetApplications({ vb_id: appHash });
        const app = apps.data.items[0];
        const orgs = await api.appControllerGetOrganizations({ vb_id: app.organizationId });
        const org = orgs.data.items[0];

        application.value = {
            hash: appHash,
            name: app.name,
            description: app.description,
            orgId: app.organizationId,
            orgName: org.name,
            website: org.website,
        }
    } catch (error) {
        console.error('Error fetching application:', error)
    } finally {
        loading.value = false
    }
})
</script>
