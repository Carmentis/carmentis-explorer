<template>
    <div class="page">
        <h2>
            {{ route.params.accountId !== undefined ? 'Account History' : 'Latest Operations' }}
        </h2>

        <DataTable
            :value="history"
            :loading="loading"
            stripedRows
            showGridlines
            selectionMode="single"
            @row-click="onRowClick"
            class="clickable-table"
        >
            <template #empty>
                <div class="empty-state">No history found.</div>
            </template>
            <template #loading>
                <ProgressSpinner />
            </template>
            <Column field="accountId" header="Account">
                <template #body="{ data }">
                    <a
                        class="mono text-sm text-gray-900 truncate font-medium"
                        @click="(e) => visitAccount(e, data.accountId)"
                    >
                        {{ shortenHash(data.accountId) }}
                    </a>
                </template>
            </Column>
            <Column field="linkedAccountId" header="Linked Account">
                <template #body="{ data }">
                    <a
                        class="mono text-sm text-gray-900 truncate font-medium"
                        @click="(e) => visitAccount(e, data.linkedAccountId)"
                    >
                        {{ shortenHash(data.linkedAccountId) }}
                    </a>
                </template>
            </Column>
            <Column field="timestamp" header="Date">
                <template #body="{ data }">
                    <span class="mono-cell" :title="data.timestamp">{{
                        getTimeAgo(data.timestamp)
                    }}</span>
                </template>
            </Column>
            <Column field="type" header="Operation">
                <template #body="{ data }">
                    <i v-if="data.incoming" class="pi pi-arrow-down-left mr-1"></i>
                    <i v-if="!data.incoming" class="pi pi-arrow-up-right mr-1"></i>
                    <span class="mono-cell ml-2" :title="data.type">{{ data.type }}</span>
                </template>
            </Column>
            <Column field="chainReference" header="Chain ref.">
                <template #body="{ data }">
                    <a
                        class="text-sm text-gray-900 truncate font-medium"
                        @click="(e) => router.push(data.chainRefLink)"
                    >
                        {{ data.chainRefName }}
                    </a>
                </template>
            </Column>
            <Column field="amount" header="Amount" />
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { shortenHash } from '@/utils/shortenHash.ts'
import type { DataTableRowClickEvent } from 'primevue/datatable'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'
import {
    BK_NAMES,
    BK_PLUS,
    CMTSToken,
    TokenUnit,
    Utils,
    BlockchainUtils,
    Base64,
    ChainReferenceType,
} from '@cmts-dev/carmentis-sdk-core'
import { getTimeAgo } from '@/utils/formatTime'
import * as api from '@/indexer-sdk/indexer-api.ts'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const history = ref<AccountHistory[]>([])

export interface AccountHistory {
    accountId: string
    height: number
    linkedAccountId: string
    timestamp: Date
    incoming: boolean
    type: string
    chainRefName: string
    chainRefLink: string
    amount: string
}

const onRowClick = (event: DataTableRowClickEvent) => {
    router.push(`/account-history/${event.data.accountId}/${event.data.height}`)
}

function visitAccount(e: Event, accountId: string) {
    e.stopPropagation()
    router.push(`/accounts/${accountId}`)
}

onMounted(async () => {
    try {
        const accountId =
            typeof route.params.accountId === 'string' ? route.params.accountId : undefined
        const fetchedHistory = await api.appControllerGetAccountHistory({
            account_id: accountId,
            sort: 'timestamp',
            order: 'DESC',
        })
        history.value = []
        fetchedHistory.data.items.sort((a, b) => b.timestamp - a.timestamp || b.height - a.height)
        for (const entry of fetchedHistory.data.items) {
            const encodedChainRef = Base64.decodeBinary(entry.chainReference, Base64.BASE64);
            const chainRef = BlockchainUtils.decodeChainReference(encodedChainRef);
            let chainRefName = "(unknown)";
            let chainRefLink = "";

            switch (chainRef.type) {
                case ChainReferenceType.BLOCK: {
                    chainRefName = `Block ${chainRef.height}`;
                    chainRefLink = `/block/height/${chainRef.height}`;
                    break;
                }
                case ChainReferenceType.MICROBLOCK: {
                    chainRefName = "Microblock";
                    chainRefLink = `/vb/mb/${Utils.binaryToHexa(chainRef.microblockHash)}`;
                    break;
                }
                case ChainReferenceType.SECTION: {
                    chainRefName = "Section";
                    chainRefLink = `/vb/mb/${Utils.binaryToHexa(chainRef.microblockHash)}/${chainRef.sectionIndex}`;
                    break;
                }
            }

            history.value.push({
                accountId: entry.accountId,
                height: entry.height,
                linkedAccountId: entry.linkedAccountId,
                timestamp: new Date(entry.timestamp * 1000),
                incoming: !!(entry.type & BK_PLUS),
                type: BK_NAMES[entry.type],
                chainRefName,
                chainRefLink,
                amount: CMTSToken.createAtomic(entry.amount).toString(
                    TokenUnit.TOKEN,
                    { locale: "system", grouping: true, decimalPlaces: 3 }
                ),
            })
        }
    } catch (error) {
        console.error('Error fetching organizations:', error)
    } finally {
        loading.value = false
    }
})
</script>
