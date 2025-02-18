import request from '@/utils/request'

// 登录接口
export const login = (data) => {
    return request({
        url: '/user/login',
        method: 'post',
        data
    })
}

// 获取用户信息
export const getInfo = () => {
    return request({
        url: '/user/getInfo',
        method: 'get'
    })
}

// 退出登录
export const logout = () => {
    return request({
        url: '/user/logout',
        method: 'post'
    })
}

export const registerAPI = (data) => {
    return request({
        url: '/user/register',
        method: 'post',
        data
    })
}