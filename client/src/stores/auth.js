import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/api'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const loading = ref(false)

  const isAuthenticated = computed(() => {
    return !!token.value && !!user.value
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
    token.value = ''
    user.value = null
    
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // 清除API默认token
    delete api.defaults.headers.common['Authorization']
    
    ElMessage.success('已退出登录')
  }

  // 检查认证状态
  const checkAuth = async () => {
    if (!token.value) {
      return false
    }
    
    try {
      // 设置API默认token
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      
      const response = await api.get('/auth/me')
      
      if (response.data.success) {
        user.value = response.data.data.user
        localStorage.setItem('user', JSON.stringify(response.data.data.user))
        return true
      } else {
        // token无效，清除本地存储
        logout()
        return false
      }
    } catch (error) {
      console.error('检查认证状态错误:', error)
      // token无效，清除本地存储
      logout()
      return false
    }
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
    login,
    register,
    logout,
    checkAuth,
    updateUser
  }
})