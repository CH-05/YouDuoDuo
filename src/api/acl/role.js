import request from "@/utils/request";

// 获取角色列表
export const getRoleListAPI = (page, limit, keyword) => {
    return request({
        url: `/acl/role/list/${page}/${limit}`,
        method: 'get',
        params: { keyword }
    });
};

// 获取所有角色
export const getAllRolesAPI = () => {
    return request({
        url: '/acl/role/all',
        method: 'get'
    });
};

// 添加角色
export const addRoleAPI = (data) => {
    return request({
        url: '/acl/role/add',
        method: 'post',
        data: {
            role_name: data.role_name,
            role_code: data.role_code,
            description: data.description || '',
            status: data.status || 1
        }
    });
};

// 更新角色
export const updateRoleAPI = (roleId, data) => {
    return request({
        url: `/acl/role/${roleId}`,
        method: 'put',
        data: {
            role_name: data.role_name,
            role_code: data.role_code,
            description: data.description || '',
            status: data.status || 1
        }
    });
};

// 删除角色
export const deleteRoleAPI = (roleId) => {
    return request({
        url: `/acl/role/${roleId}`,
        method: 'delete'
    });
};

// 获取用户的角色列表
export const getUserRolesAPI = (userId) => {
    return request({
        url: `/acl/user/${userId}/roles`,
        method: 'get'
    });
};

// 设置用户角色
export const setUserRolesAPI = (userId, roleIds) => {
    return request({
        url: `/acl/user/role`,
        method: 'post',
        data: {
            user_id: userId,
            role_ids: roleIds
        }
    });
};

// 获取用户的权限菜单
export const getPermissionMenuAPI = (userId) => {
    return request({
        url: `/acl/user/${userId}/menu`,
        method: 'get'
    });
};

// 更新角色状态
export const updateRoleStatusAPI = (roleId, status) => {
    return request({
        url: `/acl/role/${roleId}/status`,
        method: 'put',
        data: { status }
    });
};