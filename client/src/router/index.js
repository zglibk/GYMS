import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue')
      },
      {
        path: '/cleaning',
        name: 'CleaningList',
        component: () => import('../views/CleaningList.vue')
      },
      {
        path: '/cleaning/create',
        name: 'CleaningCreate',
        component: () => import('../views/CleaningForm.vue')
      },
      {
        path: '/cleaning/edit/:id',
        name: 'CleaningEdit',
        component: () => import('../views/CleaningForm.vue'),
        props: true
      },
      {
        path: '/rooms',
        name: 'RoomList',
        component: () => import('../views/RoomList.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 如果还未初始化，先进行初始化
  if (!authStore.isInitialized) {
    await authStore.initAuth()
  }
  
  // 需要登录的页面
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }
  
  // 已登录用户访问登录页面，重定向到首页
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/')
    return
  }
  
  next()
})

export default router