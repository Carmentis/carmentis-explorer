<script setup lang="ts">
import { ref, onMounted } from 'vue'
import StackedBarChart from '@/components/charts/StackedBarChart.vue'
import { type StackedBarChartData } from '@/components/charts/ChartData'
import { useRoute } from 'vue-router'
import { formatHour } from '@/utils/formatTime'
import { CMTSToken, TokenUnit, Utils } from '@cmts-dev/carmentis-sdk-core'
import { getBalanceAvailability } from '@/utils/accountBalanceAvailability.ts'
import Button from 'primevue/button'
import * as api from "@/indexer-sdk/indexer-api";
import { useNavigation } from '@/router/navigation'

const navigation = useNavigation();

const route = useRoute()
const loading = ref(true)

// node information
type NodeInfo = {
    hash: string
    status: string
    moniker: string
    rpc: string
    nodeOwnerName: string
    nodeOwnerOrgId: string
    publicKey: string
    address: string
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
const stats = ref<{ blocksChart: StackedBarChartData } | null>(null)

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
            moniker: node.moniker,
            rpc: node.rpcEndpoint,
            nodeOwnerName: owner.name,
            nodeOwnerOrgId: node.organizationId,
            publicKey: node.cometPublicKey,
            address: node.address,
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

        const now = new Date;
        const blocksChart = {
            labels: [],
            datasets: [
                { label: "signed", data: [], backgroundColor: "#93c5fd" },
                { label: "proposed", data: [], backgroundColor: "#2563eb" },
            ]
        };

        for (let n = 24; n--;) {
            const hour = Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
                now.getUTCHours() - n,
            );
            const res = await api.appControllerGetValidatorStats({
                node_id: nodeHash,
                timestamp_gte: hour,
                timestamp_lte: hour,
            });
            blocksChart.labels.push(formatHour(new Date(hour)));
            blocksChart.datasets[0].data.push(res.data.stats?.[0]?.signedBlocks ?? 0);
            blocksChart.datasets[1].data.push(res.data.stats?.[0]?.proposedBlocks ?? 0);
        }
        stats.value = { blocksChart }
    } catch (error) {
        console.error('Error fetching node:', error)
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <div class="page">
        <h2>Node Details</h2>
        <Button
            class="mr-3 mb-3 h-8"
            label="Explore Virtual Blockchain"
            icon="pi pi-link"
            @click="navigation.virtualBlockchain(nodeHash)"
        />

        <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading node details...</p>
        </div>

        <div v-if="nodeObject !== null && !loading">
            <div class="details-card mb-8">
                <div class="cards-grid">
                    <div class="detail-section">
                        <h3>Hash</h3>
                        <p class="mono">{{ nodeObject.hash }}</p>
                    </div>

                    <div class="detail-section">
                        <h3>Status</h3>
                        <p>{{ nodeObject.status }}</p>
                    </div>

                    <div class="detail-section">
                        <h3>Moniker</h3>
                        <p class="mono">{{ nodeObject.moniker }}</p>
                    </div>

                    <div class="detail-section">
                        <h3>CometBFT Public Key</h3>
                        <p class="mono">{{ nodeObject.publicKey }}</p>
                    </div>

                    <div class="detail-section">
                        <h3>CometBFT Address</h3>
                        <p class="mono">{{ nodeObject.address }}</p>
                    </div>

                    <div class="detail-section">
                        <h3>RPC Endpoint</h3>
                        <p>{{ nodeObject.rpc }}</p>
                    </div>

                    <div class="detail-section">
                        <h3>Owner</h3>
                        <p>{{ nodeObject.nodeOwnerName }}</p>
                        <Button
                            class="h-8 mt-3"
                            label="See organization"
                            icon="pi pi-building"
                            @click="navigation.organization(nodeObject.nodeOwnerOrgId)"
                        />
                    </div>

                    <div v-if="stakeObject !== null" class="flex flex-col gap-8">
                        <div class="detail-section">
                            <h3>Staked</h3>
                            <p>{{ stakeObject.staked }}</p>
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
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="px-6 py-3 bg-gray-50 border-b border-gray-200 font-bold">
                    Proposed and Signed Blocks per Hour
                </div>
                <div class="p-6 h-96">
                    <StackedBarChart :chart-data="stats.blocksChart" />
                </div>
            </div>
        </div>
        <p v-else-if="!loading" class="empty">Node not found.</p>
    </div>
</template>
