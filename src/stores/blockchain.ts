import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Provider, ProviderFactory } from '@cmts-dev/carmentis-sdk/client'

export const useBlockchainStore = defineStore('blockchain', () => {
  // Get the RPC URL from environment variables
  const rpcUrl = ref(import.meta.env.VITE_NODE_URL || 'https://ares.testnet.carmentis.io')

  // Create the provider instance
  const provider = ref<Provider | null>(null)

  // Initialize the provider
  const initProvider = () => {
    if (!provider.value) {
      provider.value = ProviderFactory.createInMemoryProviderWithExternalProvider(rpcUrl.value)
    }
    return provider.value
  }

  // Get the provider (initialize if needed)
  const getProvider = computed(() => {
    return initProvider()
  })

  // Get the RPC URL
  const getRpcUrl = computed(() => rpcUrl.value)

  return {
    rpcUrl,
    provider,
    getProvider,
    getRpcUrl,
    initProvider
  }
})
