import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Hash, Provider, ProviderFactory } from '@cmts-dev/carmentis-sdk/client'
import { useQuery } from '@tanstack/vue-query'

export const useBlockchainStore = defineStore('blockchain', () => {
    // Get the RPC URL from environment variables
    const rpcUrl = ref(import.meta.env.VITE_NODE_URL || 'https://ares.testnet.carmentis.io')

    // Create the provider instance
    const provider = ref<Provider | null>(null)

    // Initialize the provider
    const initProvider = () => {
        if (!provider.value) {
            provider.value = ProviderFactory.createInMemoryProviderWithExternalProvider(
                rpcUrl.value,
            )
        }
        return provider.value
    }

    // Get the provider (initialize if needed)
    const getProvider = computed(() => {
        return initProvider()
    })

    // Get the RPC URL
    const getRpcUrl = computed(() => rpcUrl.value)

    // compute the organization description
    function getOrganizationDescriptionFromOrganizationId(organizationId: string) {
        return useQuery({
            queryKey: ['organization', 'description', organizationId],
            queryFn: async () => {
                const organization = await getProvider.value.loadOrganizationVirtualBlockchain(
                    Hash.from(organizationId)
                )
                return organization.getDescription()
            },
            staleTime: Infinity,
        })
    }

    return {
        rpcUrl,
        provider,
        getProvider,
        getRpcUrl,
        initProvider,
        getOrganizationDescriptionFromOrganizationId,
    }
})
