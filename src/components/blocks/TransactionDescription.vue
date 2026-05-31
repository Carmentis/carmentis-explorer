<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Microblock, Base64 } from '@cmts-dev/carmentis-sdk-core'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import { useRouter } from 'vue-router'
import * as api from "@/indexer-sdk/indexer-api";

const router = useRouter()
const value = ref('Formatted')
const options = ref(['Formatted', 'Raw'])
const props = defineProps(['index', 'tx'])

async function visitMicroblock(microblockHash: string) {
    const microblocks = await api.appControllerGetMicroblocks({ hash: microblockHash });
    if (microblocks.data.items.length === 0) {
        throw new Error('Microblock not found');
    }
    const microblock = microblocks.data.items[0];
    const vbId = microblock.virtualBlockchainId;
    return router.push(`/vb/${vbId}/mb/${microblockHash}`)
}

const tx = props.tx
const hash = ref<string>('')
onMounted(async () => {
    const serializedData = Base64.decodeBinary(tx);
    const mb = Microblock.loadFromSerializedMicroblock(serializedData);
    hash.value = mb.getHash().encode();
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
