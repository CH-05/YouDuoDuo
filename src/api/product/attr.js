import request from '@/utils/request'

// 获取分类列表
export const reqCategoryList = () =>{
    return request({
        url: '/product/getCategory',
        method: 'get'
      })
} 

// 获取属性列表
export const reqAttrList = (categoryId) =>{
    return request({
        url: `/product/attrList/${categoryId}`,
        method: 'get'
      })
}

// 添加或修改属性
export const reqAddOrUpdateAttr = (data) =>{
    return request({
        url: '/product/saveAttr',
        method: 'post',
        data
      })
}

// 删除属性
export const reqDeleteAttr = (attrId) =>{
    return request({
        url: `/product/deleteAttr/${attrId}`,
        method: 'delete'
      })
}

// 添加分类
export const reqAddCategory = (data) => {
    return request({
        url: '/product/category/add',
        method: 'post',
        data
    })
}

// 删除分类
export const reqDeleteCategory = (categoryId) => {
    return request({
        url: `/product/category/${categoryId}`,
        method: 'delete'
    })
}
