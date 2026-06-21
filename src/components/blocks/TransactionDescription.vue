<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Microblock, Base64 } from '@cmts-dev/carmentis-sdk-core'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import { useRouter } from 'vue-router'
import { minWidth } from '@/utils/minWidth'

const router = useRouter()
const value = ref('Info')
const options = ref(['Info', 'Raw Data'])
const props = defineProps(['index', 'tx'])

async function visitMicroblock(microblockHash: string) {
    return router.push(`/vb/mb/${microblockHash}`)
}

const tx = props.tx
const hash = ref<string>('')
const size = ref<number>(0)
onMounted(async () => {
    const serializedData = Base64.decodeBinary(tx);
    const mb = Microblock.loadFromSerializedMicroblock(serializedData);
    hash.value = mb.getHash().encode();
    size.value = serializedData.length;
})
</script>
<template>
    <div class="flex flex-row items-center justify-between mb-8">
        <div>
            <h5 v-if="minWidth(700)">Transaction {{ index + 1 }}</h5>
            <h5 v-else>#{{ index + 1 }}</h5>
        </div>
        <div class="flex flex-row items-center gap-2">
            <Button label="Explore" size="small" @click="visitMicroblock(hash)" />
            <SelectButton v-model="value" :options="options" :allow-empty="false" />
        </div>
    </div>
    <div v-if="value === 'Raw Data'">
        <p class="mono">{{ tx }}</p>
    </div>
    <div v-else>
        <div>
            <p class="mb-2">Microblock Hash</p>
            <p class="mono">{{ hash }}</p>
            <p class="mb-2">Microblock Size</p>
            <p class="mono">{{ size }} bytes</p>
        </div>
    </div>
</template>
