import request from '@/api/index.js';

export const loginAPI = (data) => {
    return request({
        url: '/login',
        method: 'post',
        data
    })
}
export const registerAPI = (data) => {
    return request({
        url: '/register',
        method: 'post',
        data
    })
}
//用户信息
export const getUserInfoAPI = (data) => {
    return request({
        url: '/getInfo',
        method: 'get',
        data
    })
}
//退出登录
export const logoutAPI = () => {
    return request({
        url: '/logout',
        method: 'post'
    })
}