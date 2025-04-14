import request from '@/utils/request'

// 获取总体统计数据
export function getDashboardStats() {
  return request({
    url: '/api/dashboard/stats',
    method: 'get'
  })
}

// 获取销售趋势数据
export function getSalesTrend(params) {
  return request({
    url: '/api/dashboard/sales/trend',
    method: 'get',
    params
  })
}

// 获取库存统计数据
export function getInventoryStats() {
  return request({
    url: '/api/dashboard/inventory/stats',
    method: 'get'
  })
}

// 获取销量排名数据
export function getSalesRanking(params) {
  return request({
    url: '/api/dashboard/sales/ranking',
    method: 'get',
    params
  })
}

// 获取品牌销售占比
export function getBrandSalesRatio() {
  return request({
    url: '/api/dashboard/brand/sales',
    method: 'get'
  })
}

// 获取分类销售占比
export function getCategorySalesRatio() {
  return request({
    url: '/api/dashboard/category/sales',
    method: 'get'
  })
}

// 获取用户活跃度数据
export function getUserActivity() {
  return request({
    url: '/api/dashboard/user/activity',
    method: 'get'
  })
}

// 获取最近销售订单
export function getRecentSales(params) {
  return request({
    url: '/api/dashboard/recent/sales',
    method: 'get',
    params
  })
}

// 获取最近进货订单
export function getRecentPurchases(params) {
  return request({
    url: '/api/dashboard/recent/purchases',
    method: 'get',
    params
  })
} 