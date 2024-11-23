import {defineStore} from 'pinia'
import {getUserInfoAPI, loginAPI, logoutAPI, registerAPI} from '@/api/user'

import {getToken, removeToken, setToken} from '@/utils/token'
// 引入路由 (常量路由)
import { constantRoute, anyRoute, asyncRoute } from '@/router/routes'
import router from '@/router'
import cloneDeep from 'lodash/cloneDeep'

const filterAsyncRoute = (asyncRoute, routes) => {
  return asyncRoute.filter((item) => {
    if (routes.includes(item.name)) {
      if (item.children && item.children.length) {
        item.children = filterAsyncRoute(item.children, routes)
      }
      return true
    }
  })
}

const useUserStore = defineStore('userStore', {
  state: () => {
    return {
      token: getToken(),
      menuRoutes: [],
      username: '',
      avatar: '',
      role: {
        id: null,
        name: ''
      }
    }
  },
  actions: {
    // 登录
    async userLogin(data) {
      const result = await loginAPI(data)
      if (result.code === 200) {
        this.token = result.data.token
        setToken(result.data.token)
        return 'ok'
      } else {
        return Promise.reject(new Error(result.data))
      }
    },
    //注册
    async userRegister(data) {
      const result = await registerAPI(data)
      console.log(result);
      if (result.code === 200) {
        return 'ok'
      }else{
        return Promise.reject(new Error(result.data))
      }
    },
    // 获取用户信息
    async userInfo() {
      const result = await getUserInfoAPI()
      if (result.code === 200) {
        this.username = result.data.username
        this.avatar = result.data.avatar
        this.role = result.data.role
        let routes = JSON.parse(result.data.routes)
        //把result.data.routes中label字段的value提取出来组成一个新数组
        function collectLabels(routes) {
          let labels = [];
          for (let route of routes) {
            if (route.label && route.select) {
              labels.push(route.label);
            }
            if (route.children) {
              labels = labels.concat(collectLabels(route.children));
            }
          }
          return labels;
        }

        const labels = collectLabels(routes);

        const userAsyncRoute = filterAsyncRoute(
          cloneDeep(asyncRoute),
          labels
        )
        const arr = [...userAsyncRoute, ...anyRoute]
        this.menuRoutes = [...constantRoute, ...arr]
        arr.forEach((item) => {
          router.addRoute(item)
        })
        return 'ok'
      } else {
        return Promise.reject(new Error(result.message))
      }
    },
    // 退出登录
    async userLogout() {
      const result = await logoutAPI()
      if (result.code === 200) {
        this.token = ''
        this.username = ''
        this.avatar = ''
        removeToken()
        return 'ok'
      } else {
        return Promise.reject(new Error(result.message))
      }
    },
  },
  getters: {},
})

export default useUserStore
