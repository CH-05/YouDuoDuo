import request from '@/utils/request'

/**
 * 获取销售列表
 * @param {Object} params - 查询参数
 * @returns {Promise} - API响应
 */
export function getSalesListAPI(params) {
    return request({
        url: '/grainOil/sales',
        method: 'get',
        params
    })
}

/**
 * 获取销售详情
 * @param {string} id - 销售单ID
 * @returns {Promise} - API响应
 */
export function getSalesDetailAPI(id) {
    return request({
        url: `/grainOil/sales/${id}`,
        method: 'get'
    })
}

/**
 * 添加销售记录
 * @param {Object} data - 销售数据
 * @returns {Promise} - API响应
 */
export function addSalesAPI(data) {
    return request({
        url: '/grainOil/sales',
        method: 'post',
        data
    })
}

/**
 * 更新销售记录
 * @param {string} id - 销售单ID
 * @param {Object} data - 更新数据
 * @returns {Promise} - API响应
 */
export function updateSalesAPI(id, data) {
    return request({
        url: `/grainOil/sales/${id}`,
        method: 'put',
        data
    })
}

/**
 * 删除销售记录
 * @param {string} id - 销售单ID
 * @returns {Promise} - API响应
 */
export function deleteSalesAPI(id) {
    return request({
        url: `/grainOil/sales/${id}`,
        method: 'delete'
    })
}

/**
 * 更新销售单状态
 * @param {string} id - 销售单ID
 * @param {Object} data - 包含status字段的对象
 * @returns {Promise} - API响应
 */
export function updateSalesStatusAPI(id, data) {
    return request({
        url: `/grainOil/sales/${id}/status`,
        method: 'put',
        data
    })
} 