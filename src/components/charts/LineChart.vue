<script setup lang="ts">
import { Line } from 'vue-chartjs'
import { type LineChartData } from './ChartData'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler
)

const props = defineProps<{
    chartData: LineChartData
}>()

const data = {
    labels: props.chartData.labels,
    datasets: [
        {
            label: props.chartData.label,
            data: props.chartData.data,
            borderColor: '#3b82f6', // (blue-500)
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.35,
            pointRadius: 2,
        },
    ],
}

const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false,
        },
    },
    scales: {
        x: {
            grid: {
                display: false,
            },
        },
        y: {
            beginAtZero: true,
            grid: {
                color: '#f3f4f6',
            },
        },
    },
}
</script>

<template>
    <Line :data="data" :options="options" />
</template>
