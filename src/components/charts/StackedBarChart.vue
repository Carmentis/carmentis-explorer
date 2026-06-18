<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import type { StackedBarChartData } from "./ChartData"

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
} from 'chart.js'

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
)

const props = defineProps<{
    chartData: StackedBarChartData
}>()

const data = {
    labels: props.chartData.labels,
    datasets: props.chartData.datasets.map(dataset => ({
        ...dataset,
        stack: 'main',
    })),
}

const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: true,
            position: 'bottom' as const,
        },
    },
    scales: {
        x: {
            stacked: true,
            grid: {
                display: false,
            },
        },
        y: {
            stacked: true,
            beginAtZero: true,
            grid: {
                color: '#f3f4f6',
            },
        },
    },
}
</script>

<template>
    <Bar :data="data" :options="options" />
</template>
