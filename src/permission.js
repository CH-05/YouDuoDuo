// 注意：路由鉴权文件里面使用pinia仓库数据的方法
import pinia from './stores'
import {useUserStore} from '@/stores/modules/user'
import router from '@/router'
// @ts-ignore
import NProgress from 'nprogress'
import setting from './setting'
import 'nprogress/nprogress.css'

// nprogress的配置
NProgress.configure({
  // 去除加载圆圈转动的效果
  showSpinner: false,
})

const userStore = useUserStore(pinia)

// 前置守卫
router.beforeEach(async (to, _from, next) => {
  // 修改标题处理逻辑
  const title = to.meta.title || '首页'  // 添加默认值
  document.title = `${setting.title} - ${title}`
  
  NProgress.start()
  const token = userStore.token
  const username = userStore.username

  try {
    if (token) {
      if (to.path === '/login' || to.path === '/register') {
        next('/')
      } else {
        if (username) {
          // 检查用户是否有访问该路由的权限
          if (to.matched.length === 0) {
            next('/404')
          } else {
            next()
          }
        } else {
          try {
            // 使用try/catch替代Promise.reject处理
            await userStore.getUserInfo()
            // 重要：获取用户信息后，需要重新触发路由
            next({ ...to, replace: true })
          } catch (error) {
            console.error('获取用户信息失败:', error)
            // 出错时退出登录并重定向到登录页
            await userStore.userLogout()
            next({ path: '/login', query: { redirect: to.path } })
          }
        }
      }
    } else {
      if (to.path === '/login' || to.path === '/register') {
        next()
      } else {
        next({ path: '/login', query: { redirect: to.path } })
      }
    }
  } catch (error) {
    console.error('路由守卫错误:', error)
    // 确保userLogout完成后再跳转
    try {
      await userStore.userLogout()
    } catch (logoutError) {
      console.error('退出登录失败:', logoutError)
    }
    next({ path: '/login', query: { redirect: to.path } })
  }
})

// 后置守卫
router.afterEach(() => {
  NProgress.done()
})
