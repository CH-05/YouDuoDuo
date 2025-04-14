<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search, Picture } from '@element-plus/icons-vue'
import { reqSkuList, reqSkuDetail, reqSaveSku, reqDeleteSku, reqSpuSaleAttr } from '@/api/product/sku'
import { reqCategoryList } from '@/api/product/attr'
import { reqSpuList } from '@/api/product/spu'
import { reqHasTrademarkAPI } from '@/api/product/trademark'
import { useUserStore } from '@/stores/modules/user'

// 状态定义
const loading = ref(false)
const skuList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const selectedCategory = ref('')
const selectedSpu = ref('')
const categoryOptions = ref([])
const spuOptions = ref([])
const trademarkOptions = ref([]) // 品牌选项列表
const dialogVisible = ref(false)
const dialogTitle = ref('添加SKU')
const formRef = ref(null)
const dialogImageUrl = ref('')
const dialogImageVisible = ref(false)
const userStore = useUserStore()
const manualBrandInput = ref(false)
const baseUrl = ref('http://localhost:3000')

// 添加上传配置
const uploadAction = 'http://localhost:3000/product/sku/image/upload'
const uploadHeaders = {
  Authorization: `Bearer ${userStore.token}`
}

// SKU表单数据
const skuForm = reactive({
  sku_id: '',
  spu_id: '',
  sku_name: '',
  sku_desc: '',
  price: 0,
  weight: 0,
  stock: 0,
  product_id: '',
  images: [], // 只存储一张图片
  attrValues: []
})

// 表单验证规则
const rules = {
  sku_name: [
    { required: true, message: '请输入SKU名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入价格', trigger: 'blur' },
    { pattern: /^\d+(\.\d{1,2})?$/, message: '请输入正确的价格格式', trigger: 'blur' }
  ],
  stock: [
    { required: true, message: '请输入库存', trigger: 'blur' },
    { pattern: /^\d+$/, message: '请输入正确的库存数量', trigger: 'blur' }
  ],
  product_id: [
    { required: true, message: '请选择品牌', trigger: 'change' }
  ]
}

// 获取SKU列表
const getSkuList = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }
    
    if (selectedCategory.value) {
      params.category_id = Number(selectedCategory.value)
    }
    if (selectedSpu.value) {
      params.spu_id = Number(selectedSpu.value)
    }
    
    console.log('获取SKU列表，请求参数:', {
      url: '/product/sku/list',
      method: 'get',
      params
    })

    const res = await reqSkuList(currentPage.value, pageSize.value, params)
    console.log('SKU列表响应:', res)
    
    if (res.code === 200) {
      // 处理图片数据，只取第一张图片
      const processedRecords = res.data.records.map(sku => {
        const images = Array.isArray(sku.images) ? sku.images : []
        const firstImage = images[0] || null
        return {
          ...sku,
          image: firstImage ? (typeof firstImage === 'string' ? firstImage : firstImage.img_url) : ''
        }
      })
      
      console.log('处理后的SKU数据:', processedRecords[0])
      skuList.value = processedRecords
      total.value = res.data.total || 0
    } else {
      console.error('获取SKU列表失败:', res)
      ElMessage.error(res.message || '获取SKU列表失败')
      skuList.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取SKU列表失败:', error)
    ElMessage.error(error.message || '获取SKU列表失败')
    skuList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 获取分类列表
const getCategoryList = async () => {
  try {
    const res = await reqCategoryList()
    console.log('获取到的分类列表数据:', res)
    if (res.code === 200) {
      categoryOptions.value = res.data || []
    } else {
      console.error('获取分类列表失败:', res)
      ElMessage.error(res.message || '获取分类列表失败')
      categoryOptions.value = []
    }
  } catch (error) {
    console.error('获取分类列表失败:', error)
    ElMessage.error('获取分类列表失败')
    categoryOptions.value = []
  }
}

// 获取SPU列表
const getSpuList = async () => {
  if (!selectedCategory.value) {
    spuOptions.value = []
    return
  }
  try {
    const res = await reqSpuList(1, 100, selectedCategory.value)
    spuOptions.value = res.data.records
  } catch (error) {
    console.error('获取SPU列表失败:', error)
  }
}

// 处理品牌列表数据，确保有默认选项
const ensureBrandOptions = () => {
  // 如果API加载失败，提供一些备选品牌
  if (trademarkOptions.value.length === 0) {
    console.warn('API加载的品牌为空，使用备选品牌数据')
    // 这里硬编码一些常见品牌，应该从API获取真实数据
    trademarkOptions.value = [
      { product_id: 1, tmName: '默认品牌1' },
      { product_id: 2, tmName: '默认品牌2' },
      { product_id: 3, tmName: '默认品牌3' }
    ]
  }
}

// 获取品牌列表
const getTrademarkList = async () => {
  try {
    // 使用分页接口获取品牌列表，设置较大的limit确保获取所有品牌
    const res = await reqHasTrademarkAPI(1, 100)
    console.log('获取到的品牌列表数据:', res)
    if (res.code === 200) {
      trademarkOptions.value = res.data.records || []
      console.log('处理后的品牌选项:', trademarkOptions.value)
    } else {
      console.error('获取品牌列表失败:', res)
      ElMessage.error(res.message || '获取品牌列表失败')
      trademarkOptions.value = []
    }
  } catch (error) {
    console.error('获取品牌列表失败:', error)
    ElMessage.error('获取品牌列表失败')
    trademarkOptions.value = []
  }
}

// 处理分类变化
const handleCategoryChange = async (value) => {
  console.log('分类变化:', {
    value,
    type: typeof value,
    selectedCategory: selectedCategory.value,
    categoryInfo: value ? categoryOptions.value.find(item => item.id === value) : null
  })
  
  if (!value) {
    selectedCategory.value = ''
    selectedSpu.value = ''
    spuOptions.value = []
    skuList.value = []
    total.value = 0
    return
  }

  try {
    selectedSpu.value = ''
    // 只获取SPU列表
    await getSpuList()
    // 清空SKU列表
    skuList.value = []
    total.value = 0
  } catch (error) {
    console.error('分类切换处理失败:', error)
  }
}

// 处理SPU变化
const handleSpuChange = async () => {
  if (selectedSpu.value) {
    await getSkuList()
    await getSpuSaleAttr()
  } else {
    skuList.value = []
    total.value = 0
  }
}

// 获取SPU销售属性
const getSpuSaleAttr = async () => {
  if (!selectedSpu.value) return
  
  try {
    const res = await reqSpuSaleAttr(selectedSpu.value)
    skuForm.attrValues = res.data.map(attr => ({
      spu_sale_attr_id: attr.attr_id,
      attr_name: attr.attr_name,
      spu_sale_attr_value_id: '',
      attr_values: attr.attr_values
    }))
  } catch (error) {
    console.error('获取SPU销售属性失败:', error)
  }
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  getSkuList()
}

// 处理每页条数变化
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  getSkuList()
}

// 处理品牌变化
const handleBrandChange = async (brandId) => {
  console.log('选择的品牌ID:', brandId)
  if (!brandId) return
  
  try {
    const selectedBrand = trademarkOptions.value.find(item => item.product_id === brandId)
    if (selectedBrand) {
      console.log('选择的品牌:', selectedBrand.tmName)
      // 这里可以增加额外的品牌相关信息获取
    }
  } catch (error) {
    console.error('处理品牌变化失败:', error)
  }
}

// 添加SKU
const addSku = () => {
  // 首先判断是否有品牌数据
  if (trademarkOptions.value.length === 0) {
    // 如果没有品牌数据，重新获取一次
    ElMessage.warning('品牌数据为空，正在重新获取...')
    getTrademarkList().then(() => {
      if (trademarkOptions.value.length === 0) {
        ElMessage.error('无法获取品牌数据，请稍后再试')
      } else {
        // 有品牌数据后继续
        showAddSkuDialog()
      }
    })
  } else {
    // 有品牌数据，直接显示对话框
    showAddSkuDialog()
  }
}

// 显示添加SKU对话框的内部方法
const showAddSkuDialog = () => {
  // 确保有品牌选项
  ensureBrandOptions();
  
  dialogVisible.value = true
  dialogTitle.value = '添加SKU'
  
  const defaultProductId = trademarkOptions.value.length > 0 
                        ? trademarkOptions.value[0].product_id
                        : '';
                        
  Object.assign(skuForm, {
    sku_id: '',
    spu_id: selectedSpu.value,
    sku_name: '',
    sku_desc: '',
    price: 0,
    weight: 0,
    stock: 0,
    product_id: defaultProductId,
    images: [],
    attrValues: []
  })
  
  console.log('初始化SKU表单:', {
    ...skuForm,
    availableBrands: trademarkOptions.value.length,
    defaultBrand: defaultProductId ? trademarkOptions.value.find(item => item.product_id === defaultProductId)?.tmName : '无'
  })
  
  getSpuSaleAttr()
}

// 处理图片URL的函数
const getFullImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${baseUrl.value}${url.startsWith('/') ? '' : '/'}${url}`
}

// 编辑SKU
const editSku = async (row) => {
  dialogVisible.value = true
  dialogTitle.value = '编辑SKU'
  
  try {
    const res = await reqSkuDetail(row.sku_id)
    // 处理图片数据
    const skuData = res.data
    if (skuData.images && skuData.images.length > 0) {
      // 确保图片数据格式正确
      skuData.images = skuData.images.map(img => {
        if (typeof img === 'string') {
          return {
            img_name: '已上传图片',
            img_url: img,
            is_default: 1
          }
        }
        return img
      })
    } else {
      skuData.images = []
    }
    Object.assign(skuForm, skuData)
    console.log('编辑SKU数据:', skuForm)
  } catch (error) {
    console.error('获取SKU详情失败:', error)
  }
}

// 删除SKU
const deleteSku = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除SKU ${row.sku_name} 吗？`, '提示', {
      type: 'warning'
    })
    await reqDeleteSku(row.sku_id)
    ElMessage.success('删除成功')
    if (skuList.value.length === 1 && currentPage.value > 1) {
      currentPage.value--
    }
    getSkuList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

// 修改图片预览处理方法
const handlePictureCardPreview = (file) => {
  dialogImageUrl.value = getFullImageUrl(file.url || file.img_url)
  dialogImageVisible.value = true
}

const handleRemove = (file) => {
  const index = skuForm.images.findIndex(img => 
    (img.img_url === file.url) || (img.img_url === file.img_url)
  )
  if (index !== -1) {
    skuForm.images.splice(index, 1)
  }
}

const beforeSkuUpload = (file) => {
  const isImage = /^image\/(jpeg|png|gif|jpg)/.test(file.type)
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传 JPG/PNG/GIF 格式的图片!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  
  // 如果已经有图片，提示用户
  if (skuForm.images.length > 0) {
    ElMessage.warning('只能上传一张图片，请先删除现有图片')
    return false
  }
  
  // 使用URL.createObjectURL预览图片
  const localUrl = URL.createObjectURL(file)
  file.url = localUrl
  
  return true
}

const handleSkuUploadSuccess = (response, uploadFile) => {
  console.log('图片上传响应:', response)
  if (response.code === 200) {
    // 只保存一张图片
    skuForm.images = [{
      img_name: uploadFile.name,
      img_url: response.data,
      is_default: 1
    }]
    ElMessage.success('上传成功')
  } else {
    console.error('上传失败:', response)
    ElMessage.error(response.message || '上传失败')
  }
}

const handleSkuUploadError = (error, file) => {
  console.error('图片上传错误:', error)
  if (error && error.message) {
    ElMessage.error(`图片上传失败: ${error.message}`)
  } else {
    ElMessage.error('图片上传失败，请重试')
  }
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.error('请完善表单信息')
      return
    }
    
    // 确保必要参数存在
    if (!skuForm.spu_id) {
      skuForm.spu_id = selectedSpu.value
    }
    
    if (!skuForm.product_id) {
      ElMessage.error('请选择品牌')
      return
    }
    
    // 检查销售属性值是否都已选择
    if (skuForm.attrValues && skuForm.attrValues.length > 0) {
      const emptyAttrs = skuForm.attrValues.filter(attr => !attr.spu_sale_attr_value_id)
      if (emptyAttrs.length > 0) {
        ElMessage.error(`请选择 ${emptyAttrs.map(attr => attr.attr_name).join(', ')} 的属性值`)
        return
      }
    }
    
    console.log('提交的SKU表单数据:', JSON.stringify(skuForm))
    
    try {
      const res = await reqSaveSku(skuForm)
      ElMessage.success(skuForm.sku_id ? '更新成功' : '添加成功')
      dialogVisible.value = false
      getSkuList()
    } catch (error) {
      console.error('保存失败:', error)
    }
  })
}

// 对话框关闭处理
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

onMounted(async () => {
  try {
    // 并行获取分类和品牌列表，提高加载效率
    await Promise.all([
      getCategoryList(),
      getTrademarkList()
    ])
    
    console.log('组件挂载完成，数据初始化状态:', {
      categoriesLoaded: categoryOptions.value.length > 0,
      brandsLoaded: trademarkOptions.value.length > 0,
    })
    
    // 如果品牌列表为空，重试一次
    if (trademarkOptions.value.length === 0) {
      console.warn('品牌列表为空，尝试重新获取')
      await getTrademarkList()
      
      // 最后确保有备选品牌
      ensureBrandOptions()
    }
  } catch (error) {
    console.error('组件初始化失败:', error)
    // 发生错误时，确保有备选品牌
    ensureBrandOptions()
  }
})
</script>

<template>
  <div class="sku-container">
    <el-card class="box-card">
      <!-- 分类和SPU选择 -->
      <el-form :inline="true" class="filter-form">
        <el-form-item label="选择分类：">
          <el-select
            v-model="selectedCategory"
            placeholder="请选择分类"
            clearable
            @change="handleCategoryChange"
            style="width: 200px"
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择SPU：">
          <el-select
            v-model="selectedSpu"
            placeholder="请选择SPU"
            clearable
            @change="handleSpuChange"
            style="width: 200px"
          >
            <el-option
              v-for="item in spuOptions"
              :key="item.spu_id"
              :label="item.spu_name"
              :value="item.spu_id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <div class="operation-area" v-if="selectedSpu">
        <el-button type="primary" :icon="Plus" @click="addSku">
          添加SKU
        </el-button>
      </div>

      <!-- SKU列表 -->
      <el-table
        v-loading="loading"
        :data="skuList"
        border
        style="margin-top: 20px"
      >
        <el-table-column type="index" label="序号" width="80" align="center" />
        <el-table-column prop="sku_name" label="SKU名称" min-width="150" />
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">
            ¥{{ row.price }}
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="重量" width="100">
          <template #default="{ row }">
            {{ row.weight }}kg
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100" />
        <el-table-column label="图片" width="100">
          <template #default="{ row }">
            <el-image
              v-if="row.image"
              :src="getFullImageUrl(row.image)"
              fit="cover"
              class="sku-image"
            >
              <template #error>
                <div class="image-slot">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column prop="trademark_name" label="品牌" width="120" />
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              :icon="Edit"
              circle
              @click="editSku(row)"
              title="修改SKU"
            />
            <el-popconfirm
              :title="`确定删除 ${row.sku_name} 吗？`"
              width="250px"
              @confirm="deleteSku(row)"
            >
              <template #reference>
                <el-button type="danger" :icon="Delete" circle />
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页器 -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[5, 10, 15, 20]"
        :total="total"
        class="pagination"
        background
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <!-- SKU表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="skuForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="SKU名称" prop="sku_name">
          <el-input
            v-model="skuForm.sku_name"
            placeholder="请输入SKU名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number
            v-model="skuForm.price"
            :precision="2"
            :step="0.1"
            :min="0"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="重量" prop="weight">
          <el-input-number
            v-model="skuForm.weight"
            :precision="2"
            :step="0.1"
            :min="0"
            style="width: 200px"
          />
          <span class="unit">kg</span>
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number
            v-model="skuForm.stock"
            :min="0"
            :precision="0"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="品牌" prop="product_id">
          <div class="brand-input-group">
            <el-select
              v-model="skuForm.product_id"
              placeholder="请选择品牌"
              style="width: 200px"
              :disabled="manualBrandInput"
              @change="handleBrandChange"
            >
              <el-option
                v-for="item in trademarkOptions"
                :key="item.product_id"
                :label="item.tmName"
                :value="item.product_id"
              />
              
              <template #empty>
                <div class="empty-wrapper">
                  <p>暂无品牌数据</p>
                  <el-button type="primary" size="small" @click="getTrademarkList">重新加载</el-button>
                </div>
              </template>
            </el-select>
            
            <el-checkbox v-model="manualBrandInput" style="margin-left: 10px">
              手动输入品牌ID
            </el-checkbox>
            
            <el-input
              v-if="manualBrandInput"
              v-model="skuForm.product_id"
              placeholder="请输入品牌ID"
              style="width: 150px; margin-left: 10px"
            />
          </div>
        </el-form-item>
        <el-form-item label="描述" prop="sku_desc">
          <el-input
            v-model="skuForm.sku_desc"
            type="textarea"
            :rows="3"
            placeholder="请输入SKU描述"
          />
        </el-form-item>
        <el-form-item label="图片">
          <el-upload
            :action="uploadAction"
            :headers="uploadHeaders"
            list-type="picture-card"
            :on-preview="handlePictureCardPreview"
            :on-remove="handleRemove"
            :on-success="handleSkuUploadSuccess"
            :on-error="handleSkuUploadError"
            :before-upload="beforeSkuUpload"
            :show-file-list="true"
            name="file"
            accept="image/jpeg,image/png,image/gif,image/jpg"
            :limit="1"
            :file-list="skuForm.images.map(img => ({
              name: img.img_name,
              url: getFullImageUrl(img.img_url)
            }))"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <el-dialog v-model="dialogImageVisible">
            <img w-full :src="dialogImageUrl" alt="Preview Image" style="max-width: 100%" />
          </el-dialog>
        </el-form-item>
        <el-form-item
          v-for="(attr, index) in skuForm.attrValues"
          :key="index"
          :label="attr.attr_name"
        >
          <el-select
            v-model="attr.spu_sale_attr_value_id"
            placeholder="请选择属性值"
          >
            <el-option
              v-for="value in attr.attr_values"
              :key="value.value_id"
              :label="value.value_name"
              :value="value.value_id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.sku-container {
  padding: 20px;

  .filter-form {
    margin-bottom: 20px;
  }

  .operation-area {
    margin-bottom: 20px;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .sku-image {
    width: 50px;
    height: 50px;
    border-radius: 4px;
    object-fit: cover;
  }

  .image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: #f5f7fa;
    color: #909399;
    font-size: 20px;
  }

  .unit {
    margin-left: 10px;
    color: #666;
  }
  
  .brand-input-group {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .empty-wrapper {
    text-align: center;
    padding: 10px;
    
    p {
      margin-bottom: 10px;
      color: #999;
    }
  }

  :deep(.el-upload--picture-card) {
    width: 100px;
    height: 100px;
    line-height: 100px;
  }

  :deep(.el-upload-list--picture-card .el-upload-list__item) {
    width: 100px;
    height: 100px;
  }
}
</style>