import { defineStore } from 'pinia'
import axios from 'axios'

/**
 * 房号管理Store
 * 处理房号相关的状态管理和API调用
 */
export const useRoomStore = defineStore('room', {
  state: () => ({
    rooms: [],
    loading: false,
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
      pages: 0
    }
  }),

  getters: {
    /**
     * 获取可用房间列表
     */
    availableRooms: (state) => {
      return state.rooms.filter(room => room.status === '可用')
    },

    /**
     * 按楼层分组的房间
     */
    roomsByFloor: (state) => {
      const grouped = {}
      state.rooms.forEach(room => {
        const floor = room.floor_number
        if (!grouped[floor]) {
          grouped[floor] = []
        }
        grouped[floor].push(room)
      })
      return grouped
    },

    /**
     * 获取所有楼层选项
     */
    floors: (state) => {
      const floors = [...new Set(state.rooms.map(room => room.floor_number))]
      return floors.sort((a, b) => a - b)
    },

    /**
     * 获取所有房间类型选项
     */
    roomTypes: (state) => {
      return [...new Set(state.rooms.map(room => room.room_type))]
    }
  },

  actions: {
    /**
     * 获取房号列表
     * @param {Object} params - 查询参数
     */
    async fetchRooms(params = {}) {
      this.loading = true
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('/api/rooms', {
          params,
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        
        if (response.data.success) {
          this.rooms = response.data.data.rooms
          this.pagination = response.data.data.pagination
        }
        return response.data
      } catch (error) {
        console.error('获取房号列表失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 添加房号
     * @param {Object} roomData - 房号数据
     */
    async addRoom(roomData) {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.post('/api/rooms', roomData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        
        if (response.data.success) {
          // 重新获取房号列表
          await this.fetchRooms()
        }
        return response.data
      } catch (error) {
        console.error('添加房号失败:', error)
        throw error
      }
    },

    /**
     * 更新房号
     * @param {number} id - 房号ID
     * @param {Object} roomData - 房号数据
     */
    async updateRoom(id, roomData) {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.put(`/api/rooms/${id}`, roomData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        
        if (response.data.success) {
          // 重新获取房号列表
          await this.fetchRooms()
        }
        return response.data
      } catch (error) {
        console.error('更新房号失败:', error)
        throw error
      }
    },

    /**
     * 删除房号
     * @param {number} id - 房号ID
     */
    async deleteRoom(id) {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.delete(`/api/rooms/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        
        if (response.data.success) {
          // 重新获取房号列表
          await this.fetchRooms()
        }
        return response.data
      } catch (error) {
        console.error('删除房号失败:', error)
        throw error
      }
    },

    /**
     * 获取楼层选项
     * @returns {Array} 楼层数组
     */
    getFloors() {
      return this.floors
    },

    /**
     * 获取房间类型选项
     * @returns {Array} 房间类型数组
     */
    getRoomTypes() {
      return this.roomTypes
    }
  }
})