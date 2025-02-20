import request from '@/utils/request'

// 获取分类列表
export const reqCategoryList = () => {
    console.log('发起获取分类列表请求')
    return request({
        url: '/product/category/list',
        method: 'get'
    })
} 

// 获取属性列表
export const reqAttrList = (category_id, page = 1, limit = 10) => {
  return request({
    url: `/product/attr/list/${category_id}/${page}/${limit}`,
    method: 'get'
  })
}

// 添加或更新属性
export const reqAddOrUpdateAttr = (data) => {
  return request({
    url: data.attr_id ? `/product/attr/${data.attr_id}` : '/product/attr/add',
    method: data.attr_id ? 'put' : 'post',
    data
  })
}

// 删除属性
export const reqDeleteAttr = (attrId) => {
  return request({
    url: `/product/attr/${attrId}`,
    method: 'delete'
  })
}

// 获取属性值列表
export const reqAttrValues = (attrId) => {
  return request({
    url: `/product/attr/values/${attrId}`,
    method: 'get'
  })
}

// 更新属性值
export const reqUpdateAttrValues = (attrId, values) => {
  return request({
    url: `/product/attr/values/${attrId}`,
    method: 'put',
    data: { values }
  })
}

// 添加分类
export const reqAddCategory = (data) => {
    return request({
        url: '/product/category/add',
        method: 'post',
        data: {
            name: data.name
        }
    })
}

// 删除分类
export const reqDeleteCategory = (categoryId) => {
    return request({
        url: `/product/category/${categoryId}`,
        method: 'delete'
    })
}
