import { defineStore } from "pinia"

export const usePreferencesStore = defineStore("preferences", {
    state: () => ({
        pageSize: 10,
    }),
})
