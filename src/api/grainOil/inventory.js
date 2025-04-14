import request from '@/utils/request'

/**
 * 获取库存列表
 * @param {Object} params - 查询参数
 * @returns {Promise} - API响应
 */
export function getInventoryListAPI(params) {
    return request({
        url: '/grainOil/inventory',
        method: 'get',
        params
    })
}

/**
 * 获取库存详情
 * @param {string} id - 库存ID
 * @returns {Promise} - API响应
 */
export function getInventoryDetailAPI(id) {
    return request({
        url: `/grainOil/inventory/${id}`,
        method: 'get'
    })
}

/**
 * 更新库存数量（手动调整）
 * @param {string} id - 库存ID
 * @param {Object} data - 更新数据
 * @returns {Promise} - API响应
 */
export function updateInventoryAPI(id, data) {
    return request({
        url: `/grainOil/inventory/${id}`,
        method: 'put',
        data
    })
}

/**
 * 获取库存流水记录
 * @param {Object} params - 查询参数
 * @returns {Promise} - API响应
 */
export function getInventoryRecordsAPI(params) {
    return request({
        url: '/grainOil/inventory/records',
        method: 'get',
        params
    })
} 