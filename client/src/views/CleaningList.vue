<template>
  <div class="cleaning-list">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">清洁记录管理</h1>
      <div class="header-actions">
        <el-button 
          type="primary" 
          @click="$router.push('/cleaning/create')"
        >
          <el-icon><Plus /></el-icon>
          新增记录
        </el-button>
      </div>
    </div>
    
    <!-- 搜索筛选 -->
    <div class="search-section">
      <el-card class="search-card">
        <el-form 
          :model="searchForm" 
          class="search-form"
          @submit.prevent="handleSearch"
        >
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :md="6">
              <el-form-item label="清洁类型">
                <el-select 
                  v-model="searchForm.type" 
                  placeholder="请选择类型"
                  clearable
                >
                  <el-option 
                    v-for="type in cleaningTypes" 
                    :key="type.value" 
                    :label="type.label" 
                    :value="type.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            
            <el-col :xs="24" :sm="12" :md="6">
              <el-form-item label="房号">
                <el-input 
                  v-model="searchForm.roomNumber" 
                  placeholder="请输入房号"
                  clearable
                />
              </el-form-item>
            </el-col>
            
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="日期范围">
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            
            <el-col :xs="24" :sm="12" :md="4">
              <el-form-item>
                <div class="search-actions">
                  <el-button type="primary" @click="handleSearch">
                    <el-icon><Search /></el-icon>
                    搜索
                  </el-button>
                  <el-button @click="handleReset">
                    <el-icon><Refresh /></el-icon>
                    重置
                  </el-button>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>
    </div>
    
    <!-- 数据表格 -->
    <div class="table-section">
      <el-card class="table-card">
        <!-- 表格工具栏 -->
        <div class="table-toolbar">
          <div class="toolbar-left">
            <el-button 
              type="danger" 
              :disabled="selectedRows.length === 0"
              @click="handleBatchDelete"
            >
              <el-icon><Delete /></el-icon>
              批量删除 ({{ selectedRows.length }})
            </el-button>
            
            <el-button 
              type="info" 
              @click="handleExport"
              :loading="exporting"
            >
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
          </div>
          
          <div class="toolbar-right">
            <el-button 
              type="text" 
              @click="refreshData"
              :loading="cleaningStore.loading"
            >
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
        
        <!-- 表格 -->
        <el-table
          v-loading="cleaningStore.loading"
          :data="cleaningStore.records"
          @selection-change="handleSelectionChange"
          stripe
          border
          style="width: 100%"
        >
          <el-table-column type="selection" width="55" />
          
          <el-table-column prop="date" label="日期" width="120" sortable>
            <template #default="{ row }">
              {{ formatDate(row.date) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="type" label="类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getCleaningTypeColor(row.type)">
                {{ row.type }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="room_numbers" label="房号" min-width="150">
            <template #default="{ row }">
              <div class="room-numbers">
                <el-tag 
                  v-for="room in parseRoomNumbers(row.room_numbers).slice(0, 3)" 
                  :key="room"
                  size="small"
                  class="room-tag"
                >
                  {{ room }}
                </el-tag>
                <el-tag 
                  v-if="parseRoomNumbers(row.room_numbers).length > 3"
                  size="small"
                  type="info"
                >
                  +{{ parseRoomNumbers(row.room_numbers).length - 3 }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="room_count" label="房间数" width="100" sortable>
            <template #default="{ row }">
              {{ row.room_count }} 间
            </template>
          </el-table-column>
          
          <el-table-column prop="unit_price" label="单价" width="100" sortable>
            <template #default="{ row }">
              ¥{{ formatMoney(row.unit_price) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="total_amount" label="总金额" width="120" sortable>
            <template #default="{ row }">
              <span class="amount">¥{{ formatMoney(row.total_amount) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="remarks" label="备注" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.remarks || '-' }}
            </template>
          </el-table-column>
          
          <el-table-column prop="created_by_name" label="创建人" width="100">
            <template #default="{ row }">
              {{ row.created_by_name || '-' }}
            </template>
          </el-table-column>
          
          <el-table-column prop="created_at" label="创建时间" width="160" sortable>
            <template #default="{ row }">
              {{ formatDateTime(row.created_at) }}
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button 
                  type="text" 
                  size="small"
                  @click="handleEdit(row)"
                >
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button 
                  type="text" 
                  size="small"
                  class="danger-button"
                  @click="handleDelete(row)"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCleaningStore } from '../stores/cleaning'
import { 
  formatDate, 
  formatDateTime,
  formatMoney, 
  parseRoomNumbers, 
  getCleaningTypeColor,
  cleaningTypes,
  exportToCSV
} from '../utils'
import dayjs from 'dayjs'

const router = useRouter()
const cleaningStore = useCleaningStore()

// 状态
const selectedRows = ref([])
const exporting = ref(false)
const dateRange = ref([])

// 搜索表单
const searchForm = reactive({
  type: '',
  roomNumber: ''
})

// 计算属性
const pagination = computed(() => cleaningStore.pagination)

// 监听日期范围变化
watch(dateRange, (newVal) => {
  if (newVal && newVal.length === 2) {
    cleaningStore.setFilters({
      startDate: newVal[0],
      endDate: newVal[1]
    })
  } else {
    cleaningStore.setFilters({
      startDate: '',
      endDate: ''
    })
  }
})

// 处理搜索
const handleSearch = () => {
  cleaningStore.setFilters(searchForm)
  cleaningStore.setPagination({ page: 1 })
  fetchData()
}

// 处理重置
const handleReset = () => {
  Object.assign(searchForm, {
    type: '',
    roomNumber: ''
  })
  dateRange.value = []
  cleaningStore.resetFilters()
  fetchData()
}

// 刷新数据
const refreshData = () => {
  fetchData()
}

// 获取数据
const fetchData = () => {
  cleaningStore.fetchRecords()
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  cleaningStore.setPagination({ pageSize: size, page: 1 })
  fetchData()
}

// 处理当前页变化
const handleCurrentChange = (page) => {
  cleaningStore.setPagination({ page })
  fetchData()
}

// 处理编辑
const handleEdit = (row) => {
  router.push(`/cleaning/edit/${row.id}`)
}

// 处理删除
const handleDelete = async (row) => {
  const success = await cleaningStore.deleteRecord(row.id)
  if (success) {
    // 如果当前页没有数据了，回到上一页
    if (cleaningStore.records.length === 0 && pagination.value.page > 1) {
      cleaningStore.setPagination({ page: pagination.value.page - 1 })
      fetchData()
    }
  }
}

// 处理批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) return
  
  const ids = selectedRows.value.map(row => row.id)
  const success = await cleaningStore.batchDeleteRecords(ids)
  if (success) {
    selectedRows.value = []
    // 如果当前页没有数据了，回到上一页
    if (cleaningStore.records.length === 0 && pagination.value.page > 1) {
      cleaningStore.setPagination({ page: pagination.value.page - 1 })
      fetchData()
    }
  }
}

// 处理导出
const handleExport = async () => {
  try {
    exporting.value = true
    
    // 获取所有数据
    const originalPage = pagination.value.page
    const originalPageSize = pagination.value.pageSize
    
    cleaningStore.setPagination({ page: 1, pageSize: 1000 })
    await cleaningStore.fetchRecords()
    
    const data = cleaningStore.records.map(record => ({
      '日期': formatDate(record.date),
      '类型': record.type,
      '房号': record.room_numbers,
      '房间数量': record.room_count,
      '单价': formatMoney(record.unit_price),
      '总金额': formatMoney(record.total_amount),
      '备注': record.remarks || '',
      '创建人': record.created_by_name || '',
      '创建时间': formatDateTime(record.created_at)
    }))
    
    const filename = `清洁记录_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`
    const headers = ['日期', '类型', '房号', '房间数量', '单价', '总金额', '备注', '创建人', '创建时间']
    
    exportToCSV(data, filename, headers)
    
    // 恢复原来的分页设置
    cleaningStore.setPagination({ page: originalPage, pageSize: originalPageSize })
    await cleaningStore.fetchRecords()
  } catch (error) {
    console.error('导出失败:', error)
  } finally {
    exporting.value = false
  }
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.cleaning-list {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-section {
  margin-bottom: 24px;
}

.search-card {
  border-radius: 8px;
}

.search-form {
  margin: 0;
}

.search-actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.table-section {
  margin-bottom: 24px;
}

.table-card {
  border-radius: 8px;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  gap: 12px;
}

.room-numbers {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.room-tag {
  margin: 0;
}

.amount {
  font-weight: 600;
  color: #67c23a;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.danger-button {
  color: #f56c6c;
}

.danger-button:hover {
  color: #f56c6c;
  background-color: #fef0f0;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .search-actions {
    flex-direction: column;
  }
  
  .table-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .toolbar-left,
  .toolbar-right {
    justify-content: center;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }
  
  .el-table {
    font-size: 12px;
  }
  
  .pagination-container {
    overflow-x: auto;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 24px;
  }
  
  .toolbar-left {
    flex-direction: column;
  }
  
  .room-numbers {
    max-width: 120px;
  }
}
</style>