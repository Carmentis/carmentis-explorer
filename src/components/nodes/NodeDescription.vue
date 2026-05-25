<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { BalanceAvailability, CMTSToken, Hash } from '@cmts-dev/carmentis-sdk-core'
import { useBlockchainStore } from '@/stores/blockchain'
import Button from 'primevue/button'
import router from '@/router'

const route = useRoute()
const blockchainStore = useBlockchainStore()
const loading = ref(true)

// node information
type NodeInfo = {
    hash: string
    status: string
    rpc: string
    nodeOwnerName: string
    nodeOwnerOrgId: string
    publicKey: string
}

type StakeInfo = {
    staked: string
    unstaked:
        | {
              unstakingAt: string | undefined
              unstaked: string
          }
        | undefined
}

const nodeHash = route.params.nodeId as string
const node = ref<NodeInfo | null>(null)
const stake = ref<StakeInfo | null>(null)
function visitVb() {
    router.push(`/vb/${nodeHash}`)
}

onMounted(async () => {
    try {
        const blockchain = blockchainStore.getProvider
        const nodeId = Hash.from(nodeHash)
        const vb = await blockchain.loadValidatorNodeVirtualBlockchain(nodeId)
        const cometbft = await vb.getCometbftPublicKeyDeclaration()
        const rpcEndpoint = await vb.getRpcEndpointDeclaration()
        const internalState = await vb.getInternalState()
        const approvalStatus = internalState.getLastKnownApprovalStatus()

        // load the account
        const orgId = internalState.getOrganizationId()
        const orgVb = await blockchain.loadOrganizationVirtualBlockchain(orgId)
        const accountId = orgVb.getAccountId()
        const accountState = await blockchain.getAccountState(accountId.toBytes())
        const balanceAvailability =
            BalanceAvailability.createFromAccountStateAbciResponse(accountState)
        const nodeStakingLock = balanceAvailability.getNodeStakingLock(nodeId.toBytes())

        node.value = {
            hash: nodeHash,
            status: approvalStatus ? 'Validator' : 'Replicator',
            rpc: rpcEndpoint,
            nodeOwnerName: (await orgVb.getDescription()).name,
            nodeOwnerOrgId: orgId.encode(),
            publicKey: cometbft.cometbftPublicKey,
        }

        if (nodeStakingLock) {
            stake.value = {
                staked: CMTSToken.createAtomic(nodeStakingLock.lockedAmountInAtomics).toString(),
                unstaked:
                    nodeStakingLock.parameters.plannedUnlockAmountInAtomics !== 0
                        ? {
                              unstakingAt: new Date(
                                  nodeStakingLock.parameters.plannedSlashingTimestamp * 100,
                              ).toLocaleString(),
                              unstaked: CMTSToken.createAtomic(
                                  nodeStakingLock.parameters.plannedUnlockAmountInAtomics,
                              ).toString(),
                          }
                        : undefined,
            }
        }
    } catch (error) {
        console.error('Error fetching node:', error)
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <div class="page">
        <div class="flex items-center justify-between">
            <h2>Node Details</h2>
            <Button
                label="Explore Virtual Blockchain"
                icon="pi pi-external-link"
                @click="visitVb"
            />
        </div>

        <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading node details...</p>
        </div>

        <div v-if="node !== null && !loading" class="details-card">
            <div class="detail-section">
                <h3>Hash</h3>
                <p class="mono">{{ node.hash }}</p>
            </div>

            <div class="detail-section">
                <h3>Status</h3>
                <p class="mono">{{ node.status }}</p>
            </div>

            <div class="detail-section">
                <h3>CometBFT Public Key</h3>
                <p class="mono">{{ node.publicKey }}</p>
            </div>

            <div class="detail-section">
                <h3>RPC Endpoint</h3>
                <p class="mono">{{ node.rpc }}</p>
            </div>

            <div class="detail-section">
                <h3>Node Owner</h3>
                <p class="mono">{{ node.nodeOwnerName }} ({{ node.nodeOwnerOrgId }})</p>
                <Button
                    label="Explore organization"
                    @click="router.push(`/organizations/${node.nodeOwnerOrgId}`)"
                />
            </div>

            <div v-if="stake !== null" class="flex flex-col gap-8">
                <div class="detail-section">
                    <h3>Staked</h3>
                    <p class="mono">{{ stake.staked }}</p>
                </div>

                <div class="detail-section" v-if="stake.unstaked">
                    <h3>Unstaking</h3>
                    <p class="mono">
                        {{ stake.unstaked.unstakingAt }} - {{ stake.unstaked.unstaked }}
                    </p>
                </div>
            </div>
            <div v-else>
                <div class="detail-section">
                    <h3>Staked</h3>
                    <p class="mono">No stake</p>
                </div>
            </div>
        </div>

        <p v-else-if="!loading" class="empty">Node not found.</p>
    </div>
</template>
