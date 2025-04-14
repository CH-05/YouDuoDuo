<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, reactive, nextTick } from 'vue'
import * as echarts from 'echarts'
import { RefreshRight, Money, ShoppingCart, Goods, UserFilled, Back } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import {
  getDashboardStats,
  getSalesTrend,
  getInventoryStats,
  getSalesRanking,
  getBrandSalesRatio,
  getCategorySalesRatio,
  getRecentSales,
  getRecentPurchases
} from '@/api/dashboard/index'

// 页面状态
const loading = ref(false)
const currentDate = ref(new Date().toLocaleDateString())
const refreshInterval = ref<number | null>(null)
const activeTab = ref('sales')
const router = useRouter()

// 统计数据
const stats = reactive({
  totalSales: 0,
  totalPurchase: 0,
  totalInventory: 0,
  totalProfit: 0,
  todaySales: 0,
  todayPurchase: 0,
  userCount: 0,
  orderCount: 0
})

// 图表DOM引用
const salesTrendChart = ref<HTMLElement | null>(null)
const inventoryChart = ref<HTMLElement | null>(null)
const brandRatioChart = ref<HTMLElement | null>(null)
const categoryRatioChart = ref<HTMLElement | null>(null)
const salesRankingChart = ref<HTMLElement | null>(null)

// 最近订单数据
const recentSales = ref<any[]>([])
const recentPurchases = ref<any[]>([])

// 保存所有图表实例，用于销毁
const chartInstances = ref<echarts.ECharts[]>([])

// 初始化所有数据
const initData = async () => {
  loading.value = true
  try {
    await fetchStats()
    
    // 使用setTimeout确保DOM渲染完成
    setTimeout(async () => {
      await Promise.all([
        fetchInventoryStats(),
        fetchSalesRanking(),
        fetchBrandRatio(),
        fetchCategoryRatio(),
        fetchRecentSales(),
        fetchRecentPurchases()
      ])
      loading.value = false
    }, 100)
  } catch (error) {
    console.error('初始化数据失败:', error)
    loading.value = false
  }
}

// 获取总体统计数据
const fetchStats = async () => {
  try {
    const res = await getDashboardStats()
    if (res.code === 200) {
      Object.assign(stats, res.data)
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 获取库存统计
const fetchInventoryStats = async () => {
  try {
    const res = await getInventoryStats()
    if (res.code === 200 && inventoryChart.value) {
      // 添加延迟确保DOM元素已完全渲染
      setTimeout(() => {
        if (inventoryChart.value) {
          const chart = echarts.init(inventoryChart.value, null, {
            renderer: 'canvas',
            useDirtyRect: false,
            width: 'auto',
            height: 'auto'
          })
          chartInstances.value.push(chart)
          chart.setOption({
            title: {
              text: '库存统计',
              left: 'center'
            },
            tooltip: {
              trigger: 'item'
            },
            legend: {
              orient: 'vertical',
              left: 'left'
            },
            series: [
              {
                name: '库存状态',
                type: 'pie',
                radius: '70%',
                data: [
                  { value: res.data.sufficient, name: '库存充足' },
                  { value: res.data.warning, name: '库存预警' },
                  { value: res.data.insufficient, name: '库存不足' }
                ],
                emphasis: {
                  itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                  }
                }
              }
            ]
          })
          chart.resize()
        }
      }, 0)
    }
  } catch (error) {
    console.error('获取库存统计数据失败:', error)
  }
}

// 获取销量排名
const fetchSalesRanking = async () => {
  try {
    const res = await getSalesRanking({ limit: 10 })
    if (res.code === 200 && salesRankingChart.value) {
      // 添加延迟确保DOM元素已完全渲染
      setTimeout(() => {
        if (salesRankingChart.value) {
          const chart = echarts.init(salesRankingChart.value, null, {
            renderer: 'canvas',
            useDirtyRect: false,
            width: 'auto',
            height: 'auto'
          })
          chartInstances.value.push(chart)
          chart.setOption({
            title: {
              text: '商品销量排名Top10',
              left: 'center'
            },
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'shadow'
              }
            },
            grid: {
              left: '3%',
              right: '4%',
              bottom: '10%',
              top: '15%',
              containLabel: true
            },
            xAxis: {
              type: 'value'
            },
            yAxis: {
              type: 'category',
              data: res.data.map((item: any) => item.name)
            },
            series: [
              {
                name: '销量',
                type: 'bar',
                data: res.data.map((item: any) => item.value),
                itemStyle: {
                  color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: '#83bff6' },
                    { offset: 0.5, color: '#188df0' },
                    { offset: 1, color: '#188df0' }
                  ])
                }
              }
            ]
          })
          chart.resize()
        }
      }, 0)
    }
  } catch (error) {
    console.error('获取销量排名数据失败:', error)
  }
}

// 获取品牌销售占比
const fetchBrandRatio = async () => {
  try {
    const res = await getBrandSalesRatio()
    if (res.code === 200 && brandRatioChart.value) {
      // 添加延迟确保DOM元素已完全渲染
      setTimeout(() => {
        if (brandRatioChart.value) {
          const chart = echarts.init(brandRatioChart.value, null, {
            renderer: 'canvas',
            useDirtyRect: false,
            width: 'auto',
            height: 'auto'
          })
          chartInstances.value.push(chart)
          chart.setOption({
            title: {
              text: '品牌销售占比',
              left: 'center'
            },
            tooltip: {
              trigger: 'item',
              formatter: '{a} <br/>{b}: {c} ({d}%)'
            },
            legend: {
              orient: 'vertical',
              right: 10,
              top: 'center',
              data: res.data.map((item: any) => item.name)
            },
            series: [
              {
                name: '品牌销售',
                type: 'pie',
                radius: ['50%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                  borderRadius: 10,
                  borderColor: '#fff',
                  borderWidth: 2
                },
                label: {
                  show: false,
                  position: 'center'
                },
                emphasis: {
                  label: {
                    show: true,
                    fontSize: 20,
                    fontWeight: 'bold'
                  }
                },
                labelLine: {
                  show: false
                },
                data: res.data
              }
            ]
          })
          chart.resize()
        }
      }, 0)
    }
  } catch (error) {
    console.error('获取品牌销售占比数据失败:', error)
  }
}

// 获取分类销售占比
const fetchCategoryRatio = async () => {
  try {
    const res = await getCategorySalesRatio()
    if (res.code === 200 && categoryRatioChart.value) {
      // 添加延迟确保DOM元素已完全渲染
      setTimeout(() => {
        if (categoryRatioChart.value) {
          const chart = echarts.init(categoryRatioChart.value, null, {
            renderer: 'canvas',
            useDirtyRect: false,
            width: 'auto',
            height: 'auto'
          })
          chartInstances.value.push(chart)
          chart.setOption({
            title: {
              text: '分类销售占比',
              left: 'center'
            },
            tooltip: {
              trigger: 'item',
              formatter: '{a} <br/>{b}: {c} ({d}%)'
            },
            legend: {
              orient: 'vertical',
              left: 10,
              top: 'center',
              data: res.data.map((item: any) => item.name)
            },
            series: [
              {
                name: '分类销售',
                type: 'pie',
                radius: ['50%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                  borderRadius: 10,
                  borderColor: '#fff',
                  borderWidth: 2
                },
                label: {
                  show: false,
                  position: 'center'
                },
                emphasis: {
                  label: {
                    show: true,
                    fontSize: 20,
                    fontWeight: 'bold'
                  }
                },
                labelLine: {
                  show: false
                },
                data: res.data
              }
            ]
          })
          chart.resize()
        }
      }, 0)
    }
  } catch (error) {
    console.error('获取分类销售占比数据失败:', error)
  }
}

// 获取最近销售订单
const fetchRecentSales = async () => {
  try {
    const res = await getRecentSales({ limit: 5 })
    if (res.code === 200) {
      recentSales.value = res.data
    }
  } catch (error) {
    console.error('获取最近销售订单失败:', error)
  }
}

// 获取最近进货订单
const fetchRecentPurchases = async () => {
  try {
    const res = await getRecentPurchases({ limit: 5 })
    if (res.code === 200) {
      recentPurchases.value = res.data
    }
  } catch (error) {
    console.error('获取最近进货订单失败:', error)
  }
}

// 全局resize事件处理函数
const handleResize = () => {
  chartInstances.value.forEach(chart => {
    chart.resize()
  })
}

// 组件挂载时初始化数据并添加resize监听
onMounted(() => {
  nextTick(() => {
    initData()
    window.addEventListener('resize', handleResize)
    setupAutoRefresh()
  })
})

// 组件销毁时清除定时器和图表实例
onBeforeUnmount(() => {
  // 清除刷新计时器
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
  
  // 移除resize事件监听
  window.removeEventListener('resize', handleResize)
  
  // 销毁所有图表实例
  chartInstances.value.forEach(chart => {
    chart.dispose()
  })
})

// 手动刷新数据
const refreshData = () => {
  // 销毁现有图表
  chartInstances.value.forEach(chart => {
    chart.dispose()
  })
  chartInstances.value = []
  
  // 重新获取数据
  initData()
}

// 设置自动刷新
const setupAutoRefresh = () => {
  refreshInterval.value = window.setInterval(() => {
    refreshData()
  }, 5 * 60 * 1000) // 5分钟刷新一次
}

// 退出数据大屏
const exitScreen = () => {
  router.back()
}
</script>

<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <div class="title">
        <h1>粮油批发管理系统数据大屏</h1>
        <span class="date">{{ currentDate }}</span>
      </div>
      <div class="actions">
        <el-button type="primary" :icon="RefreshRight" :loading="loading" @click="refreshData" style="margin-right: 10px;">刷新数据</el-button>
        <el-button type="info" :icon="Back" @click="exitScreen">退出大屏</el-button>
      </div>
    </div>
    
    <el-row :gutter="20" class="dashboard-stats">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-title">总销售额</p>
            <h2 class="stat-value">{{ stats.totalSales.toLocaleString() }} 元</h2>
            <p class="stat-daily">今日：{{ stats.todaySales.toLocaleString() }} 元</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon green">
            <el-icon><ShoppingCart /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-title">总进货额</p>
            <h2 class="stat-value">{{ stats.totalPurchase.toLocaleString() }} 元</h2>
            <p class="stat-daily">今日：{{ stats.todayPurchase.toLocaleString() }} 元</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon orange">
            <el-icon><Goods /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-title">总库存额</p>
            <h2 class="stat-value">{{ stats.totalInventory.toLocaleString() }} 元</h2>
            <p class="stat-daily">商品SKU数：{{ stats.orderCount }}</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon purple">
            <el-icon><UserFilled /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-title">总利润</p>
            <h2 class="stat-value">{{ stats.totalProfit.toLocaleString() }} 元</h2>
            <p class="stat-daily">利润率：{{ ((stats.totalProfit / stats.totalSales) * 100).toFixed(2) }}%</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <div ref="inventoryChart" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <div ref="salesRankingChart" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <div ref="brandRatioChart" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <div ref="categoryRatioChart" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <el-card shadow="hover" class="orders-card">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="最近销售订单" name="sales">
              <el-table :data="recentSales" style="width: 100%" height="250">
                <el-table-column prop="sales_no" label="订单编号" width="140" />
                <el-table-column prop="product_name" label="商品名称" width="120" />
                <el-table-column prop="customer" label="客户" width="100" />
                <el-table-column prop="total_amount" label="金额" width="80">
                  <template #default="scope">
                    {{ scope.row.total_amount.toLocaleString() }}
                  </template>
                </el-table-column>
                <el-table-column prop="sales_date" label="日期" width="100" />
                <el-table-column prop="status" label="状态" width="80">
                  <template #default="scope">
                    <el-tag :type="scope.row.status === 1 ? 'success' : 'warning'">
                      {{ scope.row.status === 1 ? '已出库' : '待出库' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
            <el-tab-pane label="最近进货订单" name="purchases">
              <el-table :data="recentPurchases" style="width: 100%" height="250">
                <el-table-column prop="purchase_no" label="订单编号" width="140" />
                <el-table-column prop="product_name" label="商品名称" width="120" />
                <el-table-column prop="supplier" label="供应商" width="100" />
                <el-table-column prop="total_amount" label="金额" width="80">
                  <template #default="scope">
                    {{ scope.row.total_amount.toLocaleString() }}
                  </template>
                </el-table-column>
                <el-table-column prop="purchase_date" label="日期" width="100" />
                <el-table-column prop="status" label="状态" width="80">
                  <template #default="scope">
                    <el-tag :type="scope.row.status === 1 ? 'success' : 'warning'">
                      {{ scope.row.status === 1 ? '已入库' : '待入库' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.dashboard-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  .title {
    h1 {
      font-size: 24px;
      margin: 0;
      color: #303133;
    }
    
    .date {
      color: #909399;
      font-size: 14px;
      margin-left: 10px;
    }
  }
}

.dashboard-stats {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  padding: 10px;
  
  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: #409EFF;
    margin-right: 15px;
    
    .el-icon {
      font-size: 30px;
      color: white;
    }
    
    &.green {
      background-color: #67C23A;
    }
    
    &.orange {
      background-color: #E6A23C;
    }
    
    &.purple {
      background-color: #8e44ad;
    }
  }
  
  .stat-info {
    flex: 1;
    
    .stat-title {
      margin: 0;
      font-size: 14px;
      color: #909399;
    }
    
    .stat-value {
      margin: 5px 0;
      font-size: 24px;
      color: #303133;
    }
    
    .stat-daily {
      margin: 0;
      font-size: 12px;
      color: #909399;
    }
  }
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  height: 350px;
  overflow: hidden;
  position: relative;
}

.chart {
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.orders-card {
  height: 350px;
}

.el-tabs {
  height: 100%;
}
</style>