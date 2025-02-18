<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { reqSpuList, reqSpuDetail, reqSaveSpu, reqDeleteSpu } from '@/api/product/spu'
import { reqCategoryList } from '@/api/product/attr'
import { reqHasTrademarkAPI } from '@/api/product/trademark'
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
    spuList.value = res.data.records
    total.value = res.data.total
  } catch (error) {
    console.error('获取SPU列表失败:', error)
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

// 获取品牌列表
const getTrademarkList = async () => {
  try {
    const res = await reqHasTrademarkAPI(1, 100)
    trademarkOptions.value = res.data.records
  } catch (error) {
    console.error('获取品牌列表失败:', error)
  }
}

// 处理分类变化
const handleCategoryChange = (categoryId) => {
  if (categoryId) {
    currentPage.value = 1
    getSpuList()
  } else {
    spuList.value = []
    total.value = 0
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

// 添加SPU
const addSpu = () => {
  dialogVisible.value = true
  dialogTitle.value = '添加SPU'
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

// 编辑SPU
const editSpu = async (row) => {
  dialogVisible.value = true
  dialogTitle.value = '编辑SPU'
  
  try {
    const res = await reqSpuDetail(row.spu_id)
    Object.assign(spuForm, res.data)
  } catch (error) {
    console.error('获取SPU详情失败:', error)
  }
}

// 删除SPU
const deleteSpu = async (row) => {
  try {
    await reqDeleteSpu(row.spu_id)
    ElMessage.success('删除成功')
    if (spuList.value.length === 1 && currentPage.value > 1) {
      currentPage.value--
    }
    getSpuList()
  } catch (error) {
    console.error('删除失败:', error)
  }
}

// 图片上传相关方法
const handlePictureCardPreview = (file) => {
  dialogImageUrl.value = file.url
  dialogImageVisible.value = true
}

const handleRemove = (file) => {
  const index = spuForm.images.findIndex(img => img.img_url === file.url)
  if (index !== -1) {
    spuForm.images.splice(index, 1)
  }
}

const handleUploadSuccess = (response, uploadFile) => {
  if (response.code === 200) {
    spuForm.images.push({
      img_name: uploadFile.name,
      img_url: `http://localhost:3000${response.data}`
    })
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(response.message || '上传失败')
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
    attr_name: '',
    attrValues: [],
    inputVisible: false,
    inputValue: ''
  })
}

const showInput = (index) => {
  spuForm.saleAttrs[index].inputVisible = true
  // 等待DOM更新后聚焦
  setTimeout(() => {
    document.querySelector('.sale-attr-item:last-child input')?.focus()
  }, 0)
}

const handleInputConfirm = (index) => {
  const attr = spuForm.saleAttrs[index]
  if (attr.inputValue.trim()) {
    attr.attrValues.push(attr.inputValue.trim())
  }
  attr.inputVisible = false
  attr.inputValue = ''
}

const removeAttrValue = (attrIndex, valueIndex) => {
  spuForm.saleAttrs[attrIndex].attrValues.splice(valueIndex, 1)
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
      await reqSaveSpu(spuForm)
      ElMessage.success(spuForm.spu_id ? '更新成功' : '添加成功')
      dialogVisible.value = false
      getSpuList()
    } catch (error) {
      console.error('保存失败:', error)
    }
  })
}

// 对话框关闭处理
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

// 添加SKU
const addSku = (row) => {
  // TODO: 实现添加SKU的功能
  ElMessage.info('即将实现添加SKU功能')
}

onMounted(() => {
  getCategoryList()
  getTrademarkList()
})
</script>

<template>
  <div class="spu-container">
    <el-card class="box-card">
      <!-- 三级分类选择 -->
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
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="trademark_name" label="品牌名称" width="120" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column prop="updated_at" label="更新时间" width="180" />
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
            <el-popconfirm
              :title="`确定删除 ${row.spu_name} 吗？`"
              width="250px"
              @confirm="deleteSpu(row)"
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
        <el-form-item label="SPU名称" prop="spu_name">
          <el-input
            v-model="spuForm.spu_name"
            placeholder="请输入SPU名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="品牌" prop="product_id">
          <el-select
            v-model="spuForm.product_id"
            placeholder="请选择品牌"
            clearable
          >
            <el-option
              v-for="item in trademarkOptions"
              :key="item.product_id"
              :label="item.tmName"
              :value="item.product_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="spuForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入SPU描述"
          />
        </el-form-item>
        <el-form-item label="SPU图片">
          <el-upload
            class="upload-demo"
            :action="uploadAction"
            :headers="uploadHeaders"
            list-type="picture-card"
            :on-preview="handlePictureCardPreview"
            :on-remove="handleRemove"
            :on-success="handleUploadSuccess"
            :before-upload="beforeUpload"
            multiple
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <el-dialog v-model="dialogImageVisible">
            <img w-full :src="dialogImageUrl" alt="Preview Image" />
          </el-dialog>
        </el-form-item>
        <el-form-item label="销售属性">
          <div class="sale-attr-list">
            <div class="sale-attr-item" v-for="(attr, index) in spuForm.saleAttrs" :key="index">
              <el-input
                v-model="attr.attr_name"
                placeholder="属性名"
                style="width: 200px"
              />
              <el-tag
                v-for="(value, valueIndex) in attr.attrValues"
                :key="valueIndex"
                closable
                @close="removeAttrValue(index, valueIndex)"
                style="margin: 0 5px"
              >
                {{ value }}
              </el-tag>
              <el-input
                v-if="attr.inputVisible"
                ref="InputRef"
                v-model="attr.inputValue"
                class="ml-1 w-20"
                size="small"
                @keyup.enter="handleInputConfirm(index)"
                @blur="handleInputConfirm(index)"
              />
              <el-button
                v-else
                class="button-new-tag ml-1"
                size="small"
                @click="showInput(index)"
              >
                + 添加值
              </el-button>
            </div>
            <el-button type="primary" @click="addSaleAttr">
              添加销售属性
            </el-button>
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

  .sale-attr-list {
    .sale-attr-item {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      flex-wrap: wrap;
      gap: 10px;

      .el-tag {
        margin-right: 5px;
      }
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