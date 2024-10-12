import request from "@/api/index.js";

//获取所有角色列表
export const getRoleListAPI = (page,limit,name) => {
    return request({
        url: `/getRoleList/page=${page}/limit=${limit}?name=${name}`,
        method: 'get',
    })
}

//获取当前点击用户的所有权限
export const reqPermissionMenuAPI = (user_id) => {
    return request({
        url: `/getPermissionMenu?user_id=${user_id}`,
        method: 'get',
    })
}