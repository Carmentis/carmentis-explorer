<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { CMTSToken, TokenUnit, Utils } from '@cmts-dev/carmentis-sdk-core'
import { getBalanceAvailability } from '@/utils/accountBalanceAvailability.ts'
import Button from 'primevue/button'
import router from '@/router'
import * as api from "@/indexer-sdk/indexer-api";

const route = useRoute()
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
const nodeObject = ref<NodeInfo | null>(null)
const stakeObject = ref<StakeInfo | null>(null)
function visitVb() {
    router.push(`/vb/${nodeHash}`)
}

onMounted(async () => {
    try {
        const nodes = await api.appControllerGetValidatorNodes({ vb_id: nodeHash });
        const node = nodes.data.items[0];
        const orgs = await api.appControllerGetOrganizations({ vb_id: node.organizationId });
        const owner = orgs.data.items[0];
        const accounts = await api.appControllerGetAccounts({ id: owner.accountId });
        const account = accounts.data.items[0];
        const balanceAvailability = getBalanceAvailability(account);
        const nodeStakingLock = balanceAvailability.getNodeStakingLock(
            Utils.binaryFromHexa(nodeHash)
        )

        nodeObject.value = {
            hash: nodeHash,
            status: node.currentVotingPower > 0 ? 'Validator' : 'Replicator',
            rpc: node.rpcEndpoint,
            nodeOwnerName: owner.name,
            nodeOwnerOrgId: node.organizationId,
            publicKey: node.cometPublicKey,
        }

        if (nodeStakingLock) {
            stakeObject.value = {
                staked: CMTSToken.createAtomic(nodeStakingLock.lockedAmountInAtomics).toString(
                    TokenUnit.TOKEN,
                    { locale: "system", grouping: true, decimalPlaces: 2 }
                ),
                unstaked:
                    nodeStakingLock.parameters.plannedUnlockAmountInAtomics !== 0
                        ? {
                              unstakingAt: new Date(
                                  nodeStakingLock.parameters.plannedSlashingTimestamp * 100,
                              ).toLocaleString(),
                              unstaked: CMTSToken.createAtomic(
                                  nodeStakingLock.parameters.plannedUnlockAmountInAtomics,
                              ).toString(
                                  TokenUnit.TOKEN,
                                  { locale: "system", grouping: true, decimalPlaces: 2 }
                              ),
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

        <div v-if="nodeObject !== null && !loading" class="details-card">
            <div class="detail-section">
                <h3>Hash</h3>
                <p class="mono">{{ nodeObject.hash }}</p>
            </div>

            <div class="detail-section">
                <h3>Status</h3>
                <p class="mono">{{ nodeObject.status }}</p>
            </div>

            <div class="detail-section">
                <h3>CometBFT Public Key</h3>
                <p class="mono">{{ nodeObject.publicKey }}</p>
            </div>

            <div class="detail-section">
                <h3>RPC Endpoint</h3>
                <p class="mono">{{ nodeObject.rpc }}</p>
            </div>

            <div class="detail-section">
                <h3>Node Owner</h3>
                <p class="mono">{{ nodeObject.nodeOwnerName }} ({{ nodeObject.nodeOwnerOrgId }})</p>
                <Button
                    label="Explore organization"
                    @click="router.push(`/organizations/${nodeObject.nodeOwnerOrgId}`)"
                />
            </div>

            <div v-if="stakeObject !== null" class="flex flex-col gap-8">
                <div class="detail-section">
                    <h3>Staked</h3>
                    <p class="mono">{{ stakeObject.staked }}</p>
                </div>

                <div class="detail-section" v-if="stakeObject.unstaked">
                    <h3>Unstaking</h3>
                    <p class="mono">
                        {{ stakeObject.unstaked.unstakingAt }} - {{ stakeObject.unstaked.unstaked }}
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
