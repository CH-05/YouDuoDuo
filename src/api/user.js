import requests from '@/api/index.js';

export const loginAPI = (data) => {
    return requests({
        url: '/login',
        method: 'post',
        data
    })
}
export const registerAPI = (data) => {
    return requests({
        url: '/register',
        method: 'post',
        data
    })
}