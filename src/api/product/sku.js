import request from '@/utils/request'

// 获取SKU列表
export const reqSkuList = (page, limit, params = {}) => {
    return request({
        url: '/product/sku/list',
        method: 'get',
        params: {
            page,
            limit,
            ...params
        }
    })
}

// 获取SKU详情
export const reqSkuDetail = (skuId) => {
    return request({
        url: `/product/sku/detail/${skuId}`,
        method: 'get'
    })
}

// 保存SKU
export const reqSaveSku = (data) => {
    return request({
        url: '/product/sku/save',
        method: 'post',
        data
    })
}

// 删除SKU
export const reqDeleteSku = (skuId) => {
    return request({
        url: `/product/sku/delete/${skuId}`,
        method: 'delete'
    })
}

// 获取SPU的销售属性
export const reqSpuSaleAttr = (spuId) => {
    return request({
        url: `/product/sku/spuSaleAttr/${spuId}`,
        method: 'get'
    })
}

// 上传SKU图片
export const uploadSkuImage = (data) => {
    return request({
        url: '/product/sku/image/upload',
        method: 'post',
        data,
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}