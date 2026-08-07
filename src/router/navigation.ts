import { useRouter } from "vue-router"

export function useNavigation() {
    const router = useRouter()

    const nav = {
        route: (route: string|object) => router.push(route),

        organization: (id: string) => nav.route(`/organizations/${id}`),
        node: (id: string) => nav.route(`/nodes/${id}`),
        nodes: () => nav.route(`/nodes`),
        validators: () => nav.route(`/nodes/validators`),
        blockByHeight: (height: number) => nav.route(`/block/height/${height}`),
        blockByHash: (hash: string) => nav.route(`/block/hash/${hash}`),
        account: (id: string) => nav.route(`/accounts/${id}`),
        accountHistory: (id: string) => nav.route(`/account-history/${id}`),
        accountHistoryHeight: (id: string, height: number) => nav.route(`/account-history/${id}/${height}`),
        application: (id: string) => nav.route(`/applications/${id}`),
        virtualBlockchain: (id: string) => nav.route(`/vb/${id}`),
        microblock: (id: string) => nav.route(`/vb/mb/${id}`),
        microblockSection: (id: string, index: number) => nav.route(`/vb/mb/${id}/${index}`),
    }

    return nav
}
