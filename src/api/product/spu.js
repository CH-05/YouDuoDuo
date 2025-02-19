import request from '@/utils/request'

// 获取SPU列表
export const reqSpuList = (page, limit, category_id) => {
    return request({
        url: `/product/spu/list/${page}/${limit}`,
        method: 'get',
        params: { category_id }
    })
}

// 获取SPU详情
export const reqSpuDetail = (spuId) => {
    return request({
        url: `/product/spu/${spuId}`,
        method: 'get'
    })
}

// 添加或更新SPU
export const reqSaveSpu = (data) => {
    return request({
        url: data.spu_id ? `/product/spu/${data.spu_id}` : '/product/spu/add',
        method: data.spu_id ? 'put' : 'post',
        data
    })
}

// 删除SPU
export const reqDeleteSpu = (spuId) => {
    return request({
        url: `/product/spu/${spuId}`,
        method: 'delete'
    })
}

// 上传SPU图片
export const uploadSpuImage = (data) => {
    return request({
        url: '/product/spu/image/upload',
        method: 'post',
        data,
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}

// 获取品牌列表
export const reqTrademarkList = () => {
    return request({
        url: '/product/getAllProduct/page=1/limit=100',
        method: 'get'
    })
}

// 获取销售属性列表
export const reqSaleAttrList = (spuId) => {
    return request({
        url: `/product/spu/saleAttr/${spuId}`,
        method: 'get'
    })
}

// 保存销售属性
export const reqSaveSaleAttr = (spuId, data) => {
    return request({
        url: `/product/spu/saleAttr/${spuId}`,
        method: 'post',
        data
    })
} 