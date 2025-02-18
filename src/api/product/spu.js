import request from '@/utils/request'

// 获取SPU列表
export const reqSpuList = (page, limit, category3Id) => {
    return request({
        url: '/product/spu/list',
        method: 'get',
        params: { page, limit, category3Id }
    })
}

// 获取SPU详情
export const reqSpuDetail = (spuId) => {
    return request({
        url: `/product/spu/${spuId}`,
        method: 'get'
    })
}

// 保存SPU
export const reqSaveSpu = (data) => {
    return request({
        url: '/product/spu/save',
        method: 'post',
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