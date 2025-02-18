//获取当前品牌列表
import request from '@/utils/request'

// 获取品牌列表
export const reqHasTrademarkAPI = (page, limit, keyword = '') => {
    return request({
        url: `/product/getAllProduct/page=${page}/limit=${limit}`,
        method: 'get',
        params: { keyword }
    })
}

// 添加或更新品牌
export const reqAddOrUpdateTrademark = (data) => {
    return request({
        url: data.product_id ? `/product/baseTrademark/update` : `/product/baseTrademark/save`,
        method: 'post',
        data
    })
}

// 删除品牌
export const reqDeleteTrademark = (product_id) => {
    return request({
        url: `/product/deleteTrademark/${product_id}`,
        method: 'delete'
    })
}

// 获取所有品牌列表（不分页）
export const reqAllTrademark = () => {
    return request({
        url: '/product/baseTrademark/getTrademarkList',
        method: 'get'
    })
}

// 根据ID获取品牌详情
export const reqTrademarkById = (product_id) => {
    return request({
        url: `/product/baseTrademark/get/${product_id}`,
        method: 'get'
    })
}

// 上传品牌图片
export const uploadTrademarkImage = (data) => {
    return request({
        url: '/product/fileUpload',
        method: 'post',
        data,
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}

// 获取品牌关联的属性
export const reqProductAttrRelation = (product_id) => {
    return request({
        url: `/product/${product_id}/attrs`,
        method: 'get'
    })
}

// 保存品牌属性关联
export const reqSaveProductAttr = (data) => {
    return request({
        url: '/product/attr',
        method: 'post',
        data
    })
}

// 获取品牌的属性详情
export const reqProductAttrDetail = (product_id) => {
    return request({
        url: `/product/${product_id}/attr/detail`,
        method: 'get'
    })
}