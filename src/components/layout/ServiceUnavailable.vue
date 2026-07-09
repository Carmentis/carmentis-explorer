<template>
    <div v-if="!serviceStatus.isAvailable" class="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-gray-900/90">
        <div class="max-w-lg rounded-lg bg-white dark:bg-gray-800 p-8 shadow-xl">
            <div v-if="serviceStatus.isMaintenance">
                <h1 class="text-2xl font-bold mb-4"><i class="pi pi-wrench mr-2" style="font-size: 1.75rem"></i>Explorer maintenance</h1>
                <p>
                    The explorer is temporarily unavailable while its database is being rebuilt from the blockchain.
                    This maintenance is expected and service will resume automatically once reindexing is complete.
                </p>
                <p>
                    Estimated progress: {{ Math.round(serviceStatus.reindexingProgress * 100) }} %
                </p>
            </div>
            <div v-else>
                <h1 class="text-2xl font-bold mb-4"><i class="pi pi-exclamation-circle mr-2" style="font-size: 1.75rem"></i>Service unavailable</h1>
                <p>
                    The explorer is temporarily unavailable. Service should resume shortly.
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useServiceStatusStore } from "@/stores/serviceStatus";
const serviceStatus = useServiceStatusStore();
</script>
