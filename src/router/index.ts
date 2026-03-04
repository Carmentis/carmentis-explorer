import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/Home.vue'
import NodeList from '../components/nodes/NodeList.vue'
import OrganizationList from '../components/organizations/OrganizationList.vue'
import OrganizationDescription from '../components/organizations/OrganizationDescription.vue'
import ApplicationList from '../components/applications/ApplicationList.vue'
import ApplicationDescription from '../components/applications/ApplicationDescription.vue'
import AccountList from '../components/accounts/AccountList.vue'
import AccountDescription from '../components/accounts/AccountDescription.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            component: Home,
            name: 'Home',
        },
        {
            path: '/nodes',
            component: NodeList,
            name: 'NodeList',
        },
        {
            path: '/organizations',
            component: OrganizationList,
            name: 'OrganizationList',
        },
        {
            path: '/organizations/:organizationId',
            component: OrganizationDescription,
            name: 'OrganizationDescription',
        },
        {
            path: '/applications',
            component: ApplicationList,
            name: 'ApplicationList',
        },
        {
            path: '/applications/:applicationId',
            component: ApplicationDescription,
            name: 'ApplicationDescription',
        },
        {
            path: '/accounts',
            component: AccountList,
            name: 'AccountList',
        },
        {
            path: '/accounts/:accountId',
            component: AccountDescription,
            name: 'AccountDescription',
        },
    ],
})

export default router
