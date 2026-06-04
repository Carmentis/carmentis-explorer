export function formatTime(date: Date): string {
    return new Date(date).toLocaleString()
}

export function getTimeAgo(date: Date): string {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000)

    if (diffInSeconds < 2) {
        return `just now`
    }
    if (diffInSeconds < 60) {
        return formatAgo(diffInSeconds, 'sec');
    }
    if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60)
        return formatAgo(minutes, 'min');
    }
    if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600)
        return formatAgo(hours, 'hour');
    }
    const days = Math.floor(diffInSeconds / 86400)
    return formatAgo(days, 'day');
}

function formatAgo(n: number, word: string) {
    return `${n} ${word}${n > 1 ? 's' : ''} ago`;
}
