//对于axios的二次封装
import axios from 'axios'
//引入进度条
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import {ElMessage} from "element-plus";
import {useUserStore} from "@/stores/user.js";


const axiosInstance = new axios.create({
    //基础路径
    baseURL: '/api',
    //请求超时的时间
    timeout: 5000
});

//请求拦截器，再发请求之前，请求拦截器可以检测到，可以在请求发出去之前做一些事情
axiosInstance.interceptors.request.use(config => {
    const userStore = useUserStore()
    if (userStore.userInfo.token) {
        const Token = userStore.userInfo.token
        //按照后端要求拼接token数据
        config.headers.authorization = `Bearer ${Token}`
    }
    //请求开始时引入开始进度条
    NProgress.start();
    return config
}, error => {
    return Promise.reject(error);
});

//响应拦截器
axiosInstance.interceptors.response.use(res => {
    //响应结束时引入结束进度条
    NProgress.done();
    //成功回调函数，服务器响应数据回来之后，相应拦截器可以检测到，可以做一些事情
    return res.data;
}, e => {
    console.log(e);
    //失败回调，处理http网络错误
    let message = "";
    const status = e.response.status
    console.log(status);
    switch (status) {
        case 401:
            message = "Token失效"
            window.location.replace('/user/login')
            break;
        case 403:
            message = "无权访问";
            break;
        case 404:
            message = "资源不存在";
            break;
        case 500:
            message = "服务器内部错误";
            break;
        default:
            message = "网络错误";
            break;
    }
    ElMessage({
        type: 'error',
        message: message
    })
    return Promise.reject(e)
})

export default axiosInstance