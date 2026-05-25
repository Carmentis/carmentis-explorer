<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import {
    SectionLabel,
    SectionType,
    type Section,
    Microblock,
    CryptoEncoderFactory,
} from '@cmts-dev/carmentis-sdk-core'

const props = defineProps<{ serializedMb: Uint8Array; section: Section; sectionIndex: number }>()
const section = props.section
const mb = Microblock.loadFromSerializedMicroblock(props.serializedMb)
const stringifiedSection = JSON.stringify(section)

const showVerifyDialog = ref(false)
const publicKeyInput = ref('')
const verifying = ref(false)
const verificationResult = ref<{ success: boolean; message: string } | null>(null)

// compute the current signature index if applicable
const currentSignatureIndex = ref<number>(0)
for (const section of mb.getAllSections()) {
    if (section.type === SectionType.SIGNATURE) {
        currentSignatureIndex.value++
    }
}

function verifySignature() {
    showVerifyDialog.value = true
    publicKeyInput.value = ''
    verificationResult.value = null
}

async function performVerification() {
    if (!publicKeyInput.value.trim()) {
        verificationResult.value = {
            success: false,
            message: 'Please enter a public key',
        }
        return
    }

    verifying.value = true
    verificationResult.value = null

    try {
        const encoder = CryptoEncoderFactory.defaultStringSignatureEncoder()
        const publicKey = await encoder.decodePublicKey(publicKeyInput.value.trim())
        const isValid = await mb.verify(publicKey, {
            includeGas: mb.getNumberOfSections() === props.sectionIndex + 1,
            verifiedSignatureIndex: currentSignatureIndex.value,
        })

        verificationResult.value = {
            success: isValid,
            message: isValid ? 'Signature is valid' : 'Signature verification failure.',
        }
    } catch (error) {
        console.error('Verification error:', error)
        verificationResult.value = {
            success: false,
            message: 'Invalid public key format or verification failed',
        }
    } finally {
        verifying.value = false
    }
}

function closeVerifyDialog() {
    showVerifyDialog.value = false
    publicKeyInput.value = ''
    verificationResult.value = null
}
</script>

<template>
    <div class="flex flex-row items-center justify-between mb-2">
        <h5>{{ SectionLabel.getSectionLabelFromSection(section) }}</h5>
        <div v-if="section.type === SectionType.SIGNATURE">
            <Button label="Verify Signature" icon="pi pi-check-circle" @click="verifySignature" size="small" />
        </div>
    </div>

    <p class="mono">
        {{ stringifiedSection }}
    </p>

    <Dialog
        v-model:visible="showVerifyDialog"
        modal
        header="Verify Microblock Signature"
        :style="{ width: '40rem' }"
        :closable="true"
    >
        <template #header>
            <div class="flex items-center gap-2 text-lg font-semibold text-primary-500">
                <i class="pi pi-shield text-2xl"></i>
                <span>Verify Microblock Signature</span>
            </div>
        </template>

        <div class="flex flex-col gap-4">
            <p class="text-sm text-muted-color m-0">
                Enter the public key to verify if this microblock was signed by the corresponding
                private key.
            </p>

            <div class="flex flex-col gap-2">
                <label for="publicKey" class="text-sm font-semibold text-text-color"
                    >Public Key</label
                >
                <InputText
                    id="publicKey"
                    v-model="publicKeyInput"
                    placeholder="Enter public key..."
                    class="w-full"
                    @keyup.enter="performVerification"
                    autofocus
                />
            </div>

            <Message
                v-if="verificationResult"
                :severity="verificationResult.success ? 'success' : 'error'"
                :closable="false"
            >
                {{ verificationResult.message }}
            </Message>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <Button
                    label="Cancel"
                    severity="secondary"
                    @click="closeVerifyDialog"
                    :disabled="verifying"
                />
                <Button
                    label="Verify"
                    icon="pi pi-check"
                    @click="performVerification"
                    :loading="verifying"
                    :disabled="!publicKeyInput.trim()"
                />
            </div>
        </template>
    </Dialog>
</template>
