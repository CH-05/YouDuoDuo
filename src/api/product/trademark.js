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
        data,
        timeout: 30000 // 增加超时时间
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
        url: '/product/getAllTrademark',
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
        },
        timeout: 30000 // 增加超时时间
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
    console.log('API调用参数:', JSON.stringify(data));
    // 确保attr_ids是数组
    if (!Array.isArray(data.attr_ids)) {
        console.error('attr_ids必须是数组');
        return Promise.reject(new Error('attr_ids必须是数组'));
    }
    
    return request({
        url: `/product/${data.product_id}/attr/relation`,
        method: 'post',
        data: {
            category_id: data.category_id,
            attrIds: data.attr_ids  // 确保参数名与后端一致
        }
    })
}

// 获取品牌的属性详情
export const reqProductAttrDetail = (product_id) => {
    return request({
        url: `/product/${product_id}/attr/detail`,
        method: 'get'
    })
}