// 路由鉴权
import router from './router'
// 注意：路由鉴权文件里面使用pinia仓库数据的方法
import pinia from './stores'
import useUserStore from '@/stores/modules/user'
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
  document.title = `${setting.title} - ${to.meta.title}`
  NProgress.start()
  const token = userStore.token
  const username = userStore.username
  if (token) {
    // 用户登录或注册
    if (to.path === '/login' || to.path === '/register') {
      next({ path: '/' })
    } else {
      // 判断是否有用户信息
      if (username) {
        next()
      } else {
        try {
          await userStore.userInfo()
          next({ ...to })
        } catch (error) {
          let res = await userStore.userLogout()
          console.log(res);
          next({ path: '/login', query: { redirect: to.path } })
        }
      }
    }
  } else {
    // 用户未登录
    if (to.path === '/login' || to.path === '/register') {
      next()
    } else {
      next({ path: '/login', query: { redirect: to.path } })
    }
  }
})

// 后置守卫
router.afterEach(() => {
  NProgress.done()
})
