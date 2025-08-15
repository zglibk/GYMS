<template>
  <el-container class="main-layout">
    <!-- 移动端顶部导航 -->
    <el-header v-if="isMobile" class="mobile-header">
      <div class="mobile-nav">
        <el-button 
          type="text" 
          @click="toggleSidebar"
          class="menu-button"
        >
          <el-icon><Menu /></el-icon>
        </el-button>
        <h1 class="app-title">清洁管理</h1>
        <el-dropdown @command="handleCommand">
          <el-button type="text" class="user-button">
            <el-icon><User /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>
                个人信息
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container>
      <!-- 侧边栏 -->
      <el-aside 
        :width="sidebarWidth" 
        class="sidebar"
        :class="{ 'mobile-sidebar': isMobile, 'sidebar-hidden': isMobile && !sidebarVisible }"
      >
        <!-- 桌面端头部 -->
        <div v-if="!isMobile" class="sidebar-header">
          <h1 class="app-title">公寓清洁管理</h1>
        </div>
        
        <!-- 导航菜单 -->
        <el-menu
          :default-active="$route.path"
          class="sidebar-menu"
          router
          :collapse="isCollapsed && !isMobile"
          @select="handleMenuSelect"
        >
          <el-menu-item index="/">
            <el-icon><Odometer /></el-icon>
            <template #title>数据概览</template>
          </el-menu-item>
          
          <el-menu-item index="/cleaning">
            <el-icon><List /></el-icon>
            <template #title>清洁记录</template>
          </el-menu-item>
          
          <el-menu-item index="/rooms">
            <el-icon><House /></el-icon>
            <template #title>房号管理</template>
          </el-menu-item>
          
          <el-menu-item index="/cleaning/create">
            <el-icon><Plus /></el-icon>
            <template #title>新增记录</template>
          </el-menu-item>
        </el-menu>
        
        <!-- 桌面端用户信息 -->
        <div v-if="!isMobile" class="sidebar-footer">
          <el-dropdown @command="handleCommand" placement="top-start">
            <div class="user-info">
              <el-avatar :size="32">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div v-if="!isCollapsed" class="user-details">
                <div class="username">{{ authStore.user?.username }}</div>
                <div class="user-role">管理员</div>
              </div>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人信息
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <!-- 折叠按钮 -->
          <el-button 
            type="text" 
            @click="toggleCollapse"
            class="collapse-button"
          >
            <el-icon>
              <Expand v-if="isCollapsed" />
              <Fold v-else />
            </el-icon>
          </el-button>
        </div>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
    
    <!-- 移动端遮罩 -->
    <div 
      v-if="isMobile && sidebarVisible" 
      class="sidebar-overlay"
      @click="closeSidebar"
    ></div>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

// 响应式状态
const isCollapsed = ref(false)
const sidebarVisible = ref(false)
const windowWidth = ref(window.innerWidth)

// 计算属性
const isMobile = computed(() => windowWidth.value < 768)
const sidebarWidth = computed(() => {
  if (isMobile.value) return '250px'
  return isCollapsed.value ? '64px' : '250px'
})

// 方法
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value
}

const closeSidebar = () => {
  sidebarVisible.value = false
}

const handleMenuSelect = () => {
  if (isMobile.value) {
    closeSidebar()
  }
}

const handleCommand = async (command) => {
  switch (command) {
    case 'profile':
      // TODO: 打开个人信息对话框
      break
    case 'logout':
      try {
        await ElMessageBox.confirm(
          '确定要退出登录吗？',
          '确认退出',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        authStore.logout()
        router.push('/login')
      } catch {
        // 用户取消
      }
      break
  }
}

const handleResize = () => {
  windowWidth.value = window.innerWidth
  if (!isMobile.value) {
    sidebarVisible.value = false
  }
}

// 生命周期
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

/* 移动端头部 */
.mobile-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0;
  height: 60px;
  line-height: 60px;
}

.mobile-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  height: 100%;
}

.menu-button,
.user-button {
  font-size: 20px;
  color: #606266;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

/* 侧边栏 */
.sidebar {
  background: #fff;
  border-right: 1px solid #e4e7ed;
  transition: all 0.3s;
  overflow: hidden;
}

.mobile-sidebar {
  position: fixed;
  top: 60px;
  left: 0;
  bottom: 0;
  z-index: 1000;
  transform: translateX(0);
  transition: transform 0.3s;
}

.sidebar-hidden {
  transform: translateX(-100%);
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
  text-align: center;
}

.sidebar-header .app-title {
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
  margin: 0;
}

.sidebar-menu {
  border: none;
  flex: 1;
}

.sidebar-menu .el-menu-item {
  height: 56px;
  line-height: 56px;
  margin: 4px 8px;
  transition: all 0.3s;
}

/* 菜单项悬停状态 */
.sidebar-menu .el-menu-item:hover {
  background-color: #ecf5ff !important;
  color: #409eff !important;
}

/* 菜单项激活状态 */
.sidebar-menu .el-menu-item.is-active {
  background-color: #409eff !important;
  color: #ffffff !important;
  font-weight: 600;
}

/* 菜单项获取焦点状态 */
.sidebar-menu .el-menu-item:focus {
  background-color: #409eff !important;
  color: #ffffff !important;
  outline: none;
}

/* 折叠状态下的菜单项样式 */
.sidebar-menu.el-menu--collapse .el-menu-item {
  margin: 4px;
  text-align: center;
}

.sidebar-menu.el-menu--collapse .el-menu-item:hover,
.sidebar-menu.el-menu--collapse .el-menu-item.is-active,
.sidebar-menu.el-menu--collapse .el-menu-item:focus {
  background-color: #409eff !important;
  color: #ffffff !important;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #e4e7ed;
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-details {
  margin-left: 12px;
  flex: 1;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  line-height: 1.4;
}

.user-role {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.collapse-button {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 16px;
  color: #909399;
}

/* 主内容区 */
.main-content {
  background: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}

/* 移动端遮罩 */
.sidebar-overlay {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .main-content {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 10px;
  }
  
  .mobile-nav {
    padding: 0 12px;
  }
  
  .app-title {
    font-size: 16px;
  }
}
</style>