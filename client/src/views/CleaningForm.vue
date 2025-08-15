<template>
  <div class="cleaning-form">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <el-button 
          type="text" 
          @click="$router.back()"
          class="back-button"
        >
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1 class="page-title">{{ isEdit ? '编辑清洁记录' : '新增清洁记录' }}</h1>
      </div>
    </div>
    
    <!-- 表单内容 -->
    <div class="form-section">
      <el-card class="form-card">
        <el-form
          ref="formRef"
          :model="form"
          :rules="formRules"
          label-width="100px"
          class="cleaning-form-content"
          @submit.prevent="handleSubmit"
        >
          <el-row :gutter="20">
            <!-- 基本信息 -->
            <el-col :xs="24" :md="12">
              <el-form-item label="清洁日期" prop="date">
                <el-date-picker
                  v-model="form.date"
                  type="date"
                  placeholder="请选择清洁日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            
            <el-col :xs="24" :md="12">
              <el-form-item label="清洁类型" prop="type">
                <el-select 
                  v-model="form.type" 
                  placeholder="请选择清洁类型"
                  style="width: 100%"
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
          </el-row>
          
          <!-- 房间信息 -->
          <el-form-item label="房间号码" prop="roomNumbers">
            <div class="room-input-container">
              <el-select
                v-model="form.roomNumbers"
                multiple
                filterable
                placeholder="请选择房间号码"
                style="width: 100%"
                @change="handleRoomSelectionChange"
              >
                <el-option-group
                  v-for="floor in groupedRooms"
                  :key="floor.floor"
                  :label="`${floor.floor}楼`"
                >
                  <el-option
                    v-for="room in floor.rooms"
                    :key="room.id"
                    :label="`${room.room_number} (${room.room_type})`"
                    :value="room.room_number"
                    :disabled="room.status !== '可用'"
                  >
                    <span>{{ room.room_number }}</span>
                    <span style="float: right; color: #8492a6; font-size: 13px">
                      {{ room.room_type }} - {{ room.status }}
                    </span>
                  </el-option>
                </el-option-group>
              </el-select>
              <div v-if="form.roomNumbers.length > 0" class="room-tags">
                <el-tag
                  v-for="(room, index) in form.roomNumbers"
                  :key="index"
                  closable
                  @close="removeRoom(index)"
                  class="room-tag"
                >
                  {{ room }}
                </el-tag>
              </div>
            </div>
          </el-form-item>
          
          <el-row :gutter="20">
            <el-col :xs="24" :md="8">
              <el-form-item label="房间数量" prop="roomCount">
                <el-input-number
                  v-model="form.roomCount"
                  :min="1"
                  :max="100"
                  placeholder="房间数量"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            
            <el-col :xs="24" :md="8">
              <el-form-item label="单价" prop="unitPrice">
                <el-input-number
                  v-model="form.unitPrice"
                  :min="0"
                  :precision="2"
                  placeholder="单价"
                  style="width: 100%"
                  @change="calculateTotal"
                >
                  <template #prepend>¥</template>
                </el-input-number>
              </el-form-item>
            </el-col>
            
            <el-col :xs="24" :md="8">
              <el-form-item label="总金额" prop="totalAmount">
                <el-input-number
                  v-model="form.totalAmount"
                  :min="0"
                  :precision="2"
                  placeholder="总金额"
                  style="width: 100%"
                >
                  <template #prepend>¥</template>
                </el-input-number>
              </el-form-item>
            </el-col>
          </el-row>
          
          <!-- 备注信息 -->
          <el-form-item label="备注" prop="remarks">
            <el-input
              v-model="form.remarks"
              type="textarea"
              :rows="4"
              placeholder="请输入备注信息（可选）"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
          
          <!-- 操作按钮 -->
          <el-form-item>
            <div class="form-actions">
              <el-button @click="$router.back()">取消</el-button>
              <el-button 
                type="primary" 
                :loading="cleaningStore.loading"
                @click="handleSubmit"
              >
                {{ cleaningStore.loading ? '保存中...' : '保存' }}
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
    
    <!-- 快捷操作提示 -->
    <div class="tips-section">
      <el-card class="tips-card">
        <template #header>
          <div class="tips-header">
            <el-icon><InfoFilled /></el-icon>
            <span>操作提示</span>
          </div>
        </template>
        <ul class="tips-list">
          <li>房间号码支持多选，可按楼层分组选择</li>
          <li>只能选择状态为"可用"的房间</li>
          <li>房间数量会根据选择的房间自动计算</li>
          <li>总金额 = 房间数量 × 单价，也可手动调整</li>
          <li>所有必填字段都需要填写完整才能保存</li>
        </ul>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCleaningStore } from '../stores/cleaning'
import { cleaningTypes, stringifyRoomNumbers, parseRoomNumbers } from '../utils'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const cleaningStore = useCleaningStore()

// 表单引用
const formRef = ref()

// 状态
const roomNumberInput = ref('')
const rooms = ref([])
const loading = ref(false)

// 计算属性
const isEdit = computed(() => !!route.params.id)

// 按楼层分组房间
const groupedRooms = computed(() => {
  const groups = {}
  rooms.value.forEach(room => {
    if (!groups[room.floor_number]) {
      groups[room.floor_number] = {
        floor: room.floor_number,
        rooms: []
      }
    }
    groups[room.floor_number].rooms.push(room)
  })
  return Object.values(groups).sort((a, b) => a.floor - b.floor)
})

// 表单数据
const form = reactive({
  date: dayjs().format('YYYY-MM-DD'),
  type: '',
  roomNumbers: [],
  roomCount: 1,
  unitPrice: 0,
  totalAmount: 0,
  remarks: ''
})

// 表单验证规则
const formRules = {
  date: [
    { required: true, message: '请选择清洁日期', trigger: 'change' }
  ],
  type: [
    { required: true, message: '请选择清洁类型', trigger: 'change' }
  ],
  roomNumbers: [
    { 
      validator: (rule, value, callback) => {
        if (!value || value.length === 0) {
          callback(new Error('请输入房间号码'))
        } else {
          callback()
        }
      }, 
      trigger: 'change' 
    }
  ],
  roomCount: [
    { required: true, message: '请输入房间数量', trigger: 'blur' },
    { type: 'number', min: 1, message: '房间数量不能少于1', trigger: 'blur' }
  ],
  unitPrice: [
    { required: true, message: '请输入单价', trigger: 'blur' },
    { type: 'number', min: 0, message: '单价不能为负数', trigger: 'blur' }
  ],
  totalAmount: [
    { required: true, message: '请输入总金额', trigger: 'blur' },
    { type: 'number', min: 0, message: '总金额不能为负数', trigger: 'blur' }
  ]
}

// 监听房间数量变化，自动计算总金额
watch(() => form.roomCount, () => {
  calculateTotal()
})

// 监听房间号码数组变化，自动更新房间数量
watch(() => form.roomNumbers, (newVal) => {
  if (newVal && newVal.length > 0) {
    form.roomCount = newVal.length
  }
  updateRoomNumberInput()
}, { deep: true })

// 获取房号数据
const fetchRooms = async () => {
  try {
    loading.value = true
    const token = localStorage.getItem('token')
    
    if (!token) {
      console.error('未找到访问令牌，请重新登录')
      ElMessage.error('未找到访问令牌，请重新登录')
      rooms.value = []
      return
    }
    
    console.log('正在获取房号数据...')
    const response = await axios.get('/api/rooms', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    console.log('API响应:', response.data)
    
    // 确保rooms.value是数组
    if (response.data.success && response.data.data) {
      rooms.value = response.data.data.rooms || []
      console.log('成功加载房号数据:', rooms.value.length, '条记录')
    } else {
      console.warn('API返回数据格式异常:', response.data)
      rooms.value = []
      ElMessage.warning('房号数据格式异常')
    }
  } catch (error) {
    console.error('获取房号数据失败:', error)
    if (error.response) {
      console.error('错误响应:', error.response.data)
      if (error.response.status === 401) {
        ElMessage.error('访问令牌已过期，请重新登录')
      } else {
        ElMessage.error(`获取房号数据失败: ${error.response.data.message || error.message}`)
      }
    } else {
      ElMessage.error('网络连接失败，请检查网络')
    }
    rooms.value = [] // 确保在错误情况下也是数组
  } finally {
    loading.value = false
  }
}

// 处理房间选择变化
const handleRoomSelectionChange = () => {
  // 房间数量会通过watch自动更新
}

// 处理房间号码输入变化（保留兼容性）
const handleRoomNumbersChange = () => {
  const rooms = parseRoomNumbers(roomNumberInput.value)
  form.roomNumbers = rooms
}

// 移除房间
const removeRoom = (index) => {
  form.roomNumbers.splice(index, 1)
}

// 更新房间号码输入框
const updateRoomNumberInput = () => {
  roomNumberInput.value = form.roomNumbers.join(',')
}

// 计算总金额
const calculateTotal = () => {
  if (form.roomCount && form.unitPrice) {
    form.totalAmount = Number((form.roomCount * form.unitPrice).toFixed(2))
  }
}

// 处理提交
const handleSubmit = async () => {
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
    
    const submitData = {
      date: form.date,
      type: form.type,
      roomNumbers: form.roomNumbers,
      roomCount: form.roomCount,
      unitPrice: form.unitPrice,
      totalAmount: form.totalAmount,
      remarks: form.remarks
    }
    
    let success = false
    
    if (isEdit.value) {
      success = await cleaningStore.updateRecord(route.params.id, submitData)
    } else {
      success = await cleaningStore.createRecord(submitData)
    }
    
    if (success) {
      router.push('/cleaning')
    }
  } catch (error) {
    console.error('提交失败:', error)
  }
}

// 加载记录数据（编辑模式）
const loadRecord = async () => {
  if (!isEdit.value) return
  
  try {
    const record = await cleaningStore.fetchRecord(route.params.id)
    if (record) {
      form.date = record.date
      form.type = record.type
      form.roomNumbers = parseRoomNumbers(record.room_numbers)
      form.roomCount = record.room_count
      form.unitPrice = record.unit_price
      form.totalAmount = record.total_amount
      form.remarks = record.remarks || ''
    } else {
      ElMessage.error('记录不存在')
      router.push('/cleaning')
    }
  } catch (error) {
    console.error('加载记录失败:', error)
    router.push('/cleaning')
  }
}

// 初始化
onMounted(() => {
  fetchRooms() // 获取房号数据
  if (isEdit.value) {
    loadRecord()
  }
})
</script>

<style scoped>
.cleaning-form {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-button {
  font-size: 16px;
  color: #606266;
  padding: 8px;
}

.back-button:hover {
  color: #409eff;
  background-color: #ecf5ff;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.form-section {
  margin-bottom: 24px;
}

.form-card {
  border-radius: 8px;
}

.cleaning-form-content {
  padding: 20px;
}

.room-input-container {
  width: 100%;
}

.room-tags {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.room-tag {
  margin: 0;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.tips-section {
  margin-bottom: 24px;
}

.tips-card {
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409eff;
  font-weight: 600;
}

.tips-list {
  margin: 0;
  padding-left: 20px;
  color: #606266;
  line-height: 1.8;
}

.tips-list li {
  margin-bottom: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .cleaning-form {
    margin: 0;
    padding: 0 10px;
  }
  
  .cleaning-form-content {
    padding: 16px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions .el-button {
    width: 100%;
  }
  
  .room-tags {
    margin-top: 8px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 20px;
  }
  
  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .cleaning-form-content {
    padding: 12px;
  }
}

/* 表单项样式优化 */
.el-form-item {
  margin-bottom: 24px;
}

.el-input-number {
  width: 100%;
}

/* 移动端表单优化 */
@media (max-width: 768px) {
  .el-form-item {
    margin-bottom: 20px;
  }
  
  .el-form-item__label {
    line-height: 1.4;
    padding-bottom: 8px;
  }
}
</style>