<template>
  <Toolbar class="navbar">
    <template #start>
      <div class="navbar-brand">
        <Button icon="pi pi-bars" text @click="toggleSidebar" aria-label="Toggle menu" class="menu-toggle" />
        <router-link to="/" class="logo">
            <img src="/carmentis-logo-color.png" alt="Carmentis" class="logo-img" />
            <span>Carmentis Explorer</span>
        </router-link>
      </div>
    </template>
    <template #end>
      <div class="navbar-info">
        <Tag :value="connection" severity="secondary" class="api-url" />
      </div>
    </template>
  </Toolbar>
</template>

<script setup lang="ts">
import { onMounted, ref, inject } from 'vue'
import Toolbar from 'primevue/toolbar'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { getApiBaseUrl } from '@/indexer-sdk/http-client/http-client'
import * as api from "@/indexer-sdk/indexer-api";

const connection = ref("")
const toggleSidebar = inject<() => void>('toggleSidebar')

onMounted(async () => {
    const apiUrl = getApiBaseUrl();
    const chainInfo = await api.appControllerGetChain();
    connection.value = chainInfo.data.network + " @ " + apiUrl;
});
</script>

<style scoped>
.navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
}

.navbar-brand {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
}

.logo {
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--color-text-primary);
    text-decoration: none;
    transition: color var(--transition-base);
}

.logo:hover {
    color: var(--color-accent);
}

.navbar-info {
    display: flex;
    align-items: center;
}

.menu-toggle {
    display: none;
}

/* Mobile Styles */
@media (max-width: 768px) {
    .menu-toggle {
        display: inline-flex;
    }

    .logo {
        font-size: var(--font-size-lg);
    }

    .navbar-info {
        display: none;
    }
  }

/* Tablet Styles */
@media (min-width: 769px) and (max-width: 1024px) {
    .menu-toggle {
        display: inline-flex;
    }
}
</style>
