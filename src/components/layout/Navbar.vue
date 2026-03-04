<template>
  <Toolbar class="navbar">
    <template #start>
      <div class="navbar-brand">
        <Button icon="pi pi-bars" text @click="toggleSidebar" aria-label="Toggle menu" class="menu-toggle" />
        <router-link to="/" class="logo">Carmentis Explorer</router-link>
      </div>
    </template>
    <template #end>
      <div class="navbar-info">
        <Tag :value="apiUrl" severity="secondary" class="api-url" />
      </div>
    </template>
  </Toolbar>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { useBlockchainStore } from '@/stores/blockchain'
import Toolbar from 'primevue/toolbar'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

const blockchainStore = useBlockchainStore()
const apiUrl = blockchainStore.getRpcUrl
const toggleSidebar = inject<() => void>('toggleSidebar')
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
