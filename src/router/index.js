import { createRouter, createWebHashHistory } from 'vue-router'
import { constantRoute, asyncRoute, anyRoute } from './routes'

const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoute,  // 初始只加载基础路由
  // 滚动行为
  scrollBehavior() {
    return {
      left: 0,
      top: 0,
    }
  },
})

// 重置路由方法
export const resetRouter = () => {
  // 移除所有动态添加的路由
  const newRouter = createRouter({
    history: createWebHashHistory(),
    routes: constantRoute,  // 重置为基础路由
    scrollBehavior() {
      return {
        left: 0,
        top: 0
      }
    }
  })
  router.matcher = newRouter.matcher
}

export default router
