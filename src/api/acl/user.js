import request from "@/api/index.js";

//获取用户列表
export const getUserListAPI = (page,limit,username) => {
    return request({
        url: `/getUserList/page=${page}/limit=${limit}?username=${username}`,
        method: 'get',
    })
}

//单个删除用户
export const removeUserAPI = (user_id) => {
    return request({
        url: `/removeUser`,
        method: 'delete',
        data:user_id
    })
}

//批量删除用户
export const removeUsersAPI = (data) =>{
    return request({
        url: `/removeUsers`,
        method: 'delete',
        data
    })
}

//添加新用户
export const addNewUserAPI = (data) => {
    return request({
        url: '/addNewUser',
        method: 'post',
        data
    })
}