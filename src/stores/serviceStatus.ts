import { defineStore } from "pinia";

export enum ServiceStatus {
    OK = "ok",
    REINDEXING = "reindexing",
    UNAVAILABLE = "unavailable",
}

export const useServiceStatusStore = defineStore("serviceStatus", {
    state: () => ({
        status: ServiceStatus.OK as ServiceStatus,
        reindexingProgress: 0,
    }),

    getters: {
        isAvailable: (state) => state.status === ServiceStatus.OK,
        isMaintenance: (state) => state.status === ServiceStatus.REINDEXING,
        isOffline: (state) => state.status === ServiceStatus.UNAVAILABLE,
    },

    actions: {
        setStatus(status: ServiceStatus) {
            this.status = status;
        },
        setReindexingProgress(progress: number) {
            this.reindexingProgress = progress;
        }
    },
});