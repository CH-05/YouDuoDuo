<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search } from '@element-plus/icons-vue'
import { reqSkuList, reqSkuDetail, reqSaveSku, reqDeleteSku, reqSpuSaleAttr } from '@/api/product/sku'
import { reqCategoryList } from '@/api/product/attr'
import { reqSpuList } from '@/api/product/spu'
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
const dialogVisible = ref(false)
const dialogTitle = ref('添加SKU')
const formRef = ref(null)
const dialogImageUrl = ref('')
const dialogImageVisible = ref(false)
const userStore = useUserStore()

// SKU表单数据
const skuForm = reactive({
  sku_id: '',
  spu_id: '',
  sku_name: '',
  sku_desc: '',
  price: '',
  weight: '',
  stock: '',
  category_id: '',
  product_id: '',
  images: [],
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
  ]
}

// 获取SKU列表
const getSkuList = async () => {
  try {
    loading.value = true
    const params = {}
    if (selectedCategory.value) params.category_id = selectedCategory.value
    if (selectedSpu.value) params.spu_id = selectedSpu.value
    
    const res = await reqSkuList(currentPage.value, pageSize.value, params)
    skuList.value = res.data.records
    total.value = res.data.total
  } catch (error) {
    console.error('获取SKU列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取分类列表
const getCategoryList = async () => {
  try {
    const res = await reqCategoryList()
    categoryOptions.value = res.data
  } catch (error) {
    console.error('获取分类列表失败:', error)
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

// 处理分类变化
const handleCategoryChange = () => {
  selectedSpu.value = ''
  getSpuList()
  getSkuList()
}

// 处理SPU变化
const handleSpuChange = () => {
  if (selectedSpu.value) {
    getSkuList()
    getSpuSaleAttr()
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

// 添加SKU
const addSku = () => {
  dialogVisible.value = true
  dialogTitle.value = '添加SKU'
  Object.assign(skuForm, {
    sku_id: '',
    spu_id: selectedSpu.value,
    sku_name: '',
    sku_desc: '',
    price: '',
    weight: '',
    stock: '',
    category_id: selectedCategory.value,
    product_id: '',
    images: [],
    attrValues: []
  })
  getSpuSaleAttr()
}

// 编辑SKU
const editSku = async (row) => {
  dialogVisible.value = true
  dialogTitle.value = '编辑SKU'
  
  try {
    const res = await reqSkuDetail(row.sku_id)
    Object.assign(skuForm, res.data)
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

// 图片上传相关方法
const handlePictureCardPreview = (file) => {
  dialogImageUrl.value = file.url
  dialogImageVisible.value = true
}

const handleRemove = (file) => {
  const index = skuForm.images.findIndex(img => img.img_url === file.url)
  if (index !== -1) {
    skuForm.images.splice(index, 1)
  }
}

const handleUploadSuccess = (response, uploadFile) => {
  if (response.code === 200) {
    skuForm.images.push({
      img_name: uploadFile.name,
      img_url: response.data,
      is_default: skuForm.images.length === 0 ? 1 : 0
    })
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(response.message || '上传失败')
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
    
    try {
      await reqSaveSku(skuForm)
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

onMounted(() => {
  getCategoryList()
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
              v-if="row.images && row.images.length"
              :src="row.images[0]"
              :preview-src-list="row.images"
              fit="cover"
              class="sku-image"
            />
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
            action="/api/product/sku/image/upload"
            :headers="{
              Authorization: `Bearer ${userStore.token}`
            }"
            list-type="picture-card"
            :on-preview="handlePictureCardPreview"
            :on-remove="handleRemove"
            :on-success="handleUploadSuccess"
            multiple
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <el-dialog v-model="dialogImageVisible">
            <img w-full :src="dialogImageUrl" alt="Preview Image" />
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
  }

  .unit {
    margin-left: 10px;
    color: #666;
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