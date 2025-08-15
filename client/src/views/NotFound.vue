<template>
  <div class="not-found">
    <div class="not-found-container">
      <!-- 404图标 -->
      <div class="error-icon">
        <svg viewBox="0 0 200 200" class="error-svg">
          <!-- 404数字 -->
          <text x="100" y="80" class="error-text">404</text>
          <!-- 装饰线条 -->
          <line x1="50" y1="120" x2="150" y2="120" class="error-line" />
          <!-- 小装饰点 -->
          <circle cx="60" cy="140" r="3" class="error-dot" />
          <circle cx="100" cy="145" r="2" class="error-dot" />
          <circle cx="140" cy="140" r="3" class="error-dot" />
        </svg>
      </div>
      
      <!-- 错误信息 -->
      <div class="error-content">
        <h1 class="error-title">页面未找到</h1>
        <p class="error-description">
          抱歉，您访问的页面不存在或已被移除。
        </p>
        <p class="error-suggestion">
          请检查网址是否正确，或返回首页继续浏览。
        </p>
      </div>
      
      <!-- 操作按钮 -->
      <div class="error-actions">
        <el-button 
          type="primary" 
          size="large"
          @click="goHome"
          class="action-button"
        >
          <el-icon><House /></el-icon>
          返回首页
        </el-button>
        
        <el-button 
          size="large"
          @click="goBack"
          class="action-button"
        >
          <el-icon><ArrowLeft /></el-icon>
          返回上页
        </el-button>
      </div>
      
      <!-- 快捷链接 -->
      <div class="quick-links">
        <h3 class="links-title">您可能想要：</h3>
        <div class="links-grid">
          <router-link to="/dashboard" class="quick-link">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据概览</span>
          </router-link>
          
          <router-link to="/cleaning" class="quick-link">
            <el-icon><List /></el-icon>
            <span>清洁记录</span>
          </router-link>
          
          <router-link to="/cleaning/new" class="quick-link">
            <el-icon><Plus /></el-icon>
            <span>新增记录</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 返回首页
const goHome = () => {
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  } else {
    router.push('/login')
  }
}

// 返回上一页
const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    goHome()
  }
}
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.not-found-container {
  text-align: center;
  max-width: 600px;
  width: 100%;
}

/* 错误图标 */
.error-icon {
  margin-bottom: 40px;
}

.error-svg {
  width: 200px;
  height: 200px;
  max-width: 100%;
}

.error-text {
  font-size: 48px;
  font-weight: bold;
  fill: #409eff;
  text-anchor: middle;
  font-family: 'Arial', sans-serif;
}

.error-line {
  stroke: #e6a23c;
  stroke-width: 2;
  stroke-linecap: round;
}

.error-dot {
  fill: #67c23a;
  opacity: 0.8;
}

/* 错误内容 */
.error-content {
  margin-bottom: 40px;
}

.error-title {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
}

.error-description {
  font-size: 18px;
  color: #606266;
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.error-suggestion {
  font-size: 16px;
  color: #909399;
  margin: 0;
  line-height: 1.6;
}

/* 操作按钮 */
.error-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.action-button {
  min-width: 120px;
}

/* 快捷链接 */
.quick-links {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.links-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px 0;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.quick-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  text-decoration: none;
  color: #606266;
  transition: all 0.3s ease;
  background: #fafafa;
}

.quick-link:hover {
  color: #409eff;
  border-color: #409eff;
  background: #ecf5ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.2);
}

.quick-link .el-icon {
  font-size: 24px;
}

.quick-link span {
  font-size: 14px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .not-found {
    padding: 16px;
  }
  
  .error-svg {
    width: 150px;
    height: 150px;
  }
  
  .error-text {
    font-size: 36px;
  }
  
  .error-title {
    font-size: 24px;
  }
  
  .error-description {
    font-size: 16px;
  }
  
  .error-suggestion {
    font-size: 14px;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .action-button {
    width: 100%;
    max-width: 200px;
  }
  
  .quick-links {
    padding: 20px;
  }
  
  .links-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .quick-link {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .error-svg {
    width: 120px;
    height: 120px;
  }
  
  .error-text {
    font-size: 28px;
  }
  
  .error-title {
    font-size: 20px;
  }
  
  .error-description {
    font-size: 14px;
  }
  
  .quick-links {
    padding: 16px;
  }
  
  .links-title {
    font-size: 16px;
  }
}

/* 动画效果 */
.error-icon {
  animation: fadeInUp 0.6s ease-out;
}

.error-content {
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

.error-actions {
  animation: fadeInUp 0.6s ease-out 0.4s both;
}

.quick-links {
  animation: fadeInUp 0.6s ease-out 0.6s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* SVG动画 */
.error-svg {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.error-dot {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 0.4;
  }
}
</style>