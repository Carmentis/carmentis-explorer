<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Microblock, Base64 } from '@cmts-dev/carmentis-sdk-core'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import { minWidth } from '@/utils/minWidth'
import { useNavigation } from '@/router/navigation'

const navigation = useNavigation();

const value = ref('Info')
const options = ref(['Info', 'Raw Data'])
const props = defineProps(['index', 'tx'])

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
            <Button label="Explore" size="small" @click="navigation.microblock(hash)" />
            <SelectButton v-model="value" :options="options" :allow-empty="false" />
        </div>
    </div>
    <div v-if="value === 'Raw Data'">
        <p class="mono">{{ tx }}</p>
    </div>
    <div v-else>
        <div>
            <h4>Microblock Hash</h4>
            <p class="mono">{{ hash }}</p>
            <h4>Microblock Size</h4>
            <p class="mono">{{ size }} bytes</p>
        </div>
    </div>
</template>
