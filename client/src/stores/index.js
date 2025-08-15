import { createPinia } from 'pinia'

/**
 * 创建并配置Pinia store实例
 */
const pinia = createPinia()

export default pinia

// 导出所有store
export { useAuthStore } from './auth'
export { useCleaningStore } from './cleaning'
export { useRoomStore } from './room'