<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Upload } from '@element-plus/icons-vue'
import { 
  reqSpuList, 
  reqSpuDetail, 
  reqSaveSpu, 
  reqDeleteSpu,
  reqTrademarkList,
  reqSaleAttrList,
  reqSaveSaleAttr
} from '@/api/product/spu'
import { reqCategoryList } from '@/api/product/attr'
import { useUserStore } from '@/stores/modules/user'

// 状态定义
const loading = ref(false)
const spuList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const selectedCategory = ref('')
const categoryOptions = ref([])
const trademarkOptions = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('添加SPU')
const formRef = ref(null)
const dialogImageUrl = ref('')
const dialogImageVisible = ref(false)
const userStore = useUserStore()

// SPU表单数据
const spuForm = reactive({
  spu_id: '',
  spu_name: '',
  description: '',
  category_id: '',
  product_id: '',
  images: [],
  saleAttrs: []
})

// 表单验证规则
const rules = {
  spu_name: [
    { required: true, message: '请输入SPU名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  product_id: [
    { required: true, message: '请选择品牌', trigger: 'change' }
  ]
}

// 上传相关配置
const uploadAction = 'http://localhost:3000/product/spu/image/upload'
const uploadHeaders = {
  Authorization: `Bearer ${userStore.token}`
}

// 获取SPU列表
const getSpuList = async () => {
  if (!selectedCategory.value) return
  
  try {
    loading.value = true
    const res = await reqSpuList(currentPage.value, pageSize.value, selectedCategory.value)
    if (res.code === 200) {
      spuList.value = res.data.records
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取SPU列表失败:', error)
    ElMessage.error('获取SPU列表失败')
  } finally {
    loading.value = false
  }
}

// 获取分类列表
const getCategoryList = async () => {
  try {
    const res = await reqCategoryList()
    if (res.code === 200) {
      categoryOptions.value = res.data
    }
  } catch (error) {
    console.error('获取分类列表失败:', error)
    ElMessage.error('获取分类列表失败')
  }
}

// 获取品牌列表
const getTrademarkList = async () => {
  try {
    const res = await reqTrademarkList()
    if (res.code === 200) {
      trademarkOptions.value = res.data.records
    }
  } catch (error) {
    console.error('获取品牌列表失败:', error)
    ElMessage.error('获取品牌列表失败')
  }
}

// 处理分类变化
const handleCategoryChange = (value) => {
  selectedCategory.value = value
  spuForm.category_id = value
  if (value) {
    getSpuList()
  }
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  getSpuList()
}

// 处理每页条数变化
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  getSpuList()
}

// 重置表单
const resetForm = () => {
  Object.assign(spuForm, {
    spu_id: '',
    spu_name: '',
    description: '',
    category_id: selectedCategory.value,
    product_id: '',
    images: [],
    saleAttrs: []
  })
}

// 添加SPU
const addSpu = () => {
  if (!selectedCategory.value) {
    ElMessage.warning('请先选择分类')
    return
  }
  dialogVisible.value = true
  dialogTitle.value = '添加SPU'
  resetForm()
}

// 编辑SPU
const editSpu = async (row) => {
  dialogVisible.value = true
  dialogTitle.value = '编辑SPU'
  
  try {
    const res = await reqSpuDetail(row.spu_id)
    if (res.code === 200) {
      Object.assign(spuForm, res.data)
    }
  } catch (error) {
    console.error('获取SPU详情失败:', error)
    ElMessage.error('获取SPU详情失败')
  }
}

// 删除SPU
const deleteSpu = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除 ${row.spu_name} 吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await reqDeleteSpu(row.spu_id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      if (spuList.value.length === 1 && currentPage.value > 1) {
        currentPage.value--
      }
      getSpuList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 图片上传相关方法
const handlePictureCardPreview = (file) => {
  dialogImageUrl.value = file.url
  dialogImageVisible.value = true
}

const handleRemove = (file) => {
  const index = spuForm.images.findIndex(img => img.image_url === file.url)
  if (index !== -1) {
    spuForm.images.splice(index, 1)
  }
}

const handleUploadSuccess = (response, uploadFile) => {
  if (response.code === 200) {
    spuForm.images.push({
      image_name: uploadFile.name,
      image_url: response.data
    })
    ElMessage.success('上传成功')
  } else {
    ElMessage.error('上传失败')
  }
}

const beforeUpload = (file) => {
  const isImage = /^image\//.test(file.type)
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 销售属性相关方法
const addSaleAttr = () => {
  spuForm.saleAttrs.push({
    sale_attr_name: '',
    sale_attr_value: ''
  })
}

const removeSaleAttr = (index) => {
  spuForm.saleAttrs.splice(index, 1)
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // 验证图片
    if (spuForm.images.length === 0) {
      ElMessage.warning('请至少上传一张SPU图片')
      return
    }
    
    // 验证销售属性
    if (spuForm.saleAttrs.length === 0) {
      ElMessage.warning('请至少添加一个销售属性')
      return
    }
    
    // 验证销售属性数据
    for (const attr of spuForm.saleAttrs) {
      if (!attr.sale_attr_name) {
        ElMessage.warning('销售属性名称不能为空')
        return
      }
      if (!attr.sale_attr_value) {
        ElMessage.warning(`销售属性 "${attr.sale_attr_name}" 的属性值不能为空`)
        return
      }
    }
    
    // 构造提交数据
    const submitData = {
      ...spuForm,
      category_id: selectedCategory.value,
      images: spuForm.images.map(img => ({
        image_url: img.image_url,
        image_name: img.image_name
      })),
      sale_attrs: spuForm.saleAttrs
    }
    
    console.log('提交的数据:', submitData)
    
    const res = await reqSaveSpu(submitData)
    if (res.code === 200) {
      ElMessage.success(spuForm.spu_id ? '修改成功' : '添加成功')
      dialogVisible.value = false
      getSpuList()
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败: ' + error.message)
  }
}

// 对话框关闭处理
const handleDialogClose = () => {
  formRef.value?.resetFields()
  resetForm()
}

// 添加SKU
const addSku = (row) => {
  // TODO: 实现添加SKU的功能
  ElMessage.info('即将实现添加SKU功能')
}

onMounted(async () => {
  await getCategoryList()
  await getTrademarkList()
})
</script>

<template>
  <div class="spu-container">
    <el-card class="box-card">
      <!-- 分类选择 -->
      <el-form :inline="true" class="category-form">
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
      </el-form>

      <!-- 操作按钮 -->
      <div class="operation-area" v-if="selectedCategory">
        <el-button type="primary" :icon="Plus" @click="addSpu">
          添加SPU
        </el-button>
      </div>

      <!-- SPU列表 -->
      <el-table
        v-loading="loading"
        :data="spuList"
        border
        style="margin-top: 20px"
      >
        <el-table-column type="index" label="序号" width="80" align="center" />
        <el-table-column prop="spu_name" label="SPU名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="trademark_name" label="品牌名称" width="120" />
        <el-table-column label="操作" width="250" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              :icon="Edit"
              circle
              @click="editSpu(row)"
              title="修改SPU"
            />
            <el-button
              type="success"
              :icon="Plus"
              circle
              @click="addSku(row)"
              title="添加SKU"
            />
            <el-button
              type="danger"
              :icon="Delete"
              circle
              @click="deleteSpu(row)"
              title="删除SPU"
            />
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

    <!-- SPU表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="spuForm"
        :rules="rules"
        label-width="100px"
      >
        <!-- SPU基本信息 -->
        <el-form-item label="SPU名称" prop="spu_name">
          <el-input v-model="spuForm.spu_name" placeholder="请输入SPU名称" />
        </el-form-item>
        
        <el-form-item label="品牌" prop="product_id">
          <el-select v-model="spuForm.product_id" placeholder="请选择品牌" style="width: 100%">
            <el-option
              v-for="item in trademarkOptions"
              :key="item.product_id"
              :label="item.tmName"
              :value="item.product_id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input
            v-model="spuForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入SPU描述"
          />
        </el-form-item>

        <!-- SPU图片上传 -->
        <el-form-item label="SPU图片">
          <el-upload
            :action="uploadAction"
            :headers="uploadHeaders"
            list-type="picture-card"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemove"
            :before-upload="beforeUpload"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <!-- 销售属性 -->
        <el-form-item label="销售属性">
          <div class="sale-attrs">
            <div v-for="(attr, index) in spuForm.saleAttrs" :key="index" class="sale-attr-row">
              <el-row :gutter="10">
                <el-col :span="8">
                  <el-input 
                    v-model="attr.sale_attr_name" 
                    placeholder="属性名称"
                  />
                </el-col>
                <el-col :span="12">
                  <el-input 
                    v-model="attr.sale_attr_value" 
                    placeholder="属性值"
                  />
                </el-col>
                <el-col :span="4">
                  <el-button type="danger" @click="removeSaleAttr(index)">删除</el-button>
                </el-col>
              </el-row>
            </div>
            <el-button type="primary" @click="addSaleAttr" style="margin-top: 10px;">添加销售属性</el-button>
          </div>
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
.spu-container {
  padding: 20px;

  .category-form {
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

  .sale-attrs {
    .sale-attr-row {
      margin-bottom: 10px;
      
      .el-row {
        align-items: center;
      }
    }
  }
}
</style>