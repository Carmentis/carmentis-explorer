export function shortenHash(hash: string, head = 16, tail = 4): string {
    if (hash.length <= head + tail) {
        return hash;
    }
    return hash.slice(0, head) + "⋯" + hash.slice(hash.length - tail);
}
