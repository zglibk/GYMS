<template>
  <div class="room-list">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>房号管理</h1>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加房号
      </el-button>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-form :model="filters" inline>
        <el-form-item label="楼层">
          <el-select v-model="filters.floor" placeholder="选择楼层" clearable>
            <el-option
              v-for="floor in floorOptions"
              :key="floor"
              :label="`${floor}楼`"
              :value="floor"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="房间类型">
          <el-select v-model="filters.roomType" placeholder="选择房间类型" clearable>
            <el-option
              v-for="type in roomTypeOptions"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="选择状态" clearable>
            <el-option label="可用" value="可用" />
            <el-option label="维修中" value="维修中" />
            <el-option label="停用" value="停用" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadRooms">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 房号列表 -->
    <div class="table-section">
      <el-table
        :data="rooms"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="room_number" label="房号" width="120" />
        <el-table-column prop="floor_number" label="楼层" width="80">
          <template #default="{ row }">
            {{ row.floor_number }}楼
          </template>
        </el-table-column>
        <el-table-column prop="room_type" label="房间类型" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              size="small"
            >
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remarks" label="备注" show-overflow-tooltip />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="editRoom(row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="deleteRoom(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 添加/编辑房号对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingRoom ? '编辑房号' : '添加房号'"
      width="500px"
    >
      <el-form
        ref="roomFormRef"
        :model="roomForm"
        :rules="roomFormRules"
        label-width="80px"
      >
        <el-form-item label="房号" prop="room_number">
          <el-input
            v-model="roomForm.room_number"
            placeholder="请输入房号，如：101"
            maxlength="20"
          />
        </el-form-item>
        <el-form-item label="楼层" prop="floor_number">
          <el-input-number
            v-model="roomForm.floor_number"
            :min="1"
            :max="50"
            placeholder="请选择楼层"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="房间类型" prop="room_type">
          <el-select
            v-model="roomForm.room_type"
            placeholder="请选择房间类型"
            style="width: 100%"
          >
            <el-option label="双床" value="双床" />
            <el-option label="大床" value="大床" />
            <el-option label="三床" value="三床" />
            <el-option label="续住" value="续住" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="roomForm.status"
            placeholder="请选择状态"
            style="width: 100%"
          >
            <el-option label="可用" value="可用" />
            <el-option label="维修中" value="维修中" />
            <el-option label="停用" value="停用" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="roomForm.remarks"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="saveRoom" :loading="saving">
            {{ editingRoom ? '更新' : '添加' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useRoomStore } from '@/stores/room'
import { formatDate } from '@/utils'

// 使用房号store
const roomStore = useRoomStore()

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const showAddDialog = ref(false)
const editingRoom = ref(null)
const roomFormRef = ref()

// 房号列表数据
const rooms = ref([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  pages: 0
})

// 筛选条件
const filters = reactive({
  floor: '',
  roomType: '',
  status: ''
})

// 楼层和房间类型选项
const floorOptions = ref([])
const roomTypeOptions = ref([])

// 房号表单
const roomForm = reactive({
  room_number: '',
  floor_number: 1,
  room_type: '',
  status: '可用',
  remarks: ''
})

// 表单验证规则
const roomFormRules = {
  room_number: [
    { required: true, message: '请输入房号', trigger: 'blur' },
    { min: 1, max: 20, message: '房号长度在1到20个字符', trigger: 'blur' }
  ],
  floor_number: [
    { required: true, message: '请选择楼层', trigger: 'change' }
  ],
  room_type: [
    { required: true, message: '请选择房间类型', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

/**
 * 获取状态标签类型
 */
const getStatusType = (status) => {
  switch (status) {
    case '可用':
      return 'success'
    case '维修中':
      return 'warning'
    case '停用':
      return 'danger'
    default:
      return 'info'
  }
}

/**
 * 加载房号列表
 */
const loadRooms = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      ...filters
    }
    
    const response = await roomStore.fetchRooms(params)
    console.log('RoomList API响应:', response)
    
    // 修正数据结构处理，匹配后端API响应格式
    if (response.success && response.data) {
      rooms.value = response.data.rooms || []
      pagination.total = response.data.pagination?.total || 0
      pagination.pages = response.data.pagination?.pages || 0
      console.log('成功加载房号列表:', rooms.value.length, '条记录')
    } else {
      console.warn('RoomList API返回数据格式异常:', response)
      rooms.value = []
      ElMessage.warning('房号列表数据格式异常')
    }
  } catch (error) {
    console.error('加载房号列表失败:', error)
    if (error.response) {
      console.error('错误响应:', error.response.data)
      ElMessage.error(`加载房号列表失败: ${error.response.data.message || error.message}`)
    } else {
      ElMessage.error('网络连接失败，请检查网络')
    }
    rooms.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 加载楼层选项
 */
const loadFloorOptions = async () => {
  try {
    const response = await roomStore.getFloors()
    floorOptions.value = response.data
  } catch (error) {
    console.error('加载楼层选项失败:', error)
  }
}

/**
 * 加载房间类型选项
 */
const loadRoomTypeOptions = async () => {
  try {
    const response = await roomStore.getRoomTypes()
    roomTypeOptions.value = response.data
  } catch (error) {
    console.error('加载房间类型选项失败:', error)
  }
}

/**
 * 重置筛选条件
 */
const resetFilters = () => {
  filters.floor = ''
  filters.roomType = ''
  filters.status = ''
  pagination.current = 1
  loadRooms()
}

/**
 * 重置房号表单
 */
const resetRoomForm = () => {
  roomForm.room_number = ''
  roomForm.floor_number = 1
  roomForm.room_type = ''
  roomForm.status = '可用'
  roomForm.remarks = ''
  editingRoom.value = null
  
  nextTick(() => {
    roomFormRef.value?.clearValidate()
  })
}

/**
 * 编辑房号
 */
const editRoom = (room) => {
  editingRoom.value = room
  roomForm.room_number = room.room_number
  roomForm.floor_number = room.floor_number
  roomForm.room_type = room.room_type
  roomForm.status = room.status
  roomForm.remarks = room.remarks || ''
  showAddDialog.value = true
}

/**
 * 保存房号
 */
const saveRoom = async () => {
  try {
    const valid = await roomFormRef.value.validate()
    if (!valid) return
    
    saving.value = true
    
    if (editingRoom.value) {
      // 更新房号
      await roomStore.updateRoom(editingRoom.value.id, roomForm)
      ElMessage.success('房号更新成功')
    } else {
      // 添加房号
      await roomStore.createRoom(roomForm)
      ElMessage.success('房号添加成功')
    }
    
    showAddDialog.value = false
    resetRoomForm()
    loadRooms()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

/**
 * 删除房号
 */
const deleteRoom = async (room) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除房号 ${room.room_number} 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await roomStore.deleteRoom(room.id)
    ElMessage.success('房号删除成功')
    loadRooms()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

/**
 * 分页大小改变
 */
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.current = 1
  loadRooms()
}

/**
 * 当前页改变
 */
const handleCurrentChange = (page) => {
  pagination.current = page
  loadRooms()
}

// 监听添加对话框关闭
const handleDialogClose = () => {
  resetRoomForm()
}

// 组件挂载时加载数据
onMounted(() => {
  loadRooms()
  loadFloorOptions()
  loadRoomTypeOptions()
})
</script>

<style scoped>
.room-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.filter-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.table-section {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.pagination-section {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-table) {
  border-radius: 0;
}

:deep(.el-table th) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
}

:deep(.el-pagination) {
  justify-content: center;
}
</style>