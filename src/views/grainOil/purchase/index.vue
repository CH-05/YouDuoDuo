<template>
  <div class="purchase-container">
    <!-- 搜索区域 -->
    <div class="search-form">
      <el-form :model="queryParams" inline>
        <el-form-item label="进货单号">
          <el-input 
            v-model="queryParams.keyword" 
            placeholder="进货单号/商品名称" 
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
            <el-option  label="全部" value="" />
            <el-option label="待入库" :value="0" />
            <el-option label="已入库" :value="1" />
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
      <el-button type="primary" @click="handleAdd">新增进货</el-button>
      <el-button type="danger" @click="handleBatchDelete" :disabled="!selectedRows.length">批量删除</el-button>
    </div>

    <!-- 表格区域 -->
    <el-table
        v-loading="loading"
        :data="tableData"
        @selection-change="handleSelectionChange"
        border
        style="width: 100%"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="purchaseNo" label="进货单号" min-width="160" />
      <el-table-column prop="productName" label="商品名称" min-width="200" show-overflow-tooltip />
      <el-table-column prop="totalAmount" label="总金额" width="120">
        <template #default="scope">
          ¥{{ scope.row.totalAmount ? Number(scope.row.totalAmount).toFixed(2) : '0.00' }}
        </template>
      </el-table-column>
      <el-table-column prop="supplier" label="供应商" min-width="150" show-overflow-tooltip />
      <el-table-column prop="purchaseDate" label="进货日期" width="120">
        <template #default="scope">
          {{ formatDate(scope.row.purchaseDate) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.status === 0 ? 'warning' : 'success'">
            {{ scope.row.status === 0 ? '待入库' : '已入库' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="scope">
          <el-button
            v-if="scope.row.status === 0"
            type="success"
            size="small"
            @click="handleStorage(scope.row)"
          >
            入库
          </el-button>
          <el-button
            v-if="scope.row.status === 0"
            type="primary"
            size="small"
            @click="handleEdit(scope.row)"
          >
            编辑
          </el-button>
          <el-button
            v-if="scope.row.status === 0"
            type="danger"
            size="small"
            @click="handleDelete(scope.row)"
          >
            删除
          </el-button>
          <el-tag v-if="scope.row.status === 1" type="success">已入库</el-tag>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="tableParams.page"
        v-model:page-size="tableParams.limit"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
        v-model="dialogVisible"
        :title="dialogType === 'add' ? '新增进货' : '编辑进货'"
        width="800px"
    >
      <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
      >
        <el-form-item label="品牌" prop="trademark">
          <el-select 
            v-model="form.trademark" 
            placeholder="请选择品牌"
            @change="handleTrademarkChange"
            filterable
          >
            <el-option
              v-for="item in trademarkList"
              :key="item.id"
              :label="item.tmName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商" prop="supplier">
          <el-input 
            v-model="form.supplier" 
            placeholder="请输入供应商名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="进货日期" prop="purchaseDate">
          <el-date-picker
              v-model="form.purchaseDate"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <!-- 明细表格 -->
        <el-form-item label="商品明细">
          <el-table :data="form.details" border>
            <el-table-column label="商品选择" width="300">
              <template #default="scope">
                <el-select 
                  v-model="scope.row.skuId"
                  filterable
                  placeholder="请选择商品"
                  :loading="skuLoading"
                  style="width: 100%"
                  popper-class="sku-select-dropdown"
                  @change="(val) => handleSkuSelect(scope.row, skuList.find(item => item.id === val))"
                >
                  <el-option
                    v-for="item in skuList"
                    :key="item.id"
                    :label="item.skuName"
                    :value="item.id"
                  >
                    <div class="sku-option">
                      <span class="sku-name">{{ item.skuName }}</span>
                      <div class="sku-info">
                        <span class="sku-price">¥{{ Number(item.price || 0).toFixed(2) }}</span>
                        <span class="sku-stock">库存: {{ item.stock || 0 }}</span>
                      </div>
                    </div>
                  </el-option>
                  <template #empty>
                    <el-empty :description="skuLoading ? '加载中...' : '暂无商品'" />
                  </template>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="规格" width="120">
              <template #default="scope">
                <el-tag size="small" type="info">{{ scope.row.skuName?.split(' ')[1] || '-' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="数量" width="150">
              <template #default="scope">
                <el-input-number 
                  v-model="scope.row.quantity" 
                  :min="1" 
                  :max="skuList.find(item => item.id === scope.row.skuId)?.stock || 999999"
                  @change="calculateRowTotal(scope.row)" 
                />
              </template>
            </el-table-column>
            <el-table-column label="单位" width="80">
              <template #default="scope">
                <span>{{ scope.row.unit || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="单价" width="120">
              <template #default="scope">
                <span>¥{{ scope.row.price?.toFixed(2) || '0.00' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="金额" width="120">
              <template #default="scope">
                <span style="color: #f56c6c">¥{{ scope.row.totalAmount?.toFixed(2) || '0.00' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="scope">
                <el-button type="danger" link @click="removeDetail(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="mt-2">
            <el-button type="primary" @click="addDetail">添加商品</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPurchaseListAPI, addPurchaseAPI, updatePurchaseAPI, deletePurchaseAPI, getPurchaseDetailAPI, updatePurchaseStatusAPI } from '@/api/grainOil/purchase'
import { reqAllTrademark } from '@/api/product/trademark'
import { getSkuListByTrademark } from '@/api/product/sku'

// 日期格式化函数
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  
  try {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    
    return `${year}年${month}月${day}日`
  } catch (error) {
    console.error('日期格式化错误:', error)
    return dateStr
  }
}

// 搜索表单数据
const queryParams = ref({
  keyword: '',
  status: '',  // 状态查询参数
  startDate: '',
  endDate: ''
})

// 表格数据
const loading = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 品牌列表
const trademarkList = ref([])
// SKU商品列表
const skuList = ref([])
// SKU加载状态
const skuLoading = ref(false)

// 分页参数
const tableParams = ref({
  page: 1,
  limit: 10
})

// 获取表格数据
const getTableData = async () => {
  loading.value = true
  try {
    // 构建查询参数
    const params = {
      page: tableParams.value.page,
      limit: tableParams.value.limit,
      keyword: queryParams.value.keyword,
      status: queryParams.value.status
    }
    
    // 添加日期参数
    if (queryParams.value.startDate) {
      params.startDate = queryParams.value.startDate
    }
    if (queryParams.value.endDate) {
      params.endDate = queryParams.value.endDate
    }
    
    const res = await getPurchaseListAPI(params)
    if (res.code === 200) {
      tableData.value = res.data.records
      total.value = res.data.total
    } else {
      ElMessage.error(res.message || '获取数据失败')
    }
  } catch (error) {
    console.error('获取表格数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 分页变化
const handleSizeChange = (val) => {
  tableParams.value.limit = val
  getTableData()
}

const handleCurrentChange = (val) => {
  tableParams.value.page = val
  getTableData()
}

// 查询处理
const handleSearch = () => {
  tableParams.value.page = 1
  getTableData()
}

// 重置查询
const handleReset = () => {
  queryParams.value = {
    keyword: '',
    status: '',  // 空字符串对应"全部"选项
    startDate: '',
    endDate: ''
  }
  handleSearch()
}

// 表格选择
const handleSelectionChange = (val) => {
  selectedRows.value = val
}

// 获取品牌列表
const getTrademarkList = async () => {
  try {
    const res = await reqAllTrademark()
    if (res.code === 200) {
      trademarkList.value = res.data
    }
  } catch (error) {
    console.error('获取品牌列表失败：', error)
  }
}

// 表单相关
const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)
const form = reactive({
  trademark: '',
  supplier: '',
  purchaseDate: '',
  details: [],
  totalAmount: 0
})

// 表单校验规则
const rules = {
  trademark: [{ required: true, message: '请选择品牌', trigger: 'change' }],
  supplier: [{ required: true, message: '请选择供应商', trigger: 'change' }],
  purchaseDate: [{ required: true, message: '请选择进货日期', trigger: 'change' }]
}

// 供应商选项
const supplierOptions = ref([])

// 品牌变更处理
const handleTrademarkChange = async (tmId) => {
  if (tmId) {
    skuLoading.value = true
    skuList.value = []
    try {
      const res = await getSkuListByTrademark(tmId)
      if (res.code === 200) {
        skuList.value = res.data || []
        if (skuList.value.length === 0) {
          ElMessage.warning('该品牌下暂无商品')
        }
      } else {
        throw new Error(res.message || '获取商品列表失败')
      }
    } catch (error) {
      console.error('获取SKU列表失败:', error)
      ElMessage.error(error.message || '获取商品列表失败')
      skuList.value = []
    } finally {
      skuLoading.value = false
    }
  } else {
    skuList.value = []
    form.supplier = ''
  }
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
  form.trademark = ''
  form.supplier = ''
  form.purchaseDate = ''
  form.details = []
  form.totalAmount = 0
  skuList.value = []
  supplierOptions.value = []
}

// 选择商品时的处理函数
const handleSkuSelect = (row, selectedSku) => {
  if (selectedSku) {
    console.log('选中商品:', selectedSku)
    row.skuId = selectedSku.id
    row.skuName = selectedSku.skuName
    row.unit = selectedSku.unit || '千克'  // 默认单位
    row.price = Number(selectedSku.price || 0)
    
    // 如果数量为空，设置默认值
    if (!row.quantity) {
      row.quantity = 1  // 默认数量为1
    }
    
    // 如果商品名称不包含品牌名称，可以添加品牌名称前缀
    const selectedTrademark = trademarkList.value.find(item => item.id === form.trademark);
    if (selectedTrademark && !row.skuName.includes(selectedTrademark.tmName)) {
      console.log('添加品牌前缀到商品名称:', selectedTrademark.tmName, row.skuName);
      // 仅保存原始名称，不更改显示
      row.originalSkuName = row.skuName;
    }
    
    calculateRowTotal(row)
  } else {
    console.warn('选择SKU时未找到商品信息')
  }
}

// 添加明细行
const addDetail = () => {
  if (!form.trademark) {
    ElMessage.warning('请先选择品牌')
    return
  }
  form.details.push({
    skuId: '',
    skuName: '',
    quantity: 1,
    unit: '',
    price: 0,
    totalAmount: 0
  })
}

// 计算行总金额
const calculateRowTotal = (row) => {
  if (row.quantity && row.price) {
    row.totalAmount = Number((row.quantity * row.price).toFixed(2))
  } else {
    row.totalAmount = 0
  }
  // 更新表单总金额
  form.totalAmount = Number(form.details.reduce((sum, detail) => sum + (detail.totalAmount || 0), 0).toFixed(2))
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
  
  try {
    await formRef.value.validate()
    
    // 确保日期格式正确 
    const formData = {
      ...form,
      purchaseDate: typeof form.purchaseDate === 'string' ? form.purchaseDate.substring(0, 10) : form.purchaseDate
    }
    
    if (dialogType.value === 'add') {
      await addPurchaseAPI(formData)
    } else {
      await updatePurchaseAPI(formData.id, formData)
    }
    
    ElMessage.success(dialogType.value === 'add' ? '添加成功' : '更新成功')
    dialogVisible.value = false
    getTableData()
  } catch (error) {
    console.error('提交失败：', error)
    ElMessage.error('提交失败：' + (error.message || '未知错误'))
  }
}

// 新增
const handleAdd = () => {
  dialogType.value = 'add'
  resetForm()
  dialogVisible.value = true
}

// 编辑
const handleEdit = async (row) => {
  try {
    dialogType.value = 'edit'
    resetForm() // 重置表单
    
    // 获取进货单详情
    const res = await getPurchaseDetailAPI(row.id)
    if (res.code === 200) {
      const detail = res.data
      
      // 设置基本信息
      form.id = detail.id
      form.supplier = detail.supplier
      form.purchaseDate = detail.purchaseDate
      
      // 设置品牌并加载SKU列表
      form.trademark = detail.trademark
      if (form.trademark) {
        await handleTrademarkChange(form.trademark)
      }
      
      // 等待SKU列表加载完成
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 设置商品明细
      form.details = detail.details.map(item => {
        // 查找对应的SKU信息
        const skuInfo = skuList.value.find(sku => sku.id === item.skuId)
        // 如果找不到SKU信息，尝试从全部trademarkList中查找
        let skuName = ''
        if (skuInfo) {
          skuName = skuInfo.skuName
        } else {
          // 记录找不到SKU信息的情况
          console.warn(`未找到SKU信息, skuId: ${item.skuId}`)
        }
        
        return {
          skuId: item.skuId,
          skuName: skuName,
          quantity: Number(item.quantity),
          unit: item.unit,
          price: Number(item.price),
          totalAmount: Number(item.totalAmount)
        }
      })
      
      dialogVisible.value = true
    } else {
      throw new Error(res.message || '获取详情失败')
    }
  } catch (error) {
    console.error('获取进货单详情失败：', error)
    ElMessage.error(error.message || '获取进货单详情失败')
  }
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该进货记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deletePurchaseAPI(row.id)
      ElMessage.success('删除成功')
      getTableData()
    } catch (error) {
      console.error('删除失败：', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
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
      const ids = selectedRows.value.map(item => item.id)
      // 实际应该调用批量删除API
      for (const id of ids) {
        await deletePurchaseAPI(id)
      }
      ElMessage.success('批量删除成功')
      getTableData()
    } catch (error) {
      console.error('批量删除失败：', error)
      ElMessage.error('批量删除失败')
    }
  }).catch(() => {})
}

// 入库操作
const handleStorage = (row) => {
  ElMessageBox.confirm(
    `确定将进货单 "${row.purchaseNo}" 更新为已入库状态吗？`,
    '确认入库',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        await updatePurchaseStatusAPI(row.id, { status: 1 })
        ElMessage.success('入库成功')
        getTableData() // 刷新列表
      } catch (error) {
        console.error('入库失败:', error)
        ElMessage.error('入库失败: ' + (error.message || '未知错误'))
      }
    })
    .catch(() => {
      // 用户取消操作
    })
}

// 初始化
onMounted(() => {
  // 确保状态默认为全部
  queryParams.value.status = '' 
  getTableData()
  getTrademarkList()
})
</script>

<style lang="scss" scoped>
.purchase-container {
  padding: 20px;

  .search-form {
    margin-bottom: 20px;
  }

  .action-wrapper {
    margin-bottom: 20px;
  }

  .pagination-container {
    margin-top: 20px;
    text-align: right;
  }
}

:deep(.sku-select-dropdown) {
  .el-select-dropdown__item {
    padding: 8px 12px;
  }
}

.sku-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  
  .sku-name {
    flex: 1;
    font-size: 14px;
    color: #606266;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .sku-info {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .sku-price {
      font-size: 14px;
      font-weight: 500;
      color: #f56c6c;
    }
    
    .sku-stock {
      font-size: 12px;
      color: #909399;
    }
  }
}

.el-select-dropdown__item.selected {
  .sku-name {
    color: var(--el-color-primary);
  }
}
</style> 
