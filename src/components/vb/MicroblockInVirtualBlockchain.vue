<template>
    <div class="page">
        <h2>Microblock Details</h2>
        <Button
            class="mr-3 mb-3 h-8"
            icon="pi pi-link"
            label="Explore Virtual Blockchain"
            @click="navigation.virtualBlockchain(microblock.header.vbId)"
        />
        <Button
            class="mr-3 mb-3 h-8"
            icon="pi pi-check-circle"
            label="Microblock Proof"
            @click="showProof()"
        />

        <div v-if="loading" class="loading">
            <ProgressSpinner />
            <p>Loading microblock details...</p>
        </div>

        <div v-if="microblock && !loading" class="details-container">
            <!-- Block -->
            <div class="details-card">
                <h3>Block</h3>
                <div class="cards-grid">
                    <div class="detail-section">
                        <h4>Height</h4>
                        <p>
                            <a class="cursor-pointer" @click.stop="navigation.blockByHeight(microblock.blockHeight)">
                                {{ microblock.blockHeight }}
                            </a>
                        </p>
                    </div>
                </div>
            </div>
            <!-- Microblock Header -->
            <div class="details-card">
                <h3>Microblock Header</h3>
                <div class="cards-grid">
                    <div class="detail-section">
                        <h4>Microblock Hash</h4>
                        <p class="mono">{{ microblock.header.hash }}</p>
                    </div>
                    <div class="detail-section">
                        <h4>Virtual Blockchain ID</h4>
                        <p class="mono">
                            <a
                                @click.stop="navigation.virtualBlockchain(microblock.header.vbId)"
                                class="cursor-pointer"
                                type="button"
                            >
                                {{ microblock.header.vbId }}
                            </a>
                        </p>
                    </div>
                    <div class="detail-section">
                        <h4>Size</h4>
                        {{ microblock.header.size }} bytes
                    </div>
                    <div class="detail-section">
                        <h4>Gas Price</h4>
                        {{ microblock.header.gasPrice }}
                    </div>
                    <div class="detail-section">
                        <h4>Paid fees</h4>
                        {{ microblock.header.paidFees }}
                    </div>
                    <div class="detail-section">
                        <h4>Previous Hash</h4>
                        <p class="mono">
                            <a v-if="microblock.header.height > 1"
                                @click.stop="navigation.microblock(microblock.header.previousHash)"
                                class="cursor-pointer"
                                type="button"
                            >
                                {{ microblock.header.previousHash }}
                            </a>
                            <div v-else>
                                {{ microblock.header.previousHash }}
                            </div>
                        </p>
                    </div>
                    <div class="detail-section">
                        <h4>Height</h4>
                        <p class="mono">{{ microblock.header.height }}</p>
                    </div>
                    <div class="detail-section">
                        <h4>Timestamp</h4>
                        <p>{{ formatDate(microblock.header.timestamp) }}</p>
                    </div>
                    <div class="detail-section">
                        <h4>Signed by</h4>
                        <p class="mono">
                            <a class="cursor-pointer" @click.stop="navigation.account(microblock.header.signer)">
                                {{ microblock.header.signer }}
                            </a>
                        </p>
                    </div>
                    <div class="detail-section">
                        <h4>Signature</h4>
                        <p>{{ microblock.header.signature }}</p>
                    </div>
                </div>
            </div>

            <!-- Microblock Body -->
            <div class="details-card">
                <h3>Microblock Body</h3>
                <div class="detail-section">
                    <h4>Sections ({{ microblock.body.transactions.length }})</h4>
                    <div v-if="microblock.body.transactions.length > 0" class="transactions-list">
                        <div
                            v-for="(tx, index) in microblock.body.transactions"
                            :key="index"
                            :id="`section-${index}`"
                            :class="['transaction-item', { 'active-section': index === sectionIndex }]"
                        >
                            <MicroblockInVirtualBlockchainSection
                                :serializedMb="microblock.serializedMb"
                                :section-index="index"
                                :section="JSON.parse(tx)"
                            />
                        </div>
                    </div>
                    <p v-else class="empty">No transactions in this microblock</p>
                </div>
            </div>
        </div>

        <p v-else-if="!loading" class="empty">Microblock not found.</p>

        <ProofDialog
            v-model:open="showProofDialog"
            :hash="mbHash"
            :type="`microblock`"
            :title="`Microblock Anchoring Proof`"
            :identifierName="`Microblock Hash`"
            :description="`The anchoring proof cryptographically demonstrates that this microblock and its content are included in the Carmentis blockchain state. The resulting state hash is automatically verified against multiple nodes.`"
        />
    </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { onMounted, ref } from 'vue'
import { Base64, Microblock, Utils } from '@cmts-dev/carmentis-sdk-core'
import ProgressSpinner from 'primevue/progressspinner'
import Button from 'primevue/button'
import MicroblockInVirtualBlockchainSection from '@/components/vb/MicroblockInVirtualBlockchainSection.vue'
import ProofDialog from '@/components/proofs/ProofDialog.vue'
import { formatDate } from "@/utils/formatTime"
import * as api from "@/indexer-sdk/indexer-api";
import { useNavigation } from '@/router/navigation'

const navigation = useNavigation();

interface MicroblockData {
    serializedMb: Uint8Array
    blockHeight: number
    header: {
        vbId: string
        size: number
        gasPrice: string
        paidFees: string
        hash: string
        previousHash: string
        height: number
        timestamp: Date
        signature: string
        signer: string
    }
    body: {
        transactions: string[]
    }
}
const route = useRoute()
const mbHash = ref(route.params.mbHash as string)
const sectionIndex = ref(parseInt((route.params?.sectionIndex ?? "") as string))
const loading = ref(true)
const showProofDialog = ref<boolean>(false)
const microblock = ref<MicroblockData | null>(null)

function showProof() {
    showProofDialog.value = true
}

onMounted(async () => {
    try {
        const microblocks = await api.appControllerGetMicroblocks({
            hash: mbHash.value,
            include_content: true,
        });
        if (microblocks.data.items.length === 0) {
            throw new Error('Microblock not found');
        }
        const requestedMicroblock = microblocks.data.items[0];
        const serializedData = Base64.decodeBinary(requestedMicroblock.content);
        const mb = Microblock.loadFromSerializedMicroblock(serializedData);
        const gasPrice = mb.getGasPrice().toString()
        const paidFees = mb.getFees().toString()

        const signature = Utils.binaryToHexa(mb.getLastSignatureSection().signature)
        const signerAccount = mb.getFeesPayerAccount()

        microblock.value = {
            serializedMb: mb.serialize().microblockData,
            blockHeight: requestedMicroblock.blockHeight,
            header: {
                vbId: requestedMicroblock.virtualBlockchainId,
                size: serializedData.length,
                gasPrice,
                paidFees,
                hash: mb.getHash().encode(),
                previousHash: mb.getPreviousHash().encode(),
                height: mb.getHeight(),
                timestamp: mb.getTimestampAsDate(),
                signature,
                signer: Utils.binaryToHexa(signerAccount),
            },
            body: {
                transactions: mb.getAllSections().map((tx) => JSON.stringify(tx)),
            },
        }
    } catch (error) {
        console.error('Error fetching microblock:', error)
    } finally {
        setTimeout(
            () => {
                const el = document.getElementById(`section-${sectionIndex.value}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth' })
                }
            },
            100
        );
        loading.value = false
    }
})
</script>

<style scoped>
.transaction-item.active-section {
    border: 3px solid var(--p-surface-500);
}

.details-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
}

.transactions-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    margin-top: var(--spacing-md);
}

.transaction-item {
    padding: var(--spacing-md);
    background: var(--p-surface-50);
    border-radius: var(--p-border-radius);
    border: 1px solid var(--p-surface-200);
}

.transaction-item h5 {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--p-sky-500);
}

.transaction-item p {
    margin: var(--spacing-xs) 0;
    word-break: break-all;
}

.loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-2xl);
}
</style>
