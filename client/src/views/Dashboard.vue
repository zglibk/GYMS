<template>
  <div class="dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">数据概览</h1>
      <p class="page-subtitle">公寓房间清洁管理统计信息</p>
    </div>
    
    <!-- 时间筛选 -->
    <div class="filter-section">
      <el-card class="filter-card">
        <div class="filter-content">
          <div class="filter-item">
            <label>统计时间范围：</label>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleDateChange"
            />
          </div>
          <div class="filter-actions">
            <el-button @click="resetDateRange">重置</el-button>
            <el-button type="primary" @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新数据
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stats-card primary">
          <div class="stats-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stats-content">
            <h3>总记录数</h3>
            <div class="value">{{ formatNumber(stats.summary.total_records) }}</div>
            <div class="label">条清洁记录</div>
          </div>
        </div>
        
        <div class="stats-card success">
          <div class="stats-icon">
            <el-icon><House /></el-icon>
          </div>
          <div class="stats-content">
            <h3>清洁房间数</h3>
            <div class="value">{{ formatNumber(stats.summary.total_rooms) }}</div>
            <div class="label">间房间</div>
          </div>
        </div>
        
        <div class="stats-card warning">
          <div class="stats-icon">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stats-content">
            <h3>总金额</h3>
            <div class="value">¥{{ formatCurrency(stats.summary.total_amount) }}</div>
            <div class="label">清洁费用</div>
          </div>
        </div>
        
        <div class="stats-card danger">
          <div class="stats-icon">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stats-content">
            <h3>平均单价</h3>
            <div class="value">¥{{ formatMoney(stats.summary.avg_unit_price) }}</div>
            <div class="label">每间房</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <!-- 清洁类型分布 -->
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <h3>清洁类型分布</h3>
                <el-tag type="info">按记录数统计</el-tag>
              </div>
            </template>
            <div class="chart-container">
              <div v-if="stats.typeStats.length === 0" class="empty-chart">
                <el-empty description="暂无数据" />
              </div>
              <div v-else class="type-stats">
                <div 
                  v-for="item in stats.typeStats" 
                  :key="item.type"
                  class="type-item"
                >
                  <div class="type-info">
                    <el-tag 
                      :type="getCleaningTypeColor(item.type)"
                      class="type-tag"
                    >
                      {{ item.type }}
                    </el-tag>
                    <span class="type-count">{{ item.count }} 条记录</span>
                  </div>
                  <div class="type-amount">
                    ¥{{ formatCurrency(item.amount) }}
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <!-- 最近记录 -->
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <h3>最近记录</h3>
                <el-button 
                  type="text" 
                  @click="$router.push('/cleaning')"
                >
                  查看全部
                </el-button>
              </div>
            </template>
            <div class="chart-container">
              <div v-if="recentRecords.length === 0" class="empty-chart">
                <el-empty description="暂无记录" />
              </div>
              <div v-else class="recent-records">
                <div 
                  v-for="record in recentRecords" 
                  :key="record.id"
                  class="record-item"
                  @click="viewRecord(record)"
                >
                  <div class="record-info">
                    <div class="record-header">
                      <el-tag 
                        :type="getCleaningTypeColor(record.type)"
                        size="small"
                      >
                        {{ record.type }}
                      </el-tag>
                      <span class="record-date">
                        {{ formatDate(record.date) }}
                      </span>
                    </div>
                    <div class="record-details">
                      <span class="room-numbers">
                        {{ parseRoomNumbers(record.room_numbers).join(', ') }}
                      </span>
                      <span class="room-count">
                        {{ record.room_count }} 间
                      </span>
                    </div>
                  </div>
                  <div class="record-amount">
                    ¥{{ formatMoney(record.total_amount) }}
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 快捷操作 -->
    <div class="actions-section">
      <el-card class="actions-card">
        <template #header>
          <h3>快捷操作</h3>
        </template>
        <div class="actions-grid">
          <el-button 
            type="primary" 
            size="large"
            @click="$router.push('/cleaning/create')"
          >
            <el-icon><Plus /></el-icon>
            新增清洁记录
          </el-button>
          
          <el-button 
            type="success" 
            size="large"
            @click="$router.push('/cleaning')"
          >
            <el-icon><List /></el-icon>
            查看所有记录
          </el-button>
          
          <el-button 
            type="info" 
            size="large"
            @click="exportData"
            :loading="exporting"
          >
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCleaningStore } from '../stores/cleaning'
import { 
  formatDate, 
  formatMoney, 
  formatCurrency, 
  parseRoomNumbers, 
  getCleaningTypeColor,
  exportToCSV
} from '../utils'
import dayjs from 'dayjs'

const router = useRouter()
const cleaningStore = useCleaningStore()

// 状态
const dateRange = ref([])
const recentRecords = ref([])
const exporting = ref(false)

// 统计数据
const stats = computed(() => cleaningStore.stats)

// 格式化数字
const formatNumber = (num) => {
  return Number(num || 0).toLocaleString()
}

// 处理日期范围变化
const handleDateChange = (dates) => {
  refreshData()
}

// 重置日期范围
const resetDateRange = () => {
  dateRange.value = []
  refreshData()
}

// 刷新数据
const refreshData = async () => {
  const params = {}
  if (dateRange.value && dateRange.value.length === 2) {
    params.startDate = dateRange.value[0]
    params.endDate = dateRange.value[1]
  }
  
  // 获取统计数据
  await cleaningStore.fetchStats(params)
  
  // 获取最近记录
  await fetchRecentRecords()
}

// 获取最近记录
const fetchRecentRecords = async () => {
  try {
    await cleaningStore.fetchRecords({ page: 1, pageSize: 5 })
    recentRecords.value = cleaningStore.records.slice(0, 5)
  } catch (error) {
    console.error('获取最近记录失败:', error)
  }
}

// 查看记录详情
const viewRecord = (record) => {
  router.push(`/cleaning/edit/${record.id}`)
}

// 导出数据
const exportData = async () => {
  try {
    exporting.value = true
    
    // 获取所有记录
    const params = { page: 1, pageSize: 1000 }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    
    await cleaningStore.fetchRecords(params)
    
    const data = cleaningStore.records.map(record => ({
      '日期': formatDate(record.date),
      '类型': record.type,
      '房号': record.room_numbers,
      '房间数量': record.room_count,
      '单价': formatMoney(record.unit_price),
      '总金额': formatMoney(record.total_amount),
      '备注': record.remarks || '',
      '创建人': record.created_by_name || '',
      '创建时间': formatDate(record.created_at, 'YYYY-MM-DD HH:mm:ss')
    }))
    
    const filename = `清洁记录_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`
    const headers = ['日期', '类型', '房号', '房间数量', '单价', '总金额', '备注', '创建人', '创建时间']
    
    exportToCSV(data, filename, headers)
  } catch (error) {
    console.error('导出数据失败:', error)
  } finally {
    exporting.value = false
  }
}

// 初始化
onMounted(() => {
  // 设置默认时间范围为最近30天
  const endDate = dayjs()
  const startDate = endDate.subtract(30, 'day')
  dateRange.value = [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
  
  refreshData()
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.filter-section {
  margin-bottom: 24px;
}

.filter-card {
  border-radius: 8px;
}

.filter-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-item label {
  font-weight: 500;
  color: #606266;
  white-space: nowrap;
}

.filter-actions {
  display: flex;
  gap: 12px;
}

.stats-section {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.stats-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.stats-card:hover {
  transform: translateY(-2px);
}

.stats-card.primary {
  background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
}

.stats-card.success {
  background: linear-gradient(135deg, #67c23a 0%, #52c41a 100%);
}

.stats-card.warning {
  background: linear-gradient(135deg, #e6a23c 0%, #fa8c16 100%);
}

.stats-card.danger {
  background: linear-gradient(135deg, #f56c6c 0%, #ff4d4f 100%);
}

.stats-icon {
  font-size: 32px;
  opacity: 0.8;
}

.stats-content h3 {
  font-size: 14px;
  margin: 0 0 8px 0;
  opacity: 0.9;
  font-weight: 500;
}

.stats-content .value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 4px;
  line-height: 1;
}

.stats-content .label {
  font-size: 12px;
  opacity: 0.8;
}

.charts-section {
  margin-bottom: 24px;
}

.chart-card {
  border-radius: 8px;
  height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  height: 320px;
  overflow-y: auto;
}

.empty-chart {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.type-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.type-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.type-item:hover {
  background: #e9ecef;
}

.type-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.type-tag {
  font-weight: 500;
}

.type-count {
  font-size: 14px;
  color: #606266;
}

.type-amount {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

.recent-records {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.record-item:hover {
  background: #e9ecef;
  transform: translateX(4px);
}

.record-info {
  flex: 1;
}

.record-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.record-date {
  font-size: 12px;
  color: #909399;
}

.record-details {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.room-numbers {
  color: #606266;
  font-weight: 500;
}

.room-count {
  color: #909399;
}

.record-amount {
  font-size: 16px;
  font-weight: 600;
  color: #67c23a;
}

.actions-section {
  margin-bottom: 24px;
}

.actions-card {
  border-radius: 8px;
}

.actions-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.actions-grid .el-button {
  flex: 1;
  min-width: 160px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-actions {
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-card {
    padding: 20px;
  }
  
  .stats-content .value {
    font-size: 24px;
  }
  
  .actions-grid {
    flex-direction: column;
  }
  
  .actions-grid .el-button {
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 24px;
  }
  
  .stats-card {
    padding: 16px;
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .stats-icon {
    font-size: 28px;
  }
  
  .stats-content .value {
    font-size: 20px;
  }
}
</style>