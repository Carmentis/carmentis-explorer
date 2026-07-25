import { reactive } from 'vue'
import type { DataTablePageEvent } from 'primevue/datatable'
import { useRoute } from 'vue-router'
import { useNavigation } from '../router/navigation'
import { usePreferencesStore } from '@/stores/preferences'

const SIZE_OPTIONS = [ 10, 25, 50 ];

export function usePagination() {
    const route = useRoute();
    const navigation = useNavigation();
    const preferences = usePreferencesStore();

    return reactive({
        first: parseInt(route.query.o as string, 10) || 0,
        pageSize: sanitizeSize(parseInt(route.query.sz as string, 10) || preferences.pageSize),
        totalRecords: 0,
        sizeOptions: SIZE_OPTIONS,

        newPage: (event: DataTablePageEvent) => {
            preferences.pageSize = event.rows
            navigation.route({
                query: {
                    ...route.query,
                    o: event.first,
                    sz: event.rows,
                },
            })
        },
    });
}

function sanitizeSize(size: number) {
    const sz = SIZE_OPTIONS.map((sz) => [ sz, Math.abs(size - sz) ])
    sz.sort((a, b) => a[1] - b[1])
    return sz[0][0]
}
