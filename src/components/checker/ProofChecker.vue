<template>
    <div class="p-6 space-y-6">
        <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Proof Checker</h1>
            <p class="text-gray-600">Verify the authenticity of your proof documents</p>
        </div>

        <div v-if="proof" class="space-y-6">
            <ProofViewer :proof="proof" @reset="proof = undefined" />
        </div>
        <div v-else>
            <ProofCheckerUpload @upload="onUpload" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ProofDocument } from '@cmts-dev/carmentis-sdk/client'
import ProofCheckerUpload from './ProofCheckerUpload.vue'
import ProofViewer from './ProofViewer.vue'

const proof = ref<ProofDocument | undefined>()

const onUpload = (uploadedProof: ProofDocument) => {
    proof.value = uploadedProof
}
</script>
