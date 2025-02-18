import {defineStore} from 'pinia'
import {login, getInfo, logout, registerAPI} from '@/api/user'
import {removeToken, setToken, getToken} from '@/utils/auth'
// 引入路由 (常量路由)
import { constantRoute, anyRoute, asyncRoute } from '@/router/routes'
import router, { resetRouter } from '@/router'
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

// 创建用户相关的store
export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    menuRoutes: constantRoute,
    username: '',
    avatar: '',
    role: {
      id: null,
      name: ''
    },
    userInfo: {}
  }),
  actions: {
    // 登录
    async userLogin(data) {
      try {
        const result = await login(data)
        if (result.code === 200) {
          this.token = result.data.token
          localStorage.setItem('token', result.data.token)
          // 登录成功后立即获取用户信息
          await this.getUserInfo()
          return 'ok'
        } else {
          return Promise.reject(new Error(result.message))
        }
      } catch (error) {
        console.error('登录失败:', error)
        return Promise.reject(error)
      }
    },
    // 获取用户信息
    async getUserInfo() {
      try {
        const result = await getInfo()
        console.log("获取用户信息结果:", result)
        
        if (result.code === 200) {
          this.userInfo = result.data
          this.username = result.data.username
          this.avatar = result.data.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
          
          // 设置用户最高权限角色
          if (result.data.roles && result.data.roles.length > 0) {
            // 找出role_id最小的角色（权限最高）
            const highestRole = result.data.roles.reduce((prev, curr) => 
              parseInt(prev.role_id) < parseInt(curr.role_id) ? prev : curr
            )
            
            this.role = {
              id: parseInt(highestRole.role_id),
              name: highestRole.role_name
            }
            console.log("设置的角色信息:", this.role)
          } else {
            this.role = {
              id: 999,
              name: '普通用户'
            }
            console.log("未找到角色，设置为普通用户")
          }
          
          // 处理路由权限
          let routes = []
          try {
            routes = typeof result.data.routes === 'string' 
              ? JSON.parse(result.data.routes)
              : result.data.routes || []
          } catch (error) {
            console.error('解析routes失败:', error)
            routes = []
          }

          const labels = this.extractLabels(routes)
          console.log('提取的路由标签:', labels)

          // 根据用户角色处理路由
          let userAsyncRoute = []
          if (this.role.id <= 2) { // 超级管理员和管理员可以访问所有路由
            userAsyncRoute = cloneDeep(asyncRoute)
          } else {
            userAsyncRoute = filterAsyncRoute(
              cloneDeep(asyncRoute),
              labels
            )
          }
          
          // 添加动态路由
          [...userAsyncRoute, ...anyRoute].forEach((route) => {
            router.addRoute(route)
          })
          
          // 更新菜单路由
          this.menuRoutes = [...constantRoute, ...userAsyncRoute]
          
          return 'ok'
        } else {
          return Promise.reject(new Error(result.message))
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        return Promise.reject(error)
      }
    },
    // 提取路由标签
    extractLabels(routes) {
      const labels = []
      const traverse = (nodes) => {
        nodes.forEach(node => {
          if (node.label && node.select) {
            labels.push(node.label)
          }
          if (node.children) {
            traverse(node.children)
          }
        })
      }
      traverse(routes)
      return labels
    },
    // 退出登录
    async userLogout() {
      try {
        await logout()
        // 清除用户信息
        this.token = ''
        this.userInfo = {}
        this.username = ''
        this.avatar = ''
        this.role = {
          id: null,
          name: ''
        }
        // 重置路由为基础路由
        this.menuRoutes = constantRoute
        // 清除本地存储
        localStorage.removeItem('token')
        // 重置路由
        resetRouter()
        return 'ok'
      } catch (error) {
        console.error("退出登录失败:", error)
        return Promise.reject(error)
      }
    },
    // 生成菜单的路由
    async generateRoutes() {
      let routes = [...constantRoute, ...asyncRoute, ...anyRoute]
      this.menuRoutes = routes
      return routes
    },
    // 添加注册方法
    async userRegister(data) {
      try {
        const result = await registerAPI(data)
        if (result.code === 200) {
          return 'ok'
        } else {
          return Promise.reject(new Error(result.message))
        }
      } catch (error) {
        console.error("注册失败:", error)
        return Promise.reject(error)
      }
    }
  },
  getters: {},
})
