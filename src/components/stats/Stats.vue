<template>
    <div class="statistics-page">
        <!-- Header -->
        <div class="mb-8">
            <h2>Statistics</h2>
            <p>Network metrics and historical trends</p>
        </div>

        <!-- KPI Cards -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div class="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <span class="font-bold">Network Statistics</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                <!-- Row 1 -->
                <div class="px-6 py-4">
                    <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                        Total Blocks
                    </div>
                    <div class="text-xl font-semibold text-gray-900">
                        {{ 0 }}
                    </div>
                </div>

                <div class="px-6 py-4">
                    <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                        Transactions
                    </div>
                    <div class="text-xl font-semibold text-gray-900">
                        {{ 0 }}
                    </div>
                </div>

                <div class="px-6 py-4">
                    <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                        Accounts
                    </div>
                    <div class="text-xl font-semibold text-gray-900">
                        {{ 0 }}
                    </div>
                </div>

                <div class="px-6 py-4">
                    <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                        Organizations
                    </div>
                    <div class="text-xl font-semibold text-gray-900">
                        {{ 0 }}
                    </div>
                </div>

                <div class="px-6 py-4">
                    <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                        Nodes
                    </div>
                    <div class="text-xl font-semibold text-gray-900">
                        {{ 0 }}
                    </div>
                </div>

                <!-- Row 2 -->
                <div class="px-6 py-4 border-t border-gray-200">
                    <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                        Avg Gas Price
                    </div>
                    <div class="text-xl font-semibold text-gray-900">
                        <AmountDisplay :atomics="0" />
                    </div>
                </div>

                <div class="px-6 py-4 border-t border-gray-200">
                    <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                        Avg Fees
                    </div>
                    <div class="text-xl font-semibold text-gray-900">
                        <AmountDisplay :atomics="0" />
                    </div>
                </div>

                <div class="px-6 py-4 border-t border-gray-200">
                    <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                        TPS
                    </div>
                    <div class="text-xl font-semibold text-gray-900">
                        {{ 0 }}
                    </div>
                </div>

                <div class="px-6 py-4 border-t border-gray-200">
                    <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                        Microblocks
                    </div>
                    <div class="text-xl font-semibold text-gray-900">
                        {{ 0 }}
                    </div>
                </div>

                <div class="px-6 py-4 border-t border-gray-200">
                    <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">
                        Validators
                    </div>
                    <div class="text-xl font-semibold text-gray-900">
                        {{ 0 }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="px-6 py-3 bg-gray-50 border-b border-gray-200">
                    Transactions per Day
                </div>
                <div class="p-6 h-96">
                    <TxChart />
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="px-6 py-3 bg-gray-50 border-b border-gray-200">
                    Block Production
                </div>
                <div class="p-6 h-96">
                    <Chart type="bar" :data="{}" />
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="px-6 py-3 bg-gray-50 border-b border-gray-200">
                    Active Accounts
                </div>
                <div class="p-6 h-96">
                    <Chart type="line" :data="{}" />
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="px-6 py-3 bg-gray-50 border-b border-gray-200">
                    Fees Collected
                </div>
                <div class="p-6 h-96">
                    <Chart type="line" :data="{}" />
                </div>
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import TxChart from '@/components/charts/TxChart.vue'
</script>
