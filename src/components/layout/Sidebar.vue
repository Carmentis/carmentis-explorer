<template>
  <aside :class="['sidebar', { open: isOpen }]">
    <div class="sidebar-header">
      <h3>Explorer</h3>
      <Divider />
    </div>

    <nav class="sidebar-nav">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: isActiveRoute(item.path) }"
        @click="closeSidebarOnMobile"
      >
        <i :class="item.icon" class="nav-icon"></i>
        <span class="nav-label">{{ item.label }}</span>
        <i v-if="isActiveRoute(item.path)" class="pi pi-chevron-right nav-chevron"></i>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <Divider />
      <div class="footer-content">
        <i class="pi pi-info-circle"></i>
        <span class="footer-text">Carmentis Explorer v1.0</span>
      </div>
    </div>
  </aside>
  <div v-if="isOpen" class="sidebar-overlay" @click="closeSidebar"></div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Divider from 'primevue/divider'

const router = useRouter()
const route = useRoute()
const isOpen = inject<{ value: boolean }>('sidebarOpen')
const closeSidebar = inject<() => void>('closeSidebar')

const closeSidebarOnMobile = () => {
  if (window.innerWidth <= 1024) {
    closeSidebar?.()
  }
}

const menuItems = [
  {
    label: 'Home',
    icon: 'pi pi-home',
    path: '/'
  },
  {
    label: 'Nodes',
    icon: 'pi pi-server',
    path: '/nodes'
  },
  {
    label: 'Organizations',
    icon: 'pi pi-building',
    path: '/organizations'
  },
  {
    label: 'Applications',
    icon: 'pi pi-mobile',
    path: '/applications'
  },
  {
    label: 'Accounts',
    icon: 'pi pi-user',
    path: '/accounts'
  }
]

const isActiveRoute = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  position: fixed;
  top: var(--navbar-height);
  left: 0;
  bottom: 0;
  overflow-y: auto;
  background: linear-gradient(180deg, var(--p-surface-0) 0%, var(--p-surface-50) 100%);
  border-right: 1px solid var(--p-surface-200);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: var(--spacing-xl) var(--spacing-lg) var(--spacing-md);
}

.sidebar-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--p-primary-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md) var(--spacing-sm);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  color: var(--p-text-color);
  text-decoration: none;
  border-radius: var(--p-border-radius);
  transition: all 0.2s ease;
  position: relative;
  font-weight: 500;
}

.nav-item:hover {
  background: var(--p-primary-50);
  color: var(--p-primary-600);
  transform: translateX(4px);
}

.nav-item.active {
  background: linear-gradient(90deg, var(--p-primary-500) 0%, var(--p-primary-600) 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.nav-item.active:hover {
  transform: translateX(4px);
  background: linear-gradient(90deg, var(--p-primary-600) 0%, var(--p-primary-700) 100%);
}

.nav-icon {
  font-size: 1.25rem;
  width: 1.5rem;
  text-align: center;
}

.nav-label {
  flex: 1;
  font-size: var(--font-size-sm);
}

.nav-chevron {
  font-size: 0.875rem;
  margin-left: auto;
  animation: slideIn 0.2s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-4px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.sidebar-footer {
  margin-top: auto;
  padding: var(--spacing-md) var(--spacing-lg);
}

.footer-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--p-text-muted-color);
  font-size: var(--font-size-xs);
}

.footer-text {
  font-weight: 500;
}

.sidebar-overlay {
  display: none;
}

/* Tablet and Mobile Styles */
@media (max-width: 1024px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform var(--transition-base);
    z-index: 99;
    box-shadow: var(--shadow-lg);
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    top: var(--navbar-height);
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 98;
    animation: fadeIn 0.2s;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
}

/* Scrollbar Styling */
.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
  background: var(--p-surface-300);
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--p-surface-400);
}
</style>
