import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/api'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref((() => {
    const userData = localStorage.getItem('user')
    if (!userData || userData === 'undefined') {
      return null
    }
    try {
      return JSON.parse(userData)
    } catch (e) {
      return null
    }
  })())
  const loading = ref(false)
  const isInitialized = ref(false) // 添加初始化状态标记

  const isAuthenticated = computed(() => {
    return !!token.value && !!user.value
  })

  // 添加初始化完成状态
  const isReady = computed(() => {
    return isInitialized.value
  })

  // 登录
  const login = async (credentials) => {
    try {
      loading.value = true
      const response = await api.post('/auth/login', credentials)
      
      if (response.data.success) {
        const { token: newToken, user: userData } = response.data.data
        
        token.value = newToken
        user.value = userData
        
        localStorage.setItem('token', newToken)
        localStorage.setItem('user', JSON.stringify(userData))
        
        // 设置API默认token
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
        
        ElMessage.success('登录成功')
        return true
      } else {
        ElMessage.error(response.data.message || '登录失败')
        return false
      }
    } catch (error) {
      console.error('登录错误:', error)
      ElMessage.error(error.response?.data?.message || '登录失败')
      return false
    } finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (userData) => {
    try {
      loading.value = true
      const response = await api.post('/auth/register', userData)
      
      if (response.data.success) {
        const { token: newToken, user: newUser } = response.data.data
        
        token.value = newToken
        user.value = newUser
        
        localStorage.setItem('token', newToken)
        localStorage.setItem('user', JSON.stringify(newUser))
        
        // 设置API默认token
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
        
        ElMessage.success('注册成功')
        return true
      } else {
        ElMessage.error(response.data.message || '注册失败')
        return false
      }
    } catch (error) {
      console.error('注册错误:', error)
      ElMessage.error(error.response?.data?.message || '注册失败')
      return false
    } finally {
      loading.value = false
    }
  }

  // 登出
  const logout = () => {
    clearAuth()
    ElMessage.success('已退出登录')
  }

  // 初始化认证状态
  const initAuth = async () => {
    try {
      if (!token.value) {
        isInitialized.value = true
        return false
      }

      // 设置API默认token
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      
      const response = await api.get('/auth/me')
      
      if (response.data.success) {
        user.value = response.data.data
        localStorage.setItem('user', JSON.stringify(response.data.data))
        isInitialized.value = true
        return true
      } else {
        // token无效，清除本地存储
        clearAuth()
        isInitialized.value = true
        return false
      }
    } catch (error) {
      console.error('初始化认证状态错误:', error)
      // token无效，清除本地存储
      clearAuth()
      isInitialized.value = true
      return false
    }
  }

  // 检查认证状态（保持向后兼容）
  const checkAuth = async () => {
    return await initAuth()
  }

  // 清除认证信息（内部方法，不显示消息）
  const clearAuth = () => {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
  }

  // 更新用户信息
  const updateUser = (userData) => {
    user.value = { ...user.value, ...userData }
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  return {
    token,
    user,
    loading,
    isAuthenticated,
    isInitialized,
    isReady,
    login,
    register,
    logout,
    checkAuth,
    initAuth,
    updateUser
  }
})