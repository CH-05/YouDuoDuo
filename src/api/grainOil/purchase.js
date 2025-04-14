import request from '@/utils/request'

/**
 * 获取进货列表
 * @param {Object} params - 查询参数
 * @returns {Promise} - API响应
 */
export function getPurchaseListAPI(params) {
    return request({
        url: '/grainOil/purchase',
        method: 'get',
        params
    })
}

/**
 * 获取进货详情
 * @param {string} id - 进货单ID
 * @returns {Promise} - API响应
 */
export function getPurchaseDetailAPI(id) {
    return request({
        url: `/grainOil/purchase/${id}`,
        method: 'get'
    })
}

/**
 * 添加进货记录
 * @param {Object} data - 进货数据
 * @returns {Promise} - API响应
 */
export function addPurchaseAPI(data) {
    return request({
        url: '/grainOil/purchase',
        method: 'post',
        data
    })
}

/**
 * 更新进货记录
 * @param {string} id - 进货单ID
 * @param {Object} data - 更新数据
 * @returns {Promise} - API响应
 */
export function updatePurchaseAPI(id, data) {
    return request({
        url: `/grainOil/purchase/${id}`,
        method: 'put',
        data
    })
}

/**
 * 删除进货记录
 * @param {string} id - 进货单ID
 * @returns {Promise} - API响应
 */
export function deletePurchaseAPI(id) {
    return request({
        url: `/grainOil/purchase/${id}`,
        method: 'delete'
    })
}

/**
 * 更新进货单状态
 * @param {string} id - 进货单ID
 * @param {Object} data - 包含status字段的对象
 * @returns {Promise} - API响应
 */
export function updatePurchaseStatusAPI(id, data) {
    return request({
        url: `/grainOil/purchase/${id}/status`,
        method: 'put',
        data
    })
} 