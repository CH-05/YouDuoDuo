import request from '@/utils/request'

// 获取菜单列表
export const getMenuListAPI = () => {
    return request({
        url: '/acl/menu/list',
        method: 'get'
    })
}

// 添加菜单
export const addMenuAPI = (data) => {
    return request({
        url: '/acl/menu/add',
        method: 'post',
        data
    })
}

// 更新菜单
export const updateMenuAPI = (menuId, data) => {
    return request({
        url: `/acl/menu/${menuId}`,
        method: 'put',
        data
    })
}

// 删除菜单
export const deleteMenuAPI = (menuId) => {
    return request({
        url: `/acl/menu/${menuId}`,
        method: 'delete'
    })
}

// 更新菜单状态
export const updateMenuStatusAPI = (menuId, status) => {
    return request({
        url: `/acl/menu/${menuId}/status`,
        method: 'put',
        data: { status }
    })
}

// 获取角色菜单
export const reqRoleMenus = (roleId) => {
    return request({
        url: `/menu/role/${roleId}`,
        method: 'get'
    })
}

// 更新角色菜单
export const reqUpdateRoleMenus = (data) => {
    return request({
        url: '/menu/role',
        method: 'post',
        data
    })
} 