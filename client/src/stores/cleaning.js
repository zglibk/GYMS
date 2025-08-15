import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'

export const useCleaningStore = defineStore('cleaning', () => {
  const records = ref([])
  const currentRecord = ref(null)
  const loading = ref(false)
  const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  })
  const filters = ref({
    type: '',
    startDate: '',
    endDate: '',
    roomNumber: ''
  })
  const stats = ref({
    summary: {
      total_records: 0,
      total_rooms: 0,
      total_amount: 0,
      avg_unit_price: 0
    },
    typeStats: []
  })

  // 计算属性
  const hasRecords = computed(() => records.value.length > 0)
  const totalAmount = computed(() => {
    return records.value.reduce((sum, record) => sum + (record.total_amount || 0), 0)
  })

  // 获取清洁记录列表
  const fetchRecords = async (params = {}) => {
    try {
      loading.value = true
      const queryParams = {
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...filters.value,
        ...params
      }
      
      // 过滤空值
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
          delete queryParams[key]
        }
      })
      
      const response = await api.get('/cleaning', { params: queryParams })
      
      if (response.data.success) {
        records.value = response.data.data.records
        pagination.value = response.data.data.pagination
        return true
      } else {
        ElMessage.error(response.data.message || '获取记录失败')
        return false
      }
    } catch (error) {
      console.error('获取清洁记录错误:', error)
      ElMessage.error(error.response?.data?.message || '获取记录失败')
      return false
    } finally {
      loading.value = false
    }
  }

  // 获取单个清洁记录
  const fetchRecord = async (id) => {
    try {
      loading.value = true
      const response = await api.get(`/cleaning/${id}`)
      
      if (response.data.success) {
        currentRecord.value = response.data.data
        return response.data.data
      } else {
        ElMessage.error(response.data.message || '获取记录详情失败')
        return null
      }
    } catch (error) {
      console.error('获取清洁记录详情错误:', error)
      ElMessage.error(error.response?.data?.message || '获取记录详情失败')
      return null
    } finally {
      loading.value = false
    }
  }

  // 创建清洁记录
  const createRecord = async (recordData) => {
    try {
      loading.value = true
      const response = await api.post('/cleaning', recordData)
      
      if (response.data.success) {
        ElMessage.success('创建成功')
        await fetchRecords() // 刷新列表
        return response.data.data
      } else {
        ElMessage.error(response.data.message || '创建失败')
        return null
      }
    } catch (error) {
      console.error('创建清洁记录错误:', error)
      ElMessage.error(error.response?.data?.message || '创建失败')
      return null
    } finally {
      loading.value = false
    }
  }

  // 更新清洁记录
  const updateRecord = async (id, recordData) => {
    try {
      loading.value = true
      const response = await api.put(`/cleaning/${id}`, recordData)
      
      if (response.data.success) {
        ElMessage.success('更新成功')
        await fetchRecords() // 刷新列表
        return response.data.data
      } else {
        ElMessage.error(response.data.message || '更新失败')
        return null
      }
    } catch (error) {
      console.error('更新清洁记录错误:', error)
      ElMessage.error(error.response?.data?.message || '更新失败')
      return null
    } finally {
      loading.value = false
    }
  }

  // 删除清洁记录
  const deleteRecord = async (id) => {
    try {
      await ElMessageBox.confirm(
        '确定要删除这条记录吗？此操作不可恢复。',
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      loading.value = true
      const response = await api.delete(`/cleaning/${id}`)
      
      if (response.data.success) {
        ElMessage.success('删除成功')
        await fetchRecords() // 刷新列表
        return true
      } else {
        ElMessage.error(response.data.message || '删除失败')
        return false
      }
    } catch (error) {
      if (error === 'cancel') {
        return false
      }
      console.error('删除清洁记录错误:', error)
      ElMessage.error(error.response?.data?.message || '删除失败')
      return false
    } finally {
      loading.value = false
    }
  }

  // 批量删除清洁记录
  const batchDeleteRecords = async (ids) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${ids.length} 条记录吗？此操作不可恢复。`,
        '确认批量删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      loading.value = true
      const response = await api.delete(`/cleaning/batch/${ids.join(',')}`)
      
      if (response.data.success) {
        ElMessage.success(response.data.message || '批量删除成功')
        await fetchRecords() // 刷新列表
        return true
      } else {
        ElMessage.error(response.data.message || '批量删除失败')
        return false
      }
    } catch (error) {
      if (error === 'cancel') {
        return false
      }
      console.error('批量删除清洁记录错误:', error)
      ElMessage.error(error.response?.data?.message || '批量删除失败')
      return false
    } finally {
      loading.value = false
    }
  }

  // 获取统计数据
  const fetchStats = async (params = {}) => {
    try {
      const response = await api.get('/cleaning/stats/summary', { params })
      
      if (response.data.success) {
        stats.value = response.data.data
        return response.data.data
      } else {
        ElMessage.error(response.data.message || '获取统计数据失败')
        return null
      }
    } catch (error) {
      console.error('获取统计数据错误:', error)
      ElMessage.error(error.response?.data?.message || '获取统计数据失败')
      return null
    }
  }

  // 设置过滤条件
  const setFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters }
    pagination.value.page = 1 // 重置到第一页
  }

  // 重置过滤条件
  const resetFilters = () => {
    filters.value = {
      type: '',
      startDate: '',
      endDate: '',
      roomNumber: ''
    }
    pagination.value.page = 1
  }

  // 设置分页
  const setPagination = (newPagination) => {
    pagination.value = { ...pagination.value, ...newPagination }
  }

  // 清空当前记录
  const clearCurrentRecord = () => {
    currentRecord.value = null
  }

  return {
    records,
    currentRecord,
    loading,
    pagination,
    filters,
    stats,
    hasRecords,
    totalAmount,
    fetchRecords,
    fetchRecord,
    createRecord,
    updateRecord,
    deleteRecord,
    batchDeleteRecords,
    fetchStats,
    setFilters,
    resetFilters,
    setPagination,
    clearCurrentRecord
  }
})