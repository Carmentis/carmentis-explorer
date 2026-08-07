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

        <div v-if="organization !== null && !loading">
            <div class="details-card">
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
                        <p class="mono">
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
            <div v-for="cert in certificates" class="details-card mt-4">
                <h3>Certificates</h3>
                <div class="cards-grid">
                    <div class="detail-section">
                        <h3>Microblock</h3>
                        <p class="mono">
                            <a
                                @click.stop="navigation.microblockSection(cert.microblockHash, cert.sectionIndex)"
                                class="cursor-pointer"
                                type="button"
                            >
                            {{ cert.microblockHash }}
                            </a>
                        </p>
                    </div>
                </div>
                <div v-for="(entry, ndx) in cert.content" class="mt-4">
                    <h4>Certificate {{ ndx + 1 }}</h4>
                    <div class="cards-grid mt-2">
                        <div class="detail-section">
                            <p>Issuer: {{ entry.issuer }}</p>
                            <p>Subject: {{ entry.subject }}</p>
                            <p>Valid from: {{ formatDate(entry.notBefore) }}</p>
                            <p>Valid until: {{ formatDate(entry.notAfter) }}</p>
                            <p>Serial Number: {{ entry.serialNumber }}</p>
                        </div>
                    </div>
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
import * as api from "@/indexer-sdk/indexer-api"
import { useNavigation } from '@/router/navigation'
import { formatDate } from "@/utils/formatTime"
import {
    SdJwt,
    IdentifierParser,
    JwkParser,
    X509,
    type PublicKey
} from "@cmts-dev/carmentis-sdk-vc"

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

interface CertificateContent {
    subject: string,
    issuer: string,
    notBefore: Date,
    notAfter: Date,
    serialNumber: string,
    publicKey: PublicKey,
}

interface Certificate {
    microblockHash: string,
    sectionIndex: number,
    content: CertificateContent[],
}

const certificates = ref<Certificate[]>([])

onMounted(async () => {
    try {
        const orgs = await api.appControllerGetOrganizations({ vb_id: orgHash });
        const org = orgs.data.items[0];
        const localisation = `${org.city} (${org.countryCode.toUpperCase()})`
        const website = org.website
        const accountId = org.accountId;
        const certs = await api.appControllerGetOrganizationCertificates({ vb_id: orgHash });

        for (const certificate of certs.data.items) {
            const sdJwt = new SdJwt(certificate.jwt);
            const issuer = await sdJwt.getIssuer();
            const issuerId = IdentifierParser.parse(issuer);

            if (issuerId.type == "did" && issuerId.method == "jwk") {
                const parsedJwk = JwkParser.parse(issuerId.value);

                if (parsedJwk.x5c) {
                    const chain = X509.decodeX5c(parsedJwk.x5c);
                    const entry: Certificate = {
                        microblockHash: certificate.microblockHash,
                        sectionIndex: certificate.sectionIndex,
                        content: chain.map((e) => ({
                            subject: e.subject,
                            issuer: e.issuer,
                            notBefore: e.notBefore,
                            notAfter: e.notAfter,
                            publicKey: e.publicKey,
                            serialNumber: e.serialNumber,
                        }))
                    };
                    certificates.value.push(entry);
                }
            }
        }

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
