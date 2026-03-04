<template>
  <div class="layout">
    <Navbar />
    <Sidebar />
    <main class="main-content">
      <div class="content-wrapper">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue'
import Navbar from './Navbar.vue'
import Sidebar from './Sidebar.vue'

const sidebarOpen = ref(false)

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

provide('sidebarOpen', sidebarOpen)
provide('toggleSidebar', toggleSidebar)
provide('closeSidebar', closeSidebar)
</script>

<style scoped>
.layout {
  min-height: 100vh;
  background-color: var(--color-bg-secondary);
}

.main-content {
  margin-left: var(--sidebar-width);
  margin-top: var(--navbar-height);
  padding: var(--spacing-xl);
  min-height: calc(100vh - var(--navbar-height));
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

/* Mobile Styles */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: var(--spacing-md);
  }
}

/* Tablet Styles */
@media (min-width: 769px) and (max-width: 1024px) {
  .main-content {
    margin-left: 0;
    padding: var(--spacing-lg);
  }
}
</style>
