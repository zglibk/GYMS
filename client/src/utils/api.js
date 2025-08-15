import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('响应错误:', error)
    
    // 处理网络错误
    if (!error.response) {
      ElMessage.error('网络连接失败，请检查网络设置')
      return Promise.reject(error)
    }
    
    const { status, data } = error.response
    
    switch (status) {
      case 401:
        // 未授权，清除本地存储并跳转到登录页
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        ElMessage.error('登录已过期，请重新登录')
        router.push('/login')
        break
        
      case 403:
        ElMessage.error('没有权限访问该资源')
        break
        
      case 404:
        ElMessage.error('请求的资源不存在')
        break
        
      case 422:
        // 表单验证错误
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat()
          ElMessage.error(errorMessages.join(', '))
        } else {
          ElMessage.error(data.message || '请求参数错误')
        }
        break
        
      case 429:
        ElMessage.error('请求过于频繁，请稍后再试')
        break
        
      case 500:
        ElMessage.error('服务器内部错误，请稍后再试')
        break
        
      case 502:
      case 503:
      case 504:
        ElMessage.error('服务暂时不可用，请稍后再试')
        break
        
      default:
        ElMessage.error(data.message || `请求失败 (${status})`)
    }
    
    return Promise.reject(error)
  }
)

export default api