<template>
  <div class="sales-container">
    <!-- 搜索区域 -->
    <div class="search-form">
      <el-form :model="queryParams" inline>
        <el-form-item label="销售单号">
          <el-input 
            v-model="queryParams.salesNo" 
            placeholder="销售单号/商品名称" 
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select 
            v-model="queryParams.status" 
            placeholder="选择状态" 
            clearable
            style="width: 120px;"
          >
            <el-option label="全部" value="" />
            <el-option label="待出库" :value="0" />
            <el-option label="已出库" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 操作按钮区域 -->
    <div class="action-wrapper">
      <el-button type="primary" @click="handleAdd" icon="Plus">新增销售</el-button>
      <el-button type="danger" @click="handleBatchDelete" :disabled="!selectedRows.length" icon="Delete">批量删除</el-button>
    </div>

    <!-- 表格区域 -->
    <el-table
        v-loading="loading"
        :data="tableData"
        @selection-change="handleSelectionChange"
        border
        stripe
        style="width: 100%"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column prop="salesNo" label="销售单号" min-width="160" sortable />
      <el-table-column prop="productName" label="商品名称(概览)" min-width="200" show-overflow-tooltip />
      <el-table-column prop="totalAmount" label="总金额" width="130" align="right" sortable>
        <template #default="scope">
          ¥{{ Number(scope.row.totalAmount || 0).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="customer" label="客户名称" min-width="150" show-overflow-tooltip />
      <el-table-column prop="salesDate" label="销售日期" width="120" sortable />
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 0 ? 'warning' : 'success'" size="small">
            {{ scope.row.status === 0 ? '待出库' : '已出库' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="scope">
          <el-tooltip content="出库" placement="top" v-if="scope.row.status === 0">
            <el-button type="success" link @click="handleOutbound(scope.row)" icon="UploadFilled" />
          </el-tooltip>
          <el-tooltip content="编辑" placement="top" v-if="scope.row.status === 0">
            <el-button type="primary" link @click="handleEdit(scope.row)" icon="Edit" />
          </el-tooltip>
           <el-tooltip content="删除" placement="top" v-if="scope.row.status === 0">
            <el-button type="danger" link @click="handleDelete(scope.row.id)" icon="Delete" />
           </el-tooltip>
          <el-tag 
            v-if="scope.row.status === 1" 
            type="success" 
            size="small"
          >
            已出库
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.limit"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
        v-model="dialog.visible"
        :title="dialog.title"
        width="80%" 
        @close="resetForm" 
        :close-on-click-modal="false" 
        destroy-on-close 
    >
      <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
          v-loading="dialog.loading" 
      >
        <el-form-item label="客户名称" prop="customer">
          <el-input v-model="form.customer" placeholder="请输入客户名称" clearable />
        </el-form-item>
        <el-form-item label="销售日期" prop="salesDate">
          <el-date-picker
              v-model="form.salesDate"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <!-- 明细表格 -->
        <el-form-item label="商品明细">
          <el-table :data="form.details" border stripe size="small">
            <!-- 商品选择列 (使用远程搜索Select) -->
            <el-table-column label="* 商品名称/选择" min-width="250">
              <template #default="scope">
                <el-select
                  v-model="scope.row.selectedItem" 
                  placeholder="输入关键字搜索并选择"
                  filterable
                  remote
                  :remote-method="(query) => remoteInventorySearch(query)"
                  :loading="remoteLoading"
                  @change="() => handleInventorySelectChange(scope.$index)" 
                  style="width: 100%;"
                  clearable 
                  value-key="id" 
                  @clear="() => handleInventorySelectChange(scope.$index)" 
                >
                  <el-option
                    v-for="item in remoteInventoryOptions"
                    :key="item.mergedId + '-' + item.originalIds.length" 
                    :label="`${item.skuName} (${item.skuSpec || '无'}) [库存:${item.availableStock}]`"
                    :value="item" 
                  >
                    <div class="sku-option">
                      <div>
                        <span class="sku-name">{{ item.skuName }}</span>
                        <span v-if="item.skuSpec" style="font-size: 12px; color: #666; margin-left: 5px;">({{ item.skuSpec }})</span>
                         <span v-if="item.originalIds && item.originalIds.length > 1" class="merged-tag-small"> ({{ item.originalIds.length }}批)</span>
                      </div>
                      <div class="sku-detail">
                        <small>品牌: {{ item.tmName || '-' }}</small>
                        <small class="ml-2">库存: {{ item.availableStock }} {{ item.unit }}</small>
                        <small v-if="item.purchasePrice > 0" class="ml-2">采: ¥{{ Number(item.purchasePrice).toFixed(2) }}</small>
                      </div>
                    </div>
                  </el-option>
                   <template #loading> <el-icon class="is-loading"><Loading /></el-icon> 加载中 </template>
                   <template #empty> <span>无匹配数据</span> </template>
                </el-select>
              </template>
            </el-table-column>
            
            <!-- 其他列: 可用库存, 数量, 单位, 单价, 金额 -->
             <el-table-column label="可用库存" width="90" align="center">
               <template #default="scope">
                  <span :class="{'stock-count': true, 'low-stock': scope.row.availableStock < 10}">{{ scope.row.availableStock }}</span>
               </template>
             </el-table-column>
             <el-table-column label="* 数量" width="120">
               <template #default="scope">
                 <el-input-number 
                   :model-value="Number(scope.row.quantity)" 
                   @update:model-value="value => scope.row.quantity = Number(value)" 
                   :min="1" 
                   :max="scope.row.availableStock || 99999"
                   @change="() => calculateRowTotal(scope.row)" 
                   :precision="0"
                   controls-position="right"
                   :disabled="!scope.row.inventoryId" 
                   style="width: 100%"
                 />
               </template>
             </el-table-column>
             <el-table-column label="单位" width="70" align="center">
                <template #default="scope">
                  <span>{{ scope.row.unit || '-' }}</span>
                </template>
             </el-table-column>
             <el-table-column label="* 销售单价" width="130">
               <template #default="scope">
                 <el-input-number 
                   :model-value="Number(scope.row.price)" 
                   @update:model-value="value => scope.row.price = Number(value)" 
                   :min="0.01" 
                   :precision="2"
                   :step="0.1"
                   controls-position="right"
                   @change="() => calculateRowTotal(scope.row)" 
                   :disabled="!scope.row.inventoryId" 
                   style="width: 100%"
                 />
               </template>
             </el-table-column>
             <el-table-column label="金额" width="110" align="right">
               <template #default="scope">
                 <span style="color: #f56c6c; font-weight: bold;">¥{{ Number(scope.row.totalAmount || 0).toFixed(2) }}</span>
               </template>
             </el-table-column>
             
             <!-- 操作列 -->
             <el-table-column label="操作" width="70" align="center">
               <template #default="scope">
                 <el-tooltip content="删除此行" placement="top">
                    <el-button type="danger" link @click="removeDetail(scope.$index)" icon="Delete" />
                 </el-tooltip>
               </template>
             </el-table-column>
          </el-table>
          
          <!-- 底部操作和总计 -->
          <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center;">
             <el-button type="primary" @click="addDetail" icon="Plus">添加明细行</el-button>
             <div class="detail-summary">
               <span>总金额: <span class="total-amount">¥{{ calculateTotalAmount() }}</span></span>
             </div>
          </div>
        </el-form-item>
      </el-form>
      
      <!-- 对话框底部按钮 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="dialog.loading">
            {{ dialog.type === 'add' ? '确认新增' : '确认修改' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getSalesListAPI, addSalesAPI, updateSalesAPI, deleteSalesAPI, getSalesDetailAPI, updateSalesStatusAPI } from '@/api/grainOil/sales'
import { getInventoryListAPI } from '@/api/grainOil/inventory'  // 引入库存相关API
import axios from 'axios'

// 创建axios实例
const instance = axios.create({
  baseURL: '',
  timeout: 30000
})

// 查询参数
const queryParams = reactive({
  salesNo: '',
  status: '',  // 空字符串对应"全部"选项
  page: 1,
  limit: 10
})

// 表格数据相关
const loading = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const total = ref(0)

// 库存商品列表
const inventoryList = ref([])
// 库存加载状态
const inventoryLoading = ref(false)

// 远程搜索相关状态
const remoteInventoryOptions = ref([])
const remoteLoading = ref(false)

// 获取表格数据
const getTableData = async () => {
  loading.value = true
  try {
    // 构建查询参数
    const params = {
      page: queryParams.page,
      limit: queryParams.limit,
      keyword: queryParams.salesNo, 
      status: queryParams.status
    }
    
    console.log('销售列表查询参数:', params)
    const res = await getSalesListAPI(params)
    console.log('销售列表API响应:', res)
    
    // 检查响应
    if (res.code === 200 && res.data) {
      // 直接使用返回的数据
      tableData.value = res.data.records || []
      total.value = res.data.total || 0
      console.log('设置表格数据完成, 条数:', tableData.value.length, '数据:', tableData.value)
    } else {
      console.error('获取销售列表失败, 响应码:', res.code, '消息:', res.message)
      ElMessage.error(res.message || '获取数据失败')
    }
  } catch (error) {
    console.error('获取表格数据失败, 详细错误:', error)
    ElMessage.error('获取数据失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 获取库存列表
const getInventoryList = async () => {
  inventoryLoading.value = true
  inventoryList.value = []
  try {
    console.log('调用getInventoryListAPI')
    const res = await getInventoryListAPI({ page: 1, limit: 1000 })
    console.log('库存API响应:', res)
    
    // 处理不同的响应结构
    let responseData = null
    
    if (res.code === 200) {
      // 直接使用返回的数据
      responseData = res.data || {}
    } else if (res.data && res.data.code === 200) {
      // 使用嵌套结构
      responseData = res.data.data || {}
    } else {
      throw new Error(res.message || res.data?.message || '获取库存列表失败')
    }
    
    console.log('库存数据:', responseData)
    
    const records = responseData.records || []
    console.log('库存记录数:', records.length)
    
    // 归类相同商品并累加库存
    const mergedInventoryMap = new Map()
    
    records.forEach(item => {
      // 只处理有库存的商品
      const totalStock = Number(item.totalStock || item.stock || 0)
      const lockedStock = Number(item.lockedStock || 0)
      if (totalStock <= lockedStock) return
      
      // 使用商品SKU ID和名称作为唯一标识
      const key = `${item.skuId || item.product_id}_${item.skuName || item.product_name}`
      
      // 标准化处理单个记录
      const inventoryItem = {
        id: item.id, // 保留第一个记录的ID
        skuId: item.skuId || item.product_id,
        skuName: item.skuName || item.product_name || '',
        skuSpec: item.skuSpec || '',
        tmId: item.tmId || item.tm_id,
        tmName: item.tmName || '',
        purchaseId: item.purchaseId || item.purchase_id,
        purchasePrice: Number(item.purchasePrice || item.purchase_price || 0),
        totalStock: Number(item.totalStock || item.stock || 0),
        lockedStock: Number(item.lockedStock || item.locked_stock || 0),
        availableStock: Number(item.totalStock || item.stock || 0) - Number(item.lockedStock || item.locked_stock || 0),
        unit: item.unit || '千克',
        originalIds: [item.id] // 记录原始库存记录IDs
      }
      
      if (mergedInventoryMap.has(key)) {
        // 已存在该商品，累加库存
        const existing = mergedInventoryMap.get(key)
        existing.totalStock += inventoryItem.totalStock
        existing.lockedStock += inventoryItem.lockedStock
        existing.availableStock += inventoryItem.availableStock
        existing.originalIds.push(item.id) // 添加ID到原始记录列表
        
        // 使用价格较新的记录价格（保持最新的采购价格）
        if (item.updated_at && (!existing.updated_at || new Date(item.updated_at) > new Date(existing.updated_at))) {
          existing.purchasePrice = inventoryItem.purchasePrice
        }
      } else {
        // 新商品，添加到Map
        inventoryItem.updated_at = item.updated_at
        mergedInventoryMap.set(key, inventoryItem)
      }
    })
    
    // 转换回数组
    inventoryList.value = Array.from(mergedInventoryMap.values())
      // 只保留有可用库存的商品
      .filter(item => item.availableStock > 0)
      // 按名称排序
      .sort((a, b) => a.skuName.localeCompare(b.skuName))
    
    console.log('合并后库存记录数:', inventoryList.value.length)
    console.log('合并后库存数据:', inventoryList.value)
  } catch (error) {
    console.error('获取库存列表失败:', error)
    ElMessage.error('获取库存列表失败: ' + (error.message || '未知错误'))
  } finally {
    inventoryLoading.value = false
  }
}

// 分页变化
const handleSizeChange = (val) => {
  queryParams.limit = val
  getTableData()
}

const handleCurrentChange = (val) => {
  queryParams.page = val
  getTableData()
}

// 查询处理
const handleSearch = () => {
  queryParams.page = 1
  getTableData()
}

// 重置查询
const handleReset = () => {
  queryParams.salesNo = ''
  queryParams.status = ''  // 空字符串对应"全部"选项
  handleSearch()
}

// 表格选择
const handleSelectionChange = (val) => {
  selectedRows.value = val
}

// 表单相关
const dialog = reactive({
  visible: false,
  title: '新增销售',
  loading: false,
  type: 'add' // 'add' or 'edit'
});

// 表单引用
const formRef = ref(null);

// 表单数据
const form = reactive({
  id: null,
  customer: '',
  salesDate: new Date().toISOString().slice(0, 10),
  details: []
});

// 表单校验规则
const rules = {
  customer: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  salesDate: [{ required: true, message: '请选择销售日期', trigger: 'change' }]
}

// 计算总金额
const calculateTotalAmount = () => {
  const total = form.details.reduce((sum, item) => sum + (item.totalAmount || 0), 0)
  return total.toFixed(2)
}

// 打开商品选择对话框
const openProductSelector = () => {
  console.log('[Sales View] openProductSelector called');
  remoteLoading.value = true;
  console.log('[Sales View] remoteLoading set to:', remoteLoading.value);
};

// 处理商品选择确认事件
const handleProductConfirm = (selectedProducts) => {
  console.log('[Sales View] Received confirm event with products:', selectedProducts);
  if (selectedProducts && selectedProducts.length > 0) {
    selectedProducts.forEach(product => {
      const purchasePriceNum = Number(product.purchasePrice || 0);
      let calculatedPrice = 0;
      if (purchasePriceNum > 0) {
          calculatedPrice = Math.round(purchasePriceNum * 1.2 * 100) / 100;
      } else {
          calculatedPrice = 1;
      }

      const newDetail = {
        inventoryId: product.id,
        originalIds: product.originalIds,
        skuId: product.skuId,
        skuName: product.skuName,
        skuSpec: product.skuSpec,
        tmName: product.tmName,
        quantity: 1,
        unit: product.unit || '千克',
        price: calculatedPrice,
        totalAmount: 0,
        availableStock: Number(product.availableStock || 0),
        purchasePrice: purchasePriceNum
      };
      
      calculateRowTotal(newDetail);
      
      console.log('[Sales View] Pushing new detail:', newDetail);
      form.details.push(newDetail);
      console.log('[Sales View] form.details after push:', JSON.stringify(form.details));
    });
  } else {
      console.log('[Sales View] Received confirm event but selectedProducts is empty or invalid.');
  }
};

// 计算行总金额
const calculateRowTotal = (row) => {
  if (!row) return
  
  try {
    // 确保是数字类型
    const quantity = Number(row.quantity || 0)
    const price = Number(row.price || 0)
    
    // ElInputNumber v-model 应该已经是数字了，但再次确认
    row.quantity = quantity
    row.price = price
    
    // 确保销售数量为正数
    if (quantity <= 0) {
      row.quantity = 1
      ElMessage.warning('销售数量必须大于0')
    }
    
    // 重新计算总金额
    if (quantity > 0 && price > 0) {
      row.totalAmount = Number((quantity * price).toFixed(2))
    } else {
      row.totalAmount = 0
    }
  } catch (error) {
    console.error('计算行总金额时出错:', error)
  }
}

// 删除明细行
const removeDetail = (index) => {
  form.details.splice(index, 1)
}

// 提交表单
const handleSubmit = async () => {
  if (!form.details.length) {
    ElMessage.warning('请添加至少一条商品明细')
    return
  }
  
  // 检查是否有明细未选择库存商品
  const invalidDetails = form.details.filter(item => !item.inventoryId)
  if (invalidDetails.length > 0) {
    ElMessage.warning('请为所有明细选择库存商品')
    return
  }
  
  try {
    await formRef.value.validate()
    
    // 确认表单所有明细都有效
    for (const detail of form.details) {
      if (!detail.inventoryId || !detail.quantity || !detail.price) {
        ElMessage.warning('存在不完整的明细项，请检查')
        return
      }
      
      if (detail.quantity <= 0) {
        ElMessage.warning(`商品 ${detail.skuName} 的销售数量必须大于0`)
        return
      }
      
      if (detail.price <= 0) {
        ElMessage.warning(`商品 ${detail.skuName} 的销售价格必须大于0`)
        return
      }
      
      if (detail.quantity > detail.availableStock) {
        ElMessage.warning(`商品 ${detail.skuName} 的销售数量超过了可用库存`)
        return
      }
      
      // 确保单位有值
      if (!detail.unit) {
        detail.unit = '千克'
      }
    }
    
    // 计算总金额和平均单价
    const totalAmount = calculateTotalAmount();
    const totalQuantity = form.details.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const averagePrice = totalQuantity > 0 ? Number((totalAmount / totalQuantity).toFixed(2)) : 0;
    
    // 准备提交的数据，处理多个原始库存ID
    const formData = {
      customer: form.customer,
      salesDate: typeof form.salesDate === 'string' ? form.salesDate.substring(0, 10) : form.salesDate,
      // 展开合并后的明细记录到多条原始库存记录
      details: form.details.flatMap(item => {
        // 获取所有原始库存ID
        const originalIds = item.originalIds || [item.inventoryId]
        const price = Number(item.price) || 0
        const quantity = Number(item.quantity) || 0
        const totalAmount = Number(item.totalAmount) || (price * quantity) || 0
        
        // 处理单个库存ID的情况
        if (originalIds.length === 1) {
          return [{
            inventoryId: originalIds[0],
            quantity: quantity,
            unit: item.unit || '千克',
            price: price,
            amount: totalAmount
          }]
        }
        
        // 按比例分配数量和金额给每个原始库存
        // 合并库存后分配量不可能精确，采用简单平均法
        const avgQuantity = Math.floor(quantity / originalIds.length)
        let remainingQuantity = quantity - (avgQuantity * originalIds.length)
        
        return originalIds.map((id, index) => {
          // 为最后一个ID补齐剩余数量，避免舍入误差
          const itemQuantity = index === originalIds.length - 1 
            ? avgQuantity + remainingQuantity 
            : avgQuantity
          
          // 计算每个明细项的金额
          const itemAmount = Number((itemQuantity * price).toFixed(2))
          
          return {
            inventoryId: id,
            quantity: itemQuantity,
            unit: item.unit || '千克',
            price: price,
            amount: itemAmount
          }
        })
      })
    }
    
    // 详细检查确保明细都有必要的字段
    formData.details.forEach((detail, index) => {
      if (!detail.unit) {
        console.warn(`明细项 ${index+1} 没有单位，设置为默认值`);
        detail.unit = '千克';
      }
      
      if (!detail.price || detail.price <= 0) {
        console.warn(`明细项 ${index+1} 价格无效，设置为默认值`);
        // 如果单个明细价格无效，使用平均单价或默认价格
        detail.price = averagePrice || 1;
        // 重新计算总额
        detail.amount = Number((detail.quantity * detail.price).toFixed(2));
      }
    });
    
    console.log('提交数据处理完成，平均单价:', averagePrice);
    console.log('提交的销售单数据，明细条数:', formData.details.length);
    
    loading.value = true
    console.log('提交的销售单数据:', formData)
    
    let res
    if (dialog.type === 'add' || !form.id) {
      // 新增销售记录
      res = await addSalesAPI(formData)
    } else {
      // 更新销售记录
      formData.id = form.id
      res = await updateSalesAPI(form.id, formData)
    }
    
    console.log('销售单提交响应:', res)
    
    // 修改：直接检查res的code字段，而不是res.data.code
    if (res.code === 200) {
      ElMessage.success(dialog.type === 'add' ? '添加成功' : '更新成功')
      dialog.visible = false
      getTableData()
    } else {
      // 失败消息可能在res.message或res.data.message中
      ElMessage.error(res.message || (res.data && res.data.message) || '操作失败')
    }
  } catch (error) {
    console.error('表单提交错误:', error)
    ElMessage.error('提交失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 新增按钮处理
const handleAdd = () => {
  dialog.visible = true
  dialog.title = '新增销售'
  dialog.type = 'add'
  resetForm()
  getInventoryList() // 获取最新库存
  form.salesDate = new Date().toISOString().slice(0, 10) // 设置默认日期为今天
}

// 编辑
const handleEdit = async (row) => {
  try {
    dialog.visible = true
    dialog.title = '编辑销售'
    dialog.type = 'edit'
    resetForm() // 重置表单
    
    // 获取库存列表
    await getInventoryList()
    
    console.log('开始获取销售单详情: ID=', row.id)
    // 获取销售单详情
    const res = await getSalesDetailAPI(row.id)
    console.log('销售单详情API响应:', res)
    
    if (res.code === 200 && res.data) {
      const detail = res.data
      console.log('销售单详情数据:', detail)
      
      // 设置基本信息
      form.id = detail.id
      form.customer = detail.customer
      form.salesDate = detail.salesDate
      
      if (!detail.details || !Array.isArray(detail.details)) {
        console.error('销售单明细数据格式错误:', detail.details)
        ElMessage.warning('销售单明细数据异常')
        detail.details = []
      }
      
      // 设置商品明细 - 确保数量和价格是数字
      form.details = detail.details.map(item => {
        const inventoryItem = inventoryList.value.find(inv => inv.id === item.inventoryId)
        const quantityNum = Number(item.quantity || 0)
        const priceNum = Number(item.price || 0)
        const availableStockNum = inventoryItem ? (Number(inventoryItem.availableStock || 0) + quantityNum) : quantityNum
        
        return {
          inventoryId: item.inventoryId || '',
          originalIds: inventoryItem?.originalIds || [item.inventoryId], // 尝试恢复 originalIds
          skuId: item.skuId,
          skuName: item.skuName || inventoryItem?.skuName || '未知商品',
          skuSpec: item.skuSpec || inventoryItem?.skuSpec || '',
          tmName: inventoryItem?.tmName || '',
          quantity: quantityNum,
          unit: item.unit || '千克',
          price: priceNum,
          totalAmount: Number(item.totalAmount || (quantityNum * priceNum)), // 确保 totalAmount 也是数字
          availableStock: availableStockNum,
          purchaseId: inventoryItem?.purchaseId || null,
          purchasePrice: Number(inventoryItem?.purchasePrice || 0) // 确保采购价是数字
        }
      })
      console.log('设置表单明细完成:', form.details)
    } else {
      throw new Error(res.message || '获取详情失败')
    }
  } catch (error) {
    console.error('获取销售单详情失败:', error)
    ElMessage.error('获取销售单详情失败: ' + (error.message || '未知错误'))
    dialog.visible = false
  }
}

// 删除销售记录
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该销售记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    loading.value = true
    const res = await deleteSalesAPI(id)
    console.log('删除销售记录响应:', res)
    
    if (res.code === 200) {
      ElMessage.success(res.message || '删除成功')
      getTableData()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除销售记录错误:', error)
      ElMessage.error('删除失败: ' + (error.message || '未知错误'))
    }
  } finally {
    loading.value = false
  }
}

// 批量删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条记录')
    return
  }
  
  ElMessageBox.confirm(`确定要删除选中的${selectedRows.value.length}条记录吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      loading.value = true
      const ids = selectedRows.value.map(item => item.id)
      let successCount = 0
      let failCount = 0
      
      // 实际应该调用批量删除API
      for (const id of ids) {
        const res = await deleteSalesAPI(id)
        if (res.code === 200) {
          successCount++
        } else {
          failCount++
          console.error(`删除ID=${id}失败:`, res.message)
        }
      }
      
      if (successCount > 0) {
        ElMessage.success(`成功删除${successCount}条记录${failCount > 0 ? `，${failCount}条记录删除失败` : ''}`)
        getTableData()
      } else if (failCount > 0) {
        ElMessage.error(`删除失败，${failCount}条记录删除失败`)
      }
    } catch (error) {
      console.error('批量删除失败：', error)
      ElMessage.error('批量删除失败: ' + (error.message || '未知错误'))
    } finally {
      loading.value = false
    }
  }).catch(() => {
    // 用户取消操作
  })
}

// 出库操作
const handleOutbound = (row) => {
  ElMessageBox.confirm(
    `确定将销售单 "${row.salesNo}" 更新为已出库状态吗？出库后将减少相应库存。`,
    '确认出库',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        loading.value = true
        console.log(`开始更新销售单状态: ID=${row.id}, 状态=1`)
        const res = await updateSalesStatusAPI(row.id, { status: 1 })
        console.log('更新销售单状态响应:', res)
        
        if (res.code === 200) {
          ElMessage.success(res.message || '出库成功')
          getTableData() // 刷新列表
        } else {
          throw new Error(res.message || '出库失败')
        }
      } catch (error) {
        console.error('出库失败:', error)
        ElMessage.error('出库失败: ' + (error.message || '未知错误'))
      } finally {
        loading.value = false
      }
    })
    .catch(() => {
      // 用户取消操作
    })
}

// 初始化
onMounted(() => {
  // 确保状态默认为全部
  queryParams.status = '' 
  getTableData()
})

// 处理取消操作
const handleCancel = () => {
  dialog.visible = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  // 使用formRef重置表单
  formRef.value?.resetFields();
  
  // 手动重置表单数据，防止resetFields不完整
  Object.assign(form, {
    id: null,
    customer: '', 
    salesDate: new Date().toISOString().slice(0, 10),
    details: []
  });
  remoteInventoryOptions.value = []; // 清空上次的搜索结果
}

// 添加明细行
const addDetail = () => {
  form.details.push({
    selectedItem: null, // 新增: 用于 v-model 绑定整个选中对象
    inventoryId: null, 
    originalIds: [],
    skuId: '',
    skuName: '请选择商品', 
    skuSpec: '',
    tmName: '',
    quantity: 1, 
    unit: '千克',
    price: 0,
    totalAmount: 0,
    availableStock: 0,
    purchasePrice: 0,
    _isNew: true 
  });
}

// 远程搜索库存
const remoteInventorySearch = async (query) => {
  if (query) {
    remoteLoading.value = true;
    try {
      const params = { keyword: query, limit: 20, page: 1 }; 
      const res = await getInventoryListAPI(params); 
      
      let responseData = null;
      if (res.code === 200) responseData = res.data || {};
      else if (res.data?.code === 200) responseData = res.data.data || {};
      else throw new Error(res.message || res.data?.message || '搜索库存失败');

      const records = responseData.records || [];
      
      // --- 商品合并逻辑 Start (移除 uniqueValue) ---
      const mergedInventoryMap = new Map();
      records.forEach(item => {
        const totalStock = Number(item.totalStock || item.stock || 0);
        const lockedStock = Number(item.lockedStock || 0);
        const availableStock = totalStock - lockedStock;
        if (availableStock <= 0) return; 

        const key = `${item.skuId || item.product_id}_${item.skuName || item.product_name}`;
        const inventoryItem = { 
            id: item.id, 
            skuId: item.skuId || item.product_id,
            skuName: item.skuName || item.product_name || '',
            skuSpec: item.skuSpec || '',
            tmId: item.tmId || item.tm_id,
            tmName: item.tmName || '',
            purchaseId: item.purchaseId || item.purchase_id,
            purchasePrice: Number(item.purchasePrice || item.purchase_price || 0),
            totalStock: totalStock,
            lockedStock: lockedStock,
            availableStock: availableStock,
            unit: item.unit || '千克',
            originalIds: [item.id], 
            updated_at: item.updated_at,
            mergedId: item.id // 保留 mergedId
        };

        if (mergedInventoryMap.has(key)) {
            const existing = mergedInventoryMap.get(key);
            existing.totalStock += inventoryItem.totalStock;
            existing.lockedStock += inventoryItem.lockedStock;
            existing.availableStock += inventoryItem.availableStock;
            existing.originalIds.push(item.id);
            if (inventoryItem.updated_at && (!existing.updated_at || new Date(inventoryItem.updated_at) > new Date(existing.updated_at))) {
              existing.purchasePrice = inventoryItem.purchasePrice;
            }
        } else {
            mergedInventoryMap.set(key, inventoryItem);
        }
      });
      remoteInventoryOptions.value = Array.from(mergedInventoryMap.values())
                                     .sort((a, b) => a.skuName.localeCompare(b.skuName));
      // --- 商品合并逻辑 End ---

    } catch (error) {
      console.error('远程搜索库存失败:', error);
      remoteInventoryOptions.value = [];
      ElMessage.error('搜索库存失败: ' + (error.message || '未知错误'));
    } finally {
      remoteLoading.value = false;
    }
  } else {
    remoteInventoryOptions.value = []; 
  }
};

// 处理 Select 选中变化
const handleInventorySelectChange = (index) => {
  const row = form.details[index]; 
  const selectedInventory = row.selectedItem; // 直接从 v-model 获取选中的对象

  if (selectedInventory && row) {
    console.log('选择库存商品 (via v-model):', selectedInventory);
    try {
        row.inventoryId = selectedInventory.id; 
        row.originalIds = selectedInventory.originalIds;
        row.skuId = selectedInventory.skuId;
        row.skuName = selectedInventory.skuName;
        row.skuSpec = selectedInventory.skuSpec;
        row.tmName = selectedInventory.tmName;
        row.availableStock = selectedInventory.availableStock;
        row.unit = selectedInventory.unit;
        row.purchasePrice = selectedInventory.purchasePrice;
        
        row.quantity = 1; 
        const purchasePriceNum = Number(row.purchasePrice || 0);
        row.price = purchasePriceNum > 0 
                    ? Number((purchasePriceNum * 1.2).toFixed(2))
                    : 1; 
        
        calculateRowTotal(row); 
    } catch (error) {
        console.error('处理库存选择时出错:', error);
        ElMessage.error('选择商品时出错');
        row.selectedItem = null; 
        // 重置行状态
        row.inventoryId = null;
        row.originalIds = [];
        row.skuId = '';
        row.skuName = '请选择商品';
        row.skuSpec = '';
        row.tmName = '';
        row.availableStock = 0;
        row.unit = '千克';
        row.price = 0;
        row.purchasePrice = 0;
        calculateRowTotal(row);
    }
  } else {
       // 处理清空选择的情况
       row.inventoryId = null;
       row.originalIds = [];
       row.skuId = '';
       row.skuName = '请选择商品';
       row.skuSpec = '';
       row.tmName = '';
       row.availableStock = 0;
       row.unit = '千克';
       row.price = 0;
       row.purchasePrice = 0;
       calculateRowTotal(row); 
  }
};
</script>

<style scoped>
.form-container {
  padding: 20px;
}
.search-form .el-form-item {
  margin-bottom: 10px; /* 调整搜索表单间距 */
}
.action-wrapper {
  margin-bottom: 16px;
}
.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.detail-summary {
  text-align: right;
  padding-right: 16px;
}
.total-amount {
  font-size: 18px;
  color: #f56c6c;
  font-weight: bold;
}
.mt-2 {
  margin-top: 0.5rem;
}
.ml-2 {
  margin-left: 0.5rem;
}
.sku-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 5px 0; 
  line-height: 1.4; 
}
.sku-name {
  font-weight: bold;
}
.sku-detail {
  font-size: 12px;
  color: #666; 
  display: flex;
  gap: 8px; 
}
.stock-count {
  font-weight: bold;
  color: #409EFF;
}
.low-stock {
  color: #E6A23C; 
}
.merged-tag-small {
  font-size: 10px;
  margin-left: 4px;
  color: #909399;
  font-weight: normal;
}
.el-table .el-button { 
    padding: 4px 8px;
}
.el-select-dropdown .el-scrollbar {
  min-width: 650px; /* 保持滚动区域的最小宽度 */
}
/* 移除为每个选项设置的最小宽度，改为设置自动高度和内边距 */
.el-select-dropdown__item {
  height: auto; /* 允许高度自适应内容 */
  padding: 8px 20px; /* 增加垂直内边距，覆盖默认值 */
  line-height: normal; /* 确保行高不会干扰 */
  white-space: normal; /* 允许内容正常换行（虽然内部是flex布局）*/
}
</style> 