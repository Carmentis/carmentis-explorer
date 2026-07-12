import { useRouter } from "vue-router"

export function useNavigation() {
    const router = useRouter()

    const go = {
        route: (route: string) => router.push(route),
        organization: (id: string) => go.route(`/organizations/${id}`),
        node: (id: string) => go.route(`/nodes/${id}`),
        nodes: () => go.route(`/nodes`),
        validators: () => go.route(`/nodes/validators`),
        blockByHeight: (height: number) => go.route(`/block/height/${height}`),
        blockByHash: (hash: string) => go.route(`/block/hash/${hash}`),
        account: (id: string) => go.route(`/accounts/${id}`),
        accountHistory: (id: string) => go.route(`/account-history/${id}`),
        accountHistoryHeight: (id: string, height: number) => go.route(`/account-history/${id}/${height}`),
        application: (id: string) => go.route(`/applications/${id}`),
        virtualBlockchain: (id: string) => go.route(`/vb/${id}`),
        microblock: (id: string) => go.route(`/vb/mb/${id}`),
        microblockSection: (id: string, index: string) => go.route(`/vb/mb/${id}/${index}`),
    }

    return go
}
