<script setup lang="ts">
import { useBlockchainStore } from '@/stores/blockchain.ts'
import { onMounted, ref } from 'vue'
import { Hash, Microblock, Utils } from '@cmts-dev/carmentis-sdk/client'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import { useRouter } from 'vue-router'

const router = useRouter()
const value = ref('Formatted')
const options = ref(['Formatted', 'Raw'])
const props = defineProps(['index', 'tx'])
const blockchainStore = useBlockchainStore()

async function visitMicroblock(microblockHash: string) {
    const microblockHashBytes = Utils.binaryFromHexa(microblockHash);
    const vbId = await blockchainStore.getProvider.getVirtualBlockchainIdContainingMicroblock(
        Hash.from(microblockHashBytes)
    );
    return router.push(`/vb/${vbId.encode()}/mb/${microblockHash}`)
}

const tx = props.tx
const hash = ref<string>('')
onMounted(async () => {
    const mb = Microblock.loadFromSerializedMicroblock(Utils.binaryFromHexa(tx))
    hash.value = mb.getHash().encode()
})
</script>
<template>
    <div class="flex flex-row items-center justify-between mb-8">
        <div>
            <h5>Transaction {{ index + 1 }}</h5>
        </div>
        <div class="flex flex-row items-center gap-2">
            <Button label="Explore" size="small" @click="visitMicroblock(hash)" />
            <SelectButton v-model="value" :options="options" />
        </div>
    </div>
    <div v-if="value === 'Raw'">
        <p class="mono">{{ tx }}</p>
    </div>
    <div v-else>
        <div>
            <p class="mb-2">Microblock Hash</p>
            <p class="mono">{{ hash }}</p>
        </div>
    </div>
</template>
