import request from '@/utils/request'

// 获取用户列表
export const getUserListAPI = ({ page, limit, keyword }) => {
  return request({
    url: '/acl/user/list/' + page + '/' + limit,
    method: 'get',
    params: { keyword }
  })
}

// 添加或更新用户
export const addOrUpdateUserAPI = (data) => {
  return request({
    url: data.user_id ? `/acl/user/${data.user_id}` : '/acl/user/add',
    method: data.user_id ? 'put' : 'post',
    data
  })
}

// 删除单个用户
export const removeUserAPI = (userId) => {
  return request({
    url: `/acl/user/${userId}`,
    method: 'delete'
  })
}

// 批量删除用户
export const removeUsersAPI = (userIds) => {
  return request({
    url: '/acl/users',
    method: 'delete',
    data: { users_id: userIds }
  })
}

// 重置用户密码
export const resetPasswordAPI = (userId) => {
  return request({
    url: `/acl/user/${userId}/reset-password`,
    method: 'post'
  })
}

// 更新用户状态
export const updateUserStatusAPI = (userId, status) => {
  return request({
    url: `/acl/user/${userId}/status`,
    method: 'put',
    data: { status }
  })
}

// 设置用户角色
export const setUserRoleAPI = (userId, roleIds) => {
  return request({
    url: `/acl/user/role`,
    method: 'post',
    data: { user_id: userId, role_ids: roleIds }
  })
}

// 添加用户权限
export const addUserPermissionAPI = (data) => {
  return request({
    url: '/acl/user/permission',
    method: 'post',
    data
  })
}

// 获取角色列表
export const getRoleListAPI = () => {
  return request({
    url: '/acl/role/list/1/50',
    method: 'get'
  })
} 