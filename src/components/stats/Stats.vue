<template>
    <div class="statistics-page">
        <!-- Header -->
        <div class="mb-8">
            <h2>Statistics</h2>
            <p>Blockchain metrics and historical trends</p>
        </div>

        <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading statistics...</p>
        </div>

        <!-- KPI Cards -->
        <div v-else>
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div class="px-6 py-3 bg-gray-50 border-b border-gray-200">
                    <span class="font-bold">Blockchain Metrics</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                    <!-- Row 1 -->
                    <div class="px-6 py-4">
                        <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                            Blocks
                        </div>
                        <div class="text-xl font-semibold text-gray-900">
                            <NumberDisplay :value="stats.blockCount" />
                        </div>
                    </div>

                    <div class="px-6 py-4">
                        <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                            Virtual Blockchains (total)
                        </div>
                        <div class="text-xl font-semibold text-gray-900">
                            <NumberDisplay :value="stats.vbCount" />
                        </div>
                    </div>

                    <div class="px-6 py-4">
                        <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                            Virtual Blockchains (24h)
                        </div>
                        <div class="text-xl font-semibold text-gray-900">
                            <NumberDisplay :value="stats.vbCount24h" />
                        </div>
                    </div>

                    <div class="px-6 py-4">
                        <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                            Microblocks (total)
                        </div>
                        <div class="text-xl font-semibold text-gray-900">
                            <NumberDisplay :value="stats.mbCount" />
                        </div>
                    </div>

                    <div class="px-6 py-4">
                        <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                            Microblocks (24h)
                        </div>
                        <div class="text-xl font-semibold text-gray-900">
                            <NumberDisplay :value="stats.mbCount24h" />
                        </div>
                    </div>

                    <!-- Row 2 -->
                    <div class="px-6 py-4 border-t border-gray-200">
                        <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                            Accounts
                        </div>
                        <div class="text-xl font-semibold text-gray-900">
                            <NumberDisplay :value="stats.vbTypeCount[VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN]" />
                        </div>
                    </div>

                    <div class="px-6 py-4 border-t border-gray-200">
                        <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                            Organizations
                        </div>
                        <div class="text-xl font-semibold text-gray-900">
                            <NumberDisplay :value="stats.vbTypeCount[VirtualBlockchainType.ORGANIZATION_VIRTUAL_BLOCKCHAIN]" />
                        </div>
                    </div>

                    <div class="px-6 py-4 border-t border-gray-200">
                        <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                            Nodes
                        </div>
                        <div class="text-xl font-semibold text-gray-900">
                            <NumberDisplay :value="stats.vbTypeCount[VirtualBlockchainType.NODE_VIRTUAL_BLOCKCHAIN]" />
                        </div>
                    </div>

                    <div class="px-6 py-4 border-t border-gray-200">
                        <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                            Applications
                        </div>
                        <div class="text-xl font-semibold text-gray-900">
                            <NumberDisplay :value="stats.vbTypeCount[VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN]" />
                        </div>
                    </div>

                    <div class="px-6 py-4 border-t border-gray-200">
                        <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                            Application Ledgers
                        </div>
                        <div class="text-xl font-semibold text-gray-900">
                            <NumberDisplay :value="stats.vbTypeCount[VirtualBlockchainType.APP_LEDGER_VIRTUAL_BLOCKCHAIN]" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts -->
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div class="px-6 py-3 bg-gray-50 border-b border-gray-200 font-bold">
                        Microblocks per Hour
                    </div>
                    <div class="p-6 h-96">
                        <LineChart :chartData="stats.mbChart" />
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div class="px-6 py-3 bg-gray-50 border-b border-gray-200 font-bold">
                        Virtual Blockchains per Day
                    </div>
                    <div class="p-6 h-96">
                        <LineChart :chartData="stats.vbChart" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import LineChart from '@/components/charts/LineChart.vue'
import { type LineChartData } from '@/components/charts/ChartData'
import { VirtualBlockchainType } from '@cmts-dev/carmentis-sdk-core'
import NumberDisplay from '@/components/utils/NumberDisplay.vue'
import * as api from "@/indexer-sdk/indexer-api";

const loading = ref(true)
const stats = ref<{
    blockCount: number
    mbCount: number
    mbCount24h: number
    vbCount: number
    vbCount24h: number
    vbTypeCount: number[]
    mbChart: LineChartData
    vbChart: LineChartData
} | null>(null)

onMounted(async () => {
    try {
        const chain = await api.appControllerGetChain();
        const blockCount = chain.data.height;
        const res = await api.appControllerGetMicroblockStats();
        const fetchedStats = res.data.stats;
        const mbCount = fetchedStats.reduce((total, s) => total + s.count, 0);
        const vbCount = fetchedStats.reduce((total, s) => s.isGenesis ? total + s.count : total, 0);
        const vbTypeCount = [];

        for (const s of fetchedStats) {
            if (s.isGenesis) {
                vbTypeCount[s.vbType] = s.count;
            }
        }

        const ts24hoursAgo = Date.now() - 24 * 60 * 60 * 1000;
        const res24h = await api.appControllerGetMicroblockStats({ timestamp_gte: ts24hoursAgo });
        const fetchedStats24h = res24h.data.stats;
        const mbCount24h = fetchedStats24h.reduce((total, s) => total + s.count, 0);
        const vbCount24h = fetchedStats24h.reduce((total, s) => s.isGenesis ? total + s.count : total, 0);

        const now = new Date;
        const mbChart = { label: "microblocks", labels: [], data: [] };

        for (let n = 24; n--;) {
            const hour = Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
                now.getUTCHours() - n,
            );
            const res = await api.appControllerGetMicroblockStats({
                timestamp_gte: hour,
                timestamp_lte: hour,
            });
            const mbCount = res.data.stats.reduce((total, s) => total + s.count, 0);
            mbChart.labels.push(
                new Intl.DateTimeFormat(
                    undefined,
                    { hour: "numeric", minute: "numeric" }
                ).format(hour)
            );
            mbChart.data.push(mbCount);
        }

        const vbChart = { label: "virtual blockchains", labels: [], data: [] };

        for (let n = 7; n--;) {
            const day = Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate() - n,
            );
            const res = await api.appControllerGetMicroblockStats({
                timestamp_gte: day,
                timestamp_lte: day + 23 * 60 * 60 * 1000,
            });
            const vbCount = res.data.stats.reduce((total, s) => s.isGenesis ? total + s.count : total, 0);
            vbChart.labels.push(
                new Intl.DateTimeFormat(
                    undefined,
                    { day: "numeric", month: "short" }
                ).format(day)
            );
            vbChart.data.push(vbCount);
        }

        stats.value = {
            blockCount,
            mbCount,
            mbCount24h,
            vbCount,
            vbCount24h,
            vbTypeCount,
            mbChart,
            vbChart,
        };
    } catch (error) {
        console.error('Error fetching stats:', error)
    } finally {
        loading.value = false
    }
})
</script>
