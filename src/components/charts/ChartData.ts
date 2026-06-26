export interface LineChartData {
    label: string,
    labels: string[]
    data: number[]
    beginAtZero?: boolean
};

export interface StackedBarChartData {
    labels: string[]
    datasets: {
        label: string
        data: number[]
        backgroundColor: string
    }[]
}
