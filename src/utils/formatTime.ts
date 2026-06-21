// The locale used for all dates and times.
// Could be set to 'undefined' to use the user's locale instead.
const LOCALE = "en-US";

/**
 * Formats date and time according to LOCALE.
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date: Date): string {
    return new Date(date).toLocaleString(LOCALE)
}

/**
 * Formats day + month according to LOCALE.
 * @param {Date} day
 * @returns {string}
 */
export function formatDay(day: Date): string {
    return new Intl.DateTimeFormat(
        LOCALE,
        { day: "numeric", month: "short" }
    ).format(day);
}

/**
 * Formats hours + minutes according to LOCALE.
 * @param {Date} hour
 * @returns {string}
 */
export function formatHour(hour: Date): string {
    return new Intl.DateTimeFormat(
        LOCALE,
        { hour: "numeric", minute: "numeric" }
    ).format(hour)
}

/**
 * Formats a date as 'X sec/min/hour/day ago'.
 * @param {Date} date
 * @returns {string}
 */
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
    return `${n} ${word}${n !== 1 ? 's' : ''} ago`;
}
