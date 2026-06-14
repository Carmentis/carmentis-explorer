<template>
    <aside :class="['sidebar', { open: isOpen }]">
        <nav class="sidebar-nav">
            <template v-for="item in menuItems" :key="item.path || item.label">
                <button v-if="item.command" class="nav-item w-full flex items-center justify-start text-left cursor-pointer" @click="item.command" type="button">
                    <i :class="item.icon" class="nav-icon"></i>
                    <span class="nav-label">{{ item.label }}</span>
                </button>
                <a
                    v-else-if="item.external"
                    :href="item.external"
                    class="nav-item"
                    rel="noopener noreferrer"
                >
                    <i :class="item.icon" class="nav-icon"></i>
                    <span class="nav-label">{{ item.label }}</span>
                    <i class="pi pi-external-link nav-chevron"></i>
                </a>
                <router-link
                    v-else
                    :to="item.path"
                    class="nav-item"
                    :class="{ active: isActiveRoute(item.path) }"
                    @click="closeSidebarOnMobile"
                >
                    <i :class="item.icon" class="nav-icon"></i>
                    <span class="nav-label">{{ item.label }}</span>
                    <i v-if="isActiveRoute(item.path)" class="pi pi-chevron-right nav-chevron"></i>
                </router-link>
            </template>
        </nav>

        <div class="sidebar-footer">
            <Divider />
            <div class="footer-content">
                <i class="pi pi-info-circle"></i>
                <span class="footer-text">Carmentis Explorer v1.0</span>
            </div>
        </div>
    </aside>
    <div v-if="isOpen" class="sidebar-overlay" @click="closeSidebar"></div>

    <Dialog
        v-model:visible="showSearchDialog"
        modal
        header="Search Blockchain"
        :style="{ width: '40rem' }"
        :closable="true"
    >
        <template #header>
            <div class="search-dialog-header">
                <i class="pi pi-search"></i>
                <span>Search Blockchain</span>
            </div>
        </template>

        <div class="search-content">
            <p class="search-description">
                Search for accounts, applications, organizations, nodes, microblocks or blocks by
                height
            </p>

            <div class="search-input-container">
                <IconField iconPosition="left">
                    <InputIcon class="pi pi-search" />
                    <InputText
                        v-model="searchQuery"
                        placeholder="Enter hash, block height, entity name, ..."
                        class="search-input"
                        @input="onSearchInput"
                        @keyup.enter="(e) => navigateToFirstResult(e)"
                        autofocus
                    />
                </IconField>
            </div>

            <Message v-if="searchError" severity="error" :closable="false">
                {{ searchError }}
            </Message>

            <div v-if="searching" class="search-loading">
                <ProgressSpinner style="width: 50px; height: 50px" />
                <p>Searching...</p>
            </div>

            <div v-if="searchResults.length > 0" class="search-results">
                <h4 class="results-title">{{ searchResults.length }} {{ searchResults.length > 1 ? "results" : "result" }} found:</h4>
                <div class="results-list">
                    <div
                        v-for="(result, index) in searchResults"
                        :key="index"
                        class="result-item"
                        @click="(e) => navigateToResult(e, result)"
                    >
                        <i :class="result.icon" class="result-icon"></i>
                        <div class="result-info">
                            <span class="result-type">{{ result.type }}</span>
                            <span class="result-id">ID: {{ result.id }}</span>
                            <span class="result-id">Field: {{ result.matchedFieldName }}</span>
                            <span class="result-id">Value: {{ result.matchedFieldValue }}</span>
                        </div>
                        <i class="pi pi-chevron-right"></i>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="search-footer">
                <Button label="Close" severity="secondary" @click="closeSearchDialog" />
            </div>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Divider from 'primevue/divider'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import * as api from "@/indexer-sdk/indexer-api";
import { AppControllerSearchType } from "@/indexer-sdk/model/appControllerSearchType";

const showSearchDialog = ref(false)
const searchQuery = ref('')
const searching = ref(false)
const searchError = ref('')
const searchResults = ref<
    Array<{
        type: string
        id: string
        icon: string
        route: string
        matchedFieldName: string
        matchedFieldValue: string
    }>
>([])
let searchTimeout = null

const router = useRouter()
const route = useRoute()
const isOpen = inject<{ value: boolean }>('sidebarOpen')
const closeSidebar = inject<() => void>('closeSidebar')

const closeSidebarOnMobile = () => {
    if (window.innerWidth <= 1024) {
        closeSidebar?.()
    }
}

const closeSearchDialog = () => {
    showSearchDialog.value = false
    searchQuery.value = ''
    searchError.value = ''
    searchResults.value = []
    if (searchTimeout) {
        clearTimeout(searchTimeout)
        searchTimeout = null
    }
}

const onSearchInput = () => {
    if (searchTimeout) {
        clearTimeout(searchTimeout)
    }

    if (!searchQuery.value.trim()) {
        searchResults.value = []
        searchError.value = ''
        return
    }

    searchTimeout = setTimeout(() => {
        performSearch()
    }, 300)
}

const performSearch = async () => {
    if (!searchQuery.value.trim()) return

    searching.value = true
    searchError.value = ''
    searchResults.value = []

    const results: Array<{
        type: string
        id: string
        icon: string
        route: string
        matchedFieldName: string
        matchedFieldValue: string
    }> = []

    const query = searchQuery.value.trim()
    const searchList = await api.appControllerSearch({ q: query, type: "all" })

    for (const result of searchList.data.items) {
        switch (result.type) {
            case AppControllerSearchType.account: {
                results.push({
                    type: 'Account',
                    id: result.id,
                    icon: 'pi pi-user',
                    route: `/accounts/${result.id}`,
                    matchedFieldName: result.matchedFieldName,
                    matchedFieldValue: result.matchedFieldValue,
                })
                break;
            }
            case AppControllerSearchType.application: {
                results.push({
                    type: 'Application',
                    id: result.id,
                    icon: 'pi pi-mobile',
                    route: `/applications/${result.id}`,
                    matchedFieldName: result.matchedFieldName,
                    matchedFieldValue: result.matchedFieldValue,
                })
                break;
            }
            case AppControllerSearchType.block: {
                results.push({
                    type: 'Block',
                    id: result.id,
                    icon: 'pi pi-box',
                    route: `/block/height/${result.id}`,
                    matchedFieldName: result.matchedFieldName,
                    matchedFieldValue: result.matchedFieldValue,
                })
                break;
            }
            case AppControllerSearchType.microblock: {
                results.push({
                    type: 'Microblock',
                    id: result.id,
                    icon: 'pi pi-file',
                    route: `/mb/${result.id}`,
                    matchedFieldName: result.matchedFieldName,
                    matchedFieldValue: result.matchedFieldValue,
                })
                break;
            }
            case AppControllerSearchType.node: {
                results.push({
                    type: 'Node',
                    id: result.id,
                    icon: 'pi pi-server',
                    route: `/nodes/${result.id}`,
                    matchedFieldName: result.matchedFieldName,
                    matchedFieldValue: result.matchedFieldValue,
                })
                break;
            }
            case AppControllerSearchType.organization: {
                results.push({
                    type: 'Organization',
                    id: result.id,
                    icon: 'pi pi-building',
                    route: `/organizations/${result.id}`,
                    matchedFieldName: result.matchedFieldName,
                    matchedFieldValue: result.matchedFieldValue,
                })
                break;
            }
            case AppControllerSearchType.vb: {
                results.push({
                    type: 'Virtual Blockchain',
                    id: result.id,
                    icon: 'pi pi-link',
                    route: `/vb/${result.id}`,
                    matchedFieldName: result.matchedFieldName,
                    matchedFieldValue: result.matchedFieldValue,
                })
                break;
            }
        }
    }

    searchResults.value = results

    if (results.length === 0) {
        searchError.value = 'No results found'
    }
    searching.value = false
}

const navigateToResult = (e: Event, result: { route: string }) => {
    e.stopPropagation();
    closeSearchDialog();
    router.push(result.route);
}

const navigateToFirstResult = (e: Event) => {
    if (searchResults.value.length > 0) {
        navigateToResult(e, searchResults.value[0]);
    }
}

const menuItems = [
    {
        label: 'Search',
        icon: 'pi pi-search',
        command: () => (showSearchDialog.value = true),
    },
    {
        label: 'Home',
        icon: 'pi pi-home',
        path: '/',
    },
    {
        label: 'Statistics',
        icon: 'pi pi-chart-bar',
        path: '/stats',
    },
    {
        label: 'Nodes',
        icon: 'pi pi-server',
        path: '/nodes',
    },
    {
        label: 'Organizations',
        icon: 'pi pi-building',
        path: '/organizations',
    },
    {
        label: 'Applications',
        icon: 'pi pi-mobile',
        path: '/applications',
    },
    {
        label: 'Accounts',
        icon: 'pi pi-user',
        path: '/accounts',
    },
    {
        label: 'Account History',
        icon: 'pi pi-chart-line',
        path: '/account-history',
    },
    {
        label: 'Virtual Blockchains',
        icon: 'pi pi-link',
        path: '/vb',
    },
    {
        label: 'Proof Checker',
        icon: 'pi pi-verified',
        external: import.meta.env.VITE_PROOFCHECKER_URL,
    },
]

const isActiveRoute = (path: string) => {
    if (path === '/') {
        return route.path === '/'
    }
    return route.path.startsWith(path)
}
</script>

<style scoped>
.sidebar {
    width: var(--sidebar-width);
    position: fixed;
    top: var(--navbar-height);
    left: 0;
    bottom: 0;
    overflow-y: auto;
    background: linear-gradient(180deg, var(--p-surface-0) 0%, var(--p-surface-50) 100%);
    border-right: 1px solid var(--p-surface-200);
    display: flex;
    flex-direction: column;
}

.sidebar-header {
    padding: var(--spacing-xl) var(--spacing-lg) var(--spacing-md);
}

.sidebar-header h3 {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--p-sky-500);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.sidebar-nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-sm);
}

.nav-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md) var(--spacing-md);
    color: var(--p-text-color);
    text-decoration: none;
    border-radius: var(--p-border-radius);
    transition: all 0.2s ease;
    position: relative;
    font-weight: 500;
}

.nav-item:hover {
    background: var(--p-sky-50);
    color: var(--p-sky-600);
    transform: translateX(4px);
}

.nav-item.active {
    background: linear-gradient(90deg, var(--p-sky-500) 0%, var(--p-sky-600) 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.nav-item.active:hover {
    transform: translateX(4px);
    background: linear-gradient(90deg, var(--p-sky-600) 0%, var(--p-sky-700) 100%);
}

.nav-icon {
    font-size: 1.25rem;
    width: 1.5rem;
    text-align: center;
}

.nav-label {
    flex: 1;
    font-size: var(--font-size-sm);
}

.nav-chevron {
    font-size: 0.875rem;
    margin-left: auto;
    animation: slideIn 0.2s ease;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(-4px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.sidebar-footer {
    margin-top: auto;
    padding: var(--spacing-md) var(--spacing-lg);
}

.footer-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--p-text-muted-color);
    font-size: var(--font-size-xs);
}

.footer-text {
    font-weight: 500;
}

.sidebar-overlay {
    display: none;
}

/* Tablet and Mobile Styles */
@media (max-width: 1024px) {
    .sidebar {
        transform: translateX(-100%);
        transition: transform var(--transition-base);
        z-index: 99;
        box-shadow: var(--shadow-lg);
    }

    .sidebar.open {
        transform: translateX(0);
    }

    .sidebar-overlay {
        display: block;
        position: fixed;
        top: var(--navbar-height);
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 98;
        animation: fadeIn 0.2s;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
}

/* Scrollbar Styling */
.sidebar::-webkit-scrollbar {
    width: 6px;
}

.sidebar::-webkit-scrollbar-track {
    background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
    background: var(--p-surface-300);
    border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
    background: var(--p-surface-400);
}

/* Search Dialog Styles */
.search-dialog-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--p-sky-500);
}

.search-dialog-header i {
    font-size: 1.5rem;
}

.search-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
}

.search-description {
    color: var(--p-text-muted-color);
    font-size: var(--font-size-sm);
    margin: 0;
}

.search-input-container {
    width: 100%;
}

.search-input {
    width: 100%;
}

.search-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-xl);
}

.search-results {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.results-title {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--p-text-color);
    margin: 0;
}

.results-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
}

.result-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--p-surface-50);
    border: 1px solid var(--p-surface-200);
    border-radius: var(--p-border-radius);
    cursor: pointer;
    transition: all 0.2s ease;
}

.result-item:hover {
    background: var(--p-sky-50);
    border-color: var(--p-sky-200);
    transform: translateX(4px);
}

.result-icon {
    font-size: 1.25rem;
    color: var(--p-sky-500);
}

.result-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
}

.result-type {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--p-text-color);
}

.result-id {
    font-size: var(--font-size-xs);
    color: var(--p-text-muted-color);
    font-family: monospace;
    word-break: break-all;
}

.result-item .pi-chevron-right {
    color: var(--p-text-muted-color);
    font-size: 0.875rem;
}

.search-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm);
}
</style>
