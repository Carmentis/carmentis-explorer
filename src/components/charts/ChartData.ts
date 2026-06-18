export interface LineChartData {
    label: string,
    labels: string[]
    data: number[]
};

export interface StackedBarChartData {
    labels: string[]
    datasets: {
        label: string
        data: number[]
        backgroundColor: string
    }[]
}
