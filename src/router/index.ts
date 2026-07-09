import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/Home.vue'
import Stats from '../components/stats/Stats.vue'
import NodeList from '../components/nodes/NodeList.vue'
import ValidatorNodeList from '../components/nodes/ValidatorNodeList.vue'
import NodeDescription from '../components/nodes/NodeDescription.vue'
import OrganizationList from '../components/organizations/OrganizationList.vue'
import OrganizationDescription from '../components/organizations/OrganizationDescription.vue'
import ApplicationList from '../components/applications/ApplicationList.vue'
import ApplicationDescription from '../components/applications/ApplicationDescription.vue'
import AccountList from '../components/accounts/AccountList.vue'
import AccountHistoryList from '../components/accountHistory/AccountHistoryList.vue'
import AccountHistoryOperation from '../components/accountHistory/AccountHistoryOperation.vue'
import AccountDescription from '../components/accounts/AccountDescription.vue'
import BlockDescription from '../components/blocks/BlockDescription.vue'
import VirtualBlockchain from '@/components/vb/VirtualBlockchain.vue'
import VirtualBlockchainList from '@/components/vb/VirtualBlockchainList.vue'
import MicroblockInVirtualBlockchain from '@/components/vb/MicroblockInVirtualBlockchain.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            component: Home,
            name: 'Home',
        },
        {
            path: '/stats',
            component: Stats,
            name: 'Stats',
            meta: { title: 'Carmentis Explorer - Stats & Charts' },
        },
        {
            path: '/nodes',
            component: NodeList,
            name: 'NodeList',
            meta: { title: 'Carmentis Explorer - Nodes' },
        },
        {
            path: '/nodes/validators',
            component: ValidatorNodeList,
            name: 'ValidatorNodeList',
            meta: { title: 'Carmentis Explorer - Validator Nodes' },
        },
        {
            path: '/nodes/:nodeId',
            component: NodeDescription,
            name: 'NodeDescription',
            meta: { title: 'Node' },
        },
        {
            path: '/organizations',
            component: OrganizationList,
            name: 'OrganizationList',
            meta: { title: 'Organizations' },
        },
        {
            path: '/organizations/:organizationId',
            component: OrganizationDescription,
            name: 'OrganizationDescription',
            meta: { title: 'Organization' },
        },
        {
            path: '/applications',
            component: ApplicationList,
            name: 'ApplicationList',
            meta: { title: 'Applications' },
        },
        {
            path: '/applications/:applicationId',
            component: ApplicationDescription,
            name: 'ApplicationDescription',
            meta: { title: 'Application' },
        },
        {
            path: '/accounts',
            component: AccountList,
            name: 'AccountList',
            meta: { title: 'Accounts' },
        },
        {
            path: '/account-history',
            component: AccountHistoryList,
            name: 'AccountHistoryList',
            meta: { title: 'Account History' },
        },
        {
            path: '/account-history/:accountId',
            component: AccountHistoryList,
            name: 'AccountHistoryListForAccount',
            meta: { title: 'Account History' },
        },
        {
            path: '/account-history/:accountId/:height',
            component: AccountHistoryOperation,
            name: 'AccountHistoryOperation',
            meta: { title: 'Account History' },
        },
        {
            path: '/accounts/:accountId',
            component: AccountDescription,
            name: 'AccountDescription',
            meta: { title: 'Account' },
        },
        {
            path: '/block/hash/:blockHash',
            component: BlockDescription,
            name: 'BlockDescriptionByHash',
            meta: { title: 'Block' },
        },
        {
            path: '/block/height/:blockHeight',
            component: BlockDescription,
            name: 'BlockDescriptionByHeight',
            meta: { title: 'Block' },
        },
        {
            path: '/vb',
            component: VirtualBlockchainList,
            name: 'VirtualBlockchainList',
            meta: { title: 'Virtual Blockchains' },
        },
        {
            path: '/vb/:vbId',
            component: VirtualBlockchain,
            name: 'VirtualBlockchain',
            meta: { title: 'Virtual Blockchain' },
        },
        {
            path: '/vb/mb/:mbHash',
            component: MicroblockInVirtualBlockchain,
            name: 'Microblock',
            meta: { title: 'Microblock' },
        },
        {
            path: '/vb/mb/:mbHash/:sectionIndex',
            component: MicroblockInVirtualBlockchain,
            name: 'MicroblockSection',
            meta: { title: 'Microblock' },
        },
    ],
    scrollBehavior(to) {
        if (to.hash) {
            console.log("scrollBehavior scrolling to", to.hash);
            return {
                el: to.hash,
                behavior: 'smooth',
            }
        }
        return { top: 0 }
    },
})


router.afterEach((to) => {
    const title = to.meta.title as string;
    document.title = title ? `Carmentis Explorer - ${title}` : "Carmentis Explorer";
});

export default router
