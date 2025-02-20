import request from '@/utils/request'

// 获取SKU列表
export const reqSkuList = (page, limit, params = {}) => {
    const { category_id, spu_id, ...restParams } = params
    const queryParams = {
        page,
        limit,
        ...restParams
    }
    
    if (category_id !== undefined && category_id !== null && category_id !== '') {
        queryParams.category_id = category_id
    }
    if (spu_id !== undefined && spu_id !== null && spu_id !== '') {
        queryParams.spu_id = spu_id
    }
    
    console.log('SKU列表请求最终参数:', {
        url: '/product/sku/list',
        method: 'get',
        params: queryParams,
        headers: {
            'Content-Type': 'application/json'
        }
    })
    
    return request({
        url: '/product/sku/list',
        method: 'get',
        params: queryParams,
        headers: {
            'Content-Type': 'application/json'
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
    console.log('获取SPU销售属性，参数:', { spuId })
    return request({
        url: `/product/spu/saleAttr/${spuId}`,
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