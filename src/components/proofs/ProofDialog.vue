<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import InputText from 'primevue/inputtext'
import { shortenHash } from '@/utils/shortenHash'
import * as api from "@/indexer-sdk/indexer-api";
import { type ValidatorNodeDto } from "@/indexer-sdk/model/validatorNodeDto"
import {
    StateChecker,
    type AccountProofEntry,
    type MicroblockProofEntry,
    AccountProofWrapper,
    MicroblockProofWrapper,
    ProofWrapper,
    Utils,
    ProviderFactory,
} from "@cmts-dev/carmentis-sdk-core"
import { useNavigation } from '@/router/navigation'

const navigation = useNavigation();

const PENDING = 0;
const INVALID = 1;
const MATCH = 2;
const MISMATCH = 3;

interface VerifierNode {
    url: string,
    vbId: string,
    status: number,
}

const open = defineModel<boolean>("open")
const props = defineProps<{
    hash: string,
    type: string,
    title: string,
    identifierName: string,
    description: string,
}>()
const verificationResult = ref<{ success: boolean; message: string; info?: string } | null>(null)
const proofProvider = ref<string>("")
const proof = ref<AccountProofEntry | MicroblockProofEntry | null>(null)
const copied = ref(false);
const verifierList = ref<VerifierNode[]>([])
const verifierInput = ref<string>('')
let appHash: string
let height: number
const network = ref("");

watch(
    () => open.value,
    (v) => {
        if (open.value === true) {
            processProof();
        } else {
            verifierList.value.length = 0;
            verifierInput.value = '';
            verificationResult.value = null;
        }
    }
);

onMounted(async () => {
    const chainInfo = await api.appControllerGetChain();
    network.value = chainInfo.data.network;
});

function closeDialog() {
    open.value = false;
}

async function addVerifier() {
    const url = verifierInput.value.trim();
    verifierInput.value = '';

    if (url !== "") {
        const newNode = { url, vbId: "", status: PENDING };
        verifierList.value.push(newNode);
        verificationResult.value = null;
        await verifyAppHash(newNode);
        updateResult();
    }
}

function getProofAsJson() {
    let wrappedProof: ProofWrapper;
    if (props.type === "account") {
        const wrappedAccountProof = AccountProofWrapper.createEmptyProof(network.value);
        wrappedAccountProof.addAccount(proof.value as AccountProofEntry);
        wrappedProof = wrappedAccountProof;
    } else if (props.type === "microblock") {
        const wrappedMicroblockProof = MicroblockProofWrapper.createEmptyProof(network.value);
        console.log('wrappedMicroblockProof', wrappedMicroblockProof, wrappedMicroblockProof.addMicroblock);
        wrappedMicroblockProof.addMicroblock(proof.value as MicroblockProofEntry);
        wrappedProof = wrappedMicroblockProof;
    } else {
        throw new Error(`invalid proof type`);
    }
    wrappedProof.setAuthor("Carmentis Indexer");
    wrappedProof.setChainId(network.value);
    return JSON.stringify(wrappedProof.getObject(), null, 2);
}

async function copyToClipboard() {
    await navigator.clipboard.writeText(getProofAsJson());
    copied.value = true;
    setTimeout(() => copied.value = false, 1000);
}

function download() {
    const json = getProofAsJson();

    const blob = new Blob([json], {
        type: 'application/json',
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${props.type}-proof-${props.hash}.json`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}

async function processProof() {
    try {
        let rawAppHash: Uint8Array;
        if (props.type === "account") {
            const response = await api.appControllerGetAccountProof({ account_id: props.hash });
            proofProvider.value = normalizeNodeUrl(response.data.nodeUrl);
            proof.value = response.data.proof;
            rawAppHash = StateChecker.verifyAccountProofFromJson(proof.value);
        } else if (props.type === "microblock") {
            const response = await api.appControllerGetMicroblockProof({ hash: props.hash });
            proofProvider.value = normalizeNodeUrl(response.data.nodeUrl);
            proof.value = response.data.proof;
            rawAppHash = StateChecker.verifyMicroblockProofFromJson(proof.value);
        } else {
            throw new Error(`invalid proof type`);
        }

        height = proof.value.block.height;
        appHash = Utils.binaryToHexa(rawAppHash);

        if (appHash !== proof.value.block.appHash) {
            throw new Error(`inconsistent appHash within the proof itself`);
        }
        const nodes = await api.appControllerGetValidatorNodes();
        const nodeList = nodes.data.items;
        shuffleNodeList(nodeList);
        verifierList.value = nodeList.slice(0, 3).map((node) => ({
            url: normalizeNodeUrl(node.rpcEndpoint),
            vbId: node.virtualBlockchainId,
            status: PENDING,
        }));
        const promises = verifierList.value.map((node) => verifyAppHash(node));
        await Promise.allSettled(promises);
        updateResult();
    }
    catch (err) {
        verificationResult.value = {
            success: false,
            message: 'Proof check failure',
            info: String(err),
        };
    }
}

function normalizeNodeUrl(url: string) {
    return url.replace(/\/*$/, "");
}

function updateResult() {
    const nodeCount = verifierList.value.reduce((total, node) =>
        node.status !== INVALID ? total + 1 : total,
        0
    );
    const confirmations = verifierList.value.reduce((total, node) =>
        node.status === MATCH ? total + 1 : total,
        0
    );
    if (nodeCount === 0) {
        verificationResult.value = {
            success: false,
            message: 'Unconfirmed',
            info: `No node found to validate the state computed from the proof provider`,
        };
    }
    else {
        const success = confirmations === nodeCount;
        verificationResult.value = {
            success,
            message: success ? 'Confirmed' : `Inconsistent responses from nodes`,
            info: `${confirmations} node(s) of ${nodeCount} agree with the proof provider`,
        };
    }
}

async function verifyAppHash(node: VerifierNode) {
    try {
        const provider = ProviderFactory.createInMemoryProviderWithExternalProvider(node.url);
        const blockInfo = await provider.getBlockInformation(height);
        const nodeAppHash = Utils.binaryToHexa(blockInfo.applicationStateHashes.appHash);

        if (nodeAppHash === appHash) {
            node.status = MATCH;
        } else {
            // if we have a mistmatch, make sure that this node belongs to the correct network
            // if not, return INVALID rather than MISMATCH
            const response = await fetch(node.url + "/status");
            if (!response.ok) {
                node.status = INVALID;
                return;
            }
            const data = await response.json();
            const nodeNetwork = data?.result?.node_info?.network;
            node.status = nodeNetwork === network.value ? MISMATCH : INVALID;
        }
    }
    catch {
        node.status = INVALID;
    }
}

function shuffleNodeList(list: ValidatorNodeDto[]) {
    // Fisher–Yates
    const n = list.length;
    for(let i = 1; i < n; i++) {
        const j = Math.floor(Math.random() * (i + 1));
        [ list[i], list[j] ] = [ list[j], list[i] ];
    }
}
</script>

<template>
    <Dialog
        modal
        v-model:visible="open"
        :header=title
        :style="{ width: '40rem' }"
        :closable="true"
    >
        <template #header>
            <div class="flex items-center gap-2 text-lg font-semibold text-primary-500">
                <i class="pi pi-shield text-2xl"></i>
                <span>{{ title }}</span>
            </div>
        </template>

        <div class="flex flex-col gap-4">
            <p class="text-sm text-muted-color m-0">{{  description }}</p>

            <div class="flex flex-col gap-2">
                <div class="cards-grid">
                    <div class="detail-section">
                        <h4>{{ identifierName }}</h4>
                        <p class="mono">{{ shortenHash(hash, 32, 8) }}</p>
                    </div>
                    <div class="detail-section">
                        <h4>Proof provided by</h4>
                        <p>{{ proofProvider }}</p>
                    </div>
                    <div class="detail-section">
                        <h4>Crossed-checked against</h4>
                        <div v-for="(node) in verifierList">
                            <p>
                                <i v-if="node.status === MATCH" class="pi pi-check-circle mr-1 text-green-500"></i>
                                <i v-else-if="node.status === MISMATCH" class="pi pi-times-circle mr-1 text-red-500"></i>
                                <i v-else-if="node.status === PENDING" class="pi pi-wifi mr-1 text-gray-500"></i>
                                <i v-else class="pi pi-exclamation-triangle mr-1 text-gray-500"></i>
                                {{ node.url }}
                                <span v-if="node.vbId !== ''">
                                    (<a class="cursor-pointer" @click.stop="navigation.node(node.vbId)">see node page</a>)
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex flex-col gap-2">
                <h4>Check against another node</h4>
                <InputText
                    id="verifierUrl"
                    v-model="verifierInput"
                    placeholder="RPC endpoint (press Enter to add)"
                    class="w-full"
                    @keyup.enter="() => addVerifier()"
                    autofocus
                />
            </div>

            <Message
                v-if="verificationResult"
                :severity="verificationResult.success ? 'success' : 'error'"
                :closable="false"
            >
                <div>{{ verificationResult.message }}</div>
                <div v-if="verificationResult.info" class="text-xs">{{ verificationResult.info }}</div>
            </Message>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <Button
                    :label="copied ? 'Copied' : 'Copy proof to clipboard'"
                    :icon="copied ? 'pi pi-check' : 'pi pi-copy'"
                    class="min-w-[220px]"
                    severity="secondary"
                    @click="copyToClipboard()"
                    :disabled="!proof"
                />
                <Button
                    label="Download proof"
                    icon="pi pi-download"
                    class="min-w-[220px]"
                    severity="secondary"
                    @click="download()"
                    :disabled="!proof"
                />
                <Button
                    label="Close"
                    @click="closeDialog()"
                    :loading="false"
                />
            </div>
        </template>
    </Dialog>
</template>
