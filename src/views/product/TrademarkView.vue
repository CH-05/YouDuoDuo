<template>
  <div class="trademark-container">
    <!-- 头部操作区 -->
    <el-card class="header-card">
      <div class="operation-area">
        <el-button type="primary" :icon="Plus" @click="addTrademark">
          添加品牌
        </el-button>
        <!-- 搜索区域 -->
        <div class="search-box">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入品牌名称搜索"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearch" />
            </template>
          </el-input>
        </div>
      </div>

      <!-- 表格区域 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        class="brand-table"
      >
        <el-table-column
          type="index"
          label="序号"
          width="80"
          align="center"
        />
        <el-table-column prop="tmName" label="品牌名称" min-width="150" />
        <el-table-column label="品牌Logo" min-width="150" align="center">
          <template #default="{ row }">
            <el-image
              :src="row.logoUrl"
              :preview-src-list="[row.logoUrl]"
              class="brand-logo"
              fit="contain"
              :initial-index="0"
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                  <span>加载失败</span>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" min-width="150" align="center" />
        <el-table-column prop="updated_at" label="更新时间" min-width="150" align="center" />
        <el-table-column label="操作" width="250" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              :icon="Edit"
              circle
              @click="updateTrademark(row)"
            />
            <el-button
              type="success"
              :icon="SetUp"
              circle
              @click="showAttrDialog(row)"
              title="关联属性"
            />
            <el-popconfirm
              :title="`确定删除 ${row.tmName} 品牌吗？`"
              width="250px"
              @confirm="deleteTrademark(row)"
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

    <!-- 添加/编辑品牌对话框 -->
    <el-dialog
      v-model="dialogFormVisible"
      :title="dialogTitle"
      width="500px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="trademarkParams"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="品牌名称" prop="tmName">
          <el-input
            v-model="trademarkParams.tmName"
            placeholder="请输入品牌名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="品牌Logo" prop="logoUrl">
          <el-upload
            class="logo-uploader"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
            :http-request="customUpload"
            :on-error="handleUploadError"
          >
            <img
              v-if="trademarkParams.logoUrl"
              :src="trademarkParams.logoUrl"
              class="uploaded-logo"
            />
            <div v-else class="upload-placeholder">
              <el-icon class="upload-icon"><Plus /></el-icon>
              <span>点击上传Logo</span>
            </div>
          </el-upload>
          <div class="upload-tip">
            支持 PNG/JPG/GIF 格式，大小不超过2MB
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancel">取 消</el-button>
        <el-button
          type="primary"
          :loading="submitLoading"
          @click="confirm"
        >
          确 定
        </el-button>
      </template>
    </el-dialog>

    <!-- 添加属性关联对话框 -->
    <el-dialog
      v-model="attrDialogVisible"
      title="关联属性"
      width="600px"
    >
      <div class="attr-dialog-content">
        <el-form :inline="true" class="attr-form">
          <el-form-item label="选择分类：">
            <el-select
              v-model="selectedCategory"
              placeholder="请选择分类"
              clearable
              @change="handleCategoryChange"
              style="width: 300px"
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

        <el-table
          v-if="selectedCategory"
          v-loading="attrLoading"
          :data="attrList"
          border
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="attrName" label="属性名称" />
          <el-table-column label="属性值">
            <template #default="{ row }">
              <el-tag
                v-for="value in row.attrValues"
                :key="value"
                class="attr-tag"
              >
                {{ value }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="attrDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="saveAttrRelation">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search, Picture, SetUp } from '@element-plus/icons-vue'
import {
  reqHasTrademarkAPI,
  reqAddOrUpdateTrademark,
  reqDeleteTrademark,
  uploadTrademarkImage,
  reqProductAttrRelation,
  reqSaveProductAttr,
  reqProductAttrDetail
} from '@/api/product/trademark'
import { reqCategoryList, reqAttrList } from '@/api/product/attr'

// 状态定义
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
// 从 localStorage 获取页面大小，如果没有则使用默认值 10
const pageSize = ref(parseInt(localStorage.getItem('trademarkPageSize')) || 10)
const searchKeyword = ref('')
const dialogFormVisible = ref(false)
const dialogTitle = ref('添加品牌')
const submitLoading = ref(false)
const formRef = ref(null)

// 表单数据
const trademarkParams = reactive({
  product_id: '',
  tmName: '',
  logoUrl: '',
  created_at: '',
  updated_at: ''
})

// 表单验证规则
const rules = {
  tmName: [
    { required: true, message: '请输入品牌名称', trigger: 'blur' },
    { min: 2, max: 50, message: '品牌名称长度需在2-50个字符之间', trigger: 'blur' }
  ],
  logoUrl: [
    { required: true, message: '请上传品牌LOGO', trigger: 'change' }
  ]
}

// 获取品牌列表
const getTrademarkList = async () => {
  try {
    loading.value = true
    const res = await reqHasTrademarkAPI(currentPage.value, pageSize.value, searchKeyword.value)
    console.log("res", res);
    tableData.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取品牌列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  getTrademarkList()
}

// 处理每页条数变化
const handleSizeChange = (val) => {
  pageSize.value = val
  // 保存到 localStorage
  localStorage.setItem('trademarkPageSize', val.toString())
  currentPage.value = 1
  getTrademarkList()
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  getTrademarkList()
}

// 添加品牌
const addTrademark = () => {
  dialogFormVisible.value = true
  // 重置表单数据
  Object.assign(trademarkParams, {
    product_id: '',
    tmName: '',
    logoUrl: '',
    created_at: '',
    updated_at: ''
  })
}

// 编辑品牌
const updateTrademark = (row) => {
  dialogFormVisible.value = true
  // 填充表单数据
  Object.assign(trademarkParams, {
    product_id: row.product_id,
    tmName: row.tmName,
    logoUrl: row.logoUrl,
    created_at: row.created_at,
    updated_at: row.updated_at
  })
}

// 处理删除
const deleteTrademark = async (row) => {
  console.log("row", row);
  try {
    await ElMessageBox.confirm(`确定要删除品牌 ${row.tmName} 吗？`, '提示', {
      type: 'warning'
    })
    await reqDeleteTrademark(row.product_id)
    ElMessage.success('删除成功')
    if (tableData.value.length === 1 && currentPage.value > 1) {
      currentPage.value--
    }
    getTrademarkList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

// 自定义上传
const customUpload = async ({ file }) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await uploadTrademarkImage(formData)
    
    if (res.code === 200 && res.data) {
      trademarkParams.logoUrl = `http://localhost:3000${res.data}`
      ElMessage.success('上传成功')
    } else {
      ElMessage.error(res.message || '上传失败')
    }
  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error('上传失败，请重试')
  }
}

// 图片上传前的验证
const beforeAvatarUpload = (file) => {
  const isValidType = ['image/jpeg', 'image/png', 'image/gif'].includes(file.type)
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isValidType) {
    ElMessage.error('上传图片只能是 JPG/PNG/GIF 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 处理上传错误
const handleUploadError = () => {
  ElMessage.error('上传失败，请重试')
}

// 确认提交
const confirm = async () => {
  if (!formRef.value) return
  
  // 添加表单验证
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.error('请完善表单信息')
      return
    }
    
    try {
      submitLoading.value = true
      console.log("trademarkParams", trademarkParams)
      await reqAddOrUpdateTrademark(trademarkParams)
      ElMessage.success(trademarkParams.product_id ? '编辑成功' : '添加成功')
      dialogFormVisible.value = false
      getTrademarkList()
    } catch (error) {
      console.error('操作失败:', error)
    } finally {
      submitLoading.value = false
    }
  })
}

// 取消操作
const cancel = () => {
  dialogFormVisible.value = false
}

// 对话框关闭时的处理
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

// 添加属性关联相关的状态
const attrDialogVisible = ref(false)
const selectedCategory = ref('')
const categoryOptions = ref([])
const attrList = ref([])
const attrLoading = ref(false)
const currentProduct = ref(null)
const selectedAttrs = ref([]) // 存储选中的属性

// 获取分类和属性的方法
const getCategoryList = async () => {
  try {
    const res = await reqCategoryList()
    categoryOptions.value = res.data
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

const getAttrList = async (categoryId) => {
  try {
    attrLoading.value = true
    const res = await reqAttrList(categoryId)
    attrList.value = res.data
  } catch (error) {
    console.error('获取属性列表失败:', error)
  } finally {
    attrLoading.value = false
  }
}

// 显示属性关联对话框的方法
const showAttrDialog = async (row) => {
  console.log("row", row);
  currentProduct.value = row
  attrDialogVisible.value = true
  await getCategoryList()
  // 获取已关联的属性
  try {
    const res = await reqProductAttrRelation(row.product_id)
    // 设置已关联属性的选中状态
    selectedAttrs.value = res.data.map(item => item.attr_id)
    console.log("selectedAttrs", selectedAttrs.value);
  } catch (error) {
    console.error('获取关联属性失败:', error)
  }
}

// 分类变化处理方法
const handleCategoryChange = (categoryId) => {
  if (categoryId) {
    getAttrList(categoryId)
  } else {
    attrList.value = []
  }
}

// 保存属性关联的方法
const saveAttrRelation = async () => {
  try {
    await reqSaveProductAttr({
      product_id: currentProduct.value.product_id,
      attrIds: selectedAttrs.value
    })
    ElMessage.success('关联属性成功')
    attrDialogVisible.value = false
  } catch (error) {
    console.error('关联属性失败:', error)
  }
}

onMounted(() => {
  getTrademarkList()
})
</script>

<style scoped lang="scss">
.trademark-container {
  padding: 20px;

  .header-card {
    .operation-area {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;

      .search-box {
        width: 300px;
      }
    }
  }

  .brand-table {
    margin: 20px 0;

    .brand-logo {
      width: 100px;
      height: 100px;
      border-radius: 4px;
    }

    .image-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #909399;
      font-size: 12px;
    }
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .logo-uploader {
    .uploaded-logo {
      width: 178px;
      height: 178px;
      display: block;
      object-fit: contain;
    }

    .upload-placeholder {
      width: 178px;
      height: 178px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--el-text-color-secondary);
      border: 1px dashed var(--el-border-color);
      border-radius: 6px;
      cursor: pointer;
      transition: var(--el-transition-duration-fast);

      &:hover {
        border-color: var(--el-color-primary);
      }

      .upload-icon {
        font-size: 28px;
        margin-bottom: 8px;
      }
    }
  }

  .upload-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 8px;
  }

  // 添加加载动画样式
  .uploading {
    position: relative;
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
}

.avatar-uploader {
  .el-upload {
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);

    &:hover {
      border-color: var(--el-color-primary);
    }
  }
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
  line-height: 178px;
}

.uploaded-logo {
  width: 178px;
  height: 178px;
  display: block;
  object-fit: contain;
}

.attr-dialog-content {
  .attr-form {
    margin-bottom: 20px;
  }
  
  .attr-tag {
    margin-right: 8px;
    margin-bottom: 4px;
  }
}
</style>

