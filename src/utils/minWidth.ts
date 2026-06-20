import { useWindowSize } from '@vueuse/core';

const { width } = useWindowSize();

export function minWidth(px: number) {
    return width.value >= px;
}
