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
              :shortcuts="dateShortcuts"
              style="width: 300px;"
            />
          </div>
          <div class="quick-filters">
            <el-button-group>
              <el-button 
                v-for="shortcut in quickDateFilters" 
                :key="shortcut.key"
                :type="activeQuickFilter === shortcut.key ? 'primary' : 'default'"
                size="small"
                @click="setQuickDateRange(shortcut)"
              >
                {{ shortcut.text }}
              </el-button>
            </el-button-group>
          </div>
          <div class="filter-actions">
            <el-button @click="resetDateRange">重置</el-button>
            <el-button type="primary" @click="refreshData" :loading="loading">
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
        <!-- 房间类型分布 -->
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <h3>房间类型分布</h3>
                <div class="chart-controls">
                  <el-button-group>
                    <el-button 
                      :type="chartViewType === 'list' ? 'primary' : 'default'"
                      size="small"
                      @click="chartViewType = 'list'"
                    >
                      <el-icon><List /></el-icon>
                      清单
                    </el-button>
                    <el-button 
                      :type="chartViewType === 'chart' ? 'primary' : 'default'"
                      size="small"
                      @click="chartViewType = 'chart'"
                    >
                      <el-icon><PieChart /></el-icon>
                      图表
                    </el-button>
                  </el-button-group>
                </div>
              </div>
            </template>
            <div class="chart-container">
              <div v-if="stats.roomTypeStats.length === 0" class="empty-chart">
                <el-empty description="暂无数据" />
              </div>
              <!-- 清单视图 -->
              <div v-else-if="chartViewType === 'list'" class="type-stats">
                <div 
                  v-for="item in stats.roomTypeStats" 
                  :key="item.type"
                  class="type-item"
                >
                  <div class="type-info">
                    <el-tag 
                      :type="getRoomTypeColor(item.type)"
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
              <!-- 南丁格尔玫瑰图 -->
              <div v-else class="chart-view">
                <div ref="chartContainer" class="echarts-container"></div>
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
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue'
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
import * as echarts from 'echarts'
import { List, PieChart } from '@element-plus/icons-vue'

const router = useRouter()
const cleaningStore = useCleaningStore()

// 状态
const dateRange = ref([])
const recentRecords = ref([])
const exporting = ref(false)
const activeQuickFilter = ref('30days')
const chartViewType = ref('list') // 图表视图类型：'list' | 'chart'
const chartContainer = ref(null) // 图表容器引用
let chartInstance = null // ECharts实例

// 统计数据
const stats = computed(() => cleaningStore.stats)
const loading = computed(() => cleaningStore.loading)

// 快捷日期选择配置
const quickDateFilters = ref([
  { key: '7days', text: '最近7天', days: 7 },
  { key: '30days', text: '最近30天', days: 30 },
  { key: '90days', text: '最近90天', days: 90 },
  { key: 'thisMonth', text: '本月', type: 'month' },
  { key: 'lastMonth', text: '上月', type: 'lastMonth' }
])

// 日期选择器快捷选项
const dateShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    }
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    }
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    }
  }
]

// 格式化数字
const formatNumber = (num) => {
  return Number(num || 0).toLocaleString()
}

// 设置快捷日期范围
const setQuickDateRange = (shortcut) => {
  activeQuickFilter.value = shortcut.key
  
  const today = dayjs()
  let startDate, endDate
  
  switch (shortcut.type) {
    case 'month':
      startDate = today.startOf('month')
      endDate = today.endOf('month')
      break
    case 'lastMonth':
      startDate = today.subtract(1, 'month').startOf('month')
      endDate = today.subtract(1, 'month').endOf('month')
      break
    default:
      endDate = today
      startDate = today.subtract(shortcut.days, 'day')
  }
  
  dateRange.value = [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
  refreshData()
}

// 处理日期范围变化
const handleDateChange = (dates) => {
  // 清除快捷选择状态
  activeQuickFilter.value = ''
  refreshData()
}

// 重置日期范围
const resetDateRange = () => {
  // 重置为默认的最近30天
  const endDate = dayjs()
  const startDate = endDate.subtract(30, 'day')
  dateRange.value = [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
  activeQuickFilter.value = ''
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
    const params = { page: 1, pageSize: 5 }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    
    await cleaningStore.fetchRecords(params)
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

/**
 * 初始化ECharts图表
 */
const initChart = () => {
  if (!chartContainer.value) return
  
  chartInstance = echarts.init(chartContainer.value)
  updateChart()
}

/**
 * 更新图表数据
 */
const updateChart = () => {
  if (!chartInstance || !stats.value.roomTypeStats.length) return
  
  const data = stats.value.roomTypeStats.map(item => ({
    name: item.type,
    value: item.count,
    amount: item.amount
  }))
  
  const option = {
    title: {
      text: '房间类型分布',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        const item = stats.value.roomTypeStats.find(s => s.type === params.name)
        return `${params.name}<br/>记录数: ${params.value}<br/>金额: ¥${formatCurrency(item?.amount || 0)}`
      }
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    series: [
      {
        name: '房间类型',
        type: 'pie',
        radius: ['20%', '70%'],
        center: ['60%', '50%'],
        roseType: 'radius',
        itemStyle: {
          borderRadius: 8
        },
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  chartInstance.setOption(option)
}

/**
 * 销毁图表实例
 */
const destroyChart = () => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
}

// 监听图表视图类型变化
watch(chartViewType, async (newType) => {
  if (newType === 'chart') {
    await nextTick()
    // 确保有数据时才初始化图表
    if (stats.value.roomTypeStats && stats.value.roomTypeStats.length > 0) {
      initChart()
    }
  } else {
    destroyChart()
  }
})

/**
 * 获取房间类型对应的颜色
 * @param {string} type - 房间类型
 * @returns {string} 颜色类型
 */
const getRoomTypeColor = (type) => {
  const colorMap = {
    '标准间': 'primary',
    '豪华间': 'success',
    '套房': 'warning',
    '总统套房': 'danger',
    '商务间': 'info'
  }
  return colorMap[type] || 'info'
}

// 监听统计数据变化，更新图表
watch(() => stats.value.roomTypeStats, () => {
  if (chartViewType.value === 'chart') {
    if (stats.value.roomTypeStats && stats.value.roomTypeStats.length > 0) {
      if (!chartInstance) {
        nextTick(() => {
          initChart()
        })
      } else {
        updateChart()
      }
    }
  }
}, { deep: true })

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

.quick-filters {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quick-filters .el-button-group {
  display: flex;
  gap: 4px;
}

.quick-filters .el-button {
  border-radius: 4px;
  transition: all 0.3s ease;
}

.quick-filters .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-actions {
  display: flex;
  gap: 12px;
}

@media (max-width: 768px) {
  .filter-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-item {
    justify-content: center;
  }
  
  .quick-filters {
    justify-content: center;
  }
  
  .quick-filters .el-button-group {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .filter-actions {
    justify-content: center;
  }
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
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-controls .el-button-group {
  border-radius: 6px;
  overflow: hidden;
}

.chart-controls .el-button {
  border-radius: 0;
  transition: all 0.3s ease;
}

.chart-controls .el-button:first-child {
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
}

.chart-controls .el-button:last-child {
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
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

.chart-view {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.echarts-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
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