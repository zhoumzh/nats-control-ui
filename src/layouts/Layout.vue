<template>
  <el-container class="layout-container">
    <!-- Sidebar -->
    <el-aside width="250px" class="sidebar">
      <div class="logo">
        <el-icon size="24"><Lightning /></el-icon>
        <span class="logo-text">NATS Control</span>
      </div>

      <el-menu :default-active="$route.path" class="sidebar-menu" :collapse="isCollapsed">
        <el-menu-item
          v-for="route in menuRoutes"
          :key="route.path"
          :index="route.path"
          @click="navigateToRoute(route.path)"
        >
          <el-icon>
            <component :is="route.meta?.icon" />
          </el-icon>
          <template #title>{{ route.meta?.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- Main content -->
    <el-container class="main-container">
      <!-- Header -->
      <el-header class="header">
        <div class="header-left">
          <el-button text @click="toggleSidebar" class="collapse-btn">
            <el-icon size="20">
              <Expand v-if="isCollapsed" />
              <Fold v-else />
            </el-icon>
          </el-button>

          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path" :to="item.path">
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-button text @click="themeStore.toggleTheme" class="theme-toggle">
            <el-icon size="20">
              <Sunny v-if="themeStore.isDark" />
              <Moon v-else />
            </el-icon>
          </el-button>

          <el-button text @click="refreshPage">
            <el-icon size="20"><Refresh /></el-icon>
          </el-button>
        </div>
      </el-header>

      <!-- Content -->
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import {
  Lightning,
  Expand,
  Fold,
  Sunny,
  Moon,
  Refresh,
  Monitor,
  DataBoard,
  User,
  Avatar,
  DocumentChecked,
  DataLine,
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()

const isCollapsed = ref(false)

const menuRoutes = computed(() => {
  // 直接从路由配置中获取菜单路由
  const allRoutes = router.getRoutes()
  console.log(
    'All routes:',
    allRoutes.map((r) => ({ name: r.name, path: r.path, hasChildren: !!r.children?.length }))
  )

  // 查找主布局路由
  const layoutRoute = allRoutes.find((route) => route.path === '/')

  if (!layoutRoute || !layoutRoute.children) {
    console.warn('Layout route or children not found')
    return []
  }

  const menuItems = layoutRoute.children.filter((route) => route.meta && !route.meta.hidden)

  console.log(
    'Menu routes:',
    menuItems.map((r) => ({ path: r.path, title: r.meta?.title, icon: r.meta?.icon }))
  )

  return menuItems
})

const breadcrumbs = computed(() => {
  const matched = route.matched.filter((item) => item.meta && item.meta.title)
  return matched.map((item) => ({
    title: item.meta?.title || '',
    path: item.path,
  }))
})

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const refreshPage = () => {
  window.location.reload()
}

const navigateToRoute = (path: string) => {
  // 强制使用绝对路径跳转，确保不会被当前路径拼接
  const absolutePath = path.startsWith('/') ? path : `/${path}`
  router.push(absolutePath)
}
</script>

<style scoped lang="scss">
.layout-container {
  height: 100vh;
  width: 100%;
}

.sidebar {
  background-color: var(--el-bg-color-page);
  border-right: 1px solid var(--el-border-color);

  .logo {
    display: flex;
    align-items: center;
    padding: 20px;
    font-size: 18px;
    font-weight: bold;
    color: var(--el-color-primary);

    .logo-text {
      margin-left: 10px;
    }
  }

  .sidebar-menu {
    border-right: none;
    height: calc(100vh - 64px);
    overflow-y: auto;
  }
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);

  .header-left {
    display: flex;
    align-items: center;

    .collapse-btn {
      margin-right: 20px;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

.main-content {
  flex: 1 1 0% !important;
  background-color: var(--el-bg-color-page);
  overflow-y: auto;
  padding: 0 !important;
  min-height: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
