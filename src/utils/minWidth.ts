import { useWindowSize } from '@vueuse/core';

const { width } = useWindowSize();

/**
 * Returns 'true' if the window width is at least 'px'.
 * @param {number} px
 * @returns {boolean}
 */
export function minWidth(px: number): boolean {
    return width.value >= px;
}
