import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/modules/user'

// 创建axios实例
const request = axios.create({
    // 直接指向后端服务器
    baseURL: 'http://localhost:3000',
    timeout: 10000, // 增加超时时间
    retry: 3, // 重试次数
    retryDelay: 1000 // 重试延迟
})

// 请求拦截器
request.interceptors.request.use(
    (config) => {
        const userStore = useUserStore()
        if (userStore.token) {
            // 确保 token 的设置方式符合后端要求
            config.headers['Authorization'] = `Bearer ${userStore.token}`
            // 或
            // config.headers['token'] = userStore.token
        }
        return config
    },
    (error) => {
        console.error('请求发送失败:', error);
        ElMessage.error('请求发送失败')
        return Promise.reject(error)
    }
)

// 响应拦截器
request.interceptors.response.use(
    (response) => {
        // 可以在这里关闭 loading 状态
        const { data, code, message, error } = response.data
        if (code === 200) {
            return response.data
        } else {
            console.error('请求失败:', { code, message, error });
            ElMessage.error(message || '操作失败')
            return Promise.reject(new Error(error || message || '操作失败'))
        }
    },
    async (error) => {
        console.error('响应错误:', error);
        const config = error.config

        // 如果是连接错误且还有重试次数，则进行重试
        if (error.message.includes('ECONNREFUSED') && config.retry > 0) {
            console.log(`尝试第 ${4 - config.retry} 次重试...`);
            config.retry--
            
            // 延迟重试
            await new Promise(resolve => setTimeout(resolve, config.retryDelay))
            
            try {
                return await request(config)
            } catch (retryError) {
                console.error('重试失败:', retryError);
                if (config.retry === 0) {
                    ElMessage.error('服务器连接失败，请检查网络或联系管理员')
                }
                return Promise.reject(retryError)
            }
        }

        const message = error.response?.data?.message || error.message || '网络错误'
        ElMessage.error(message)
        return Promise.reject(error)
    }
)

export default request