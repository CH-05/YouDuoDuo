import request from '@/utils/request'

// 获取菜单树
export const reqMenuTree = () => {
    return request({
        url: '/menu/tree',
        method: 'get'
    })
}

// 添加菜单
export const reqAddMenu = (data) => {
    return request({
        url: '/menu/add',
        method: 'post',
        data
    })
}

// 更新菜单
export const reqUpdateMenu = (data) => {
    return request({
        url: '/menu/update',
        method: 'put',
        data
    })
}

// 删除菜单
export const reqDeleteMenu = (menuId) => {
    return request({
        url: `/menu/${menuId}`,
        method: 'delete'
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