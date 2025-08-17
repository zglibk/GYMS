<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()

onMounted(async () => {
  // 应用启动时初始化认证状态
  await authStore.initAuth()
})
</script>

<style scoped>
#app {
  min-height: 100vh;
}
</style>