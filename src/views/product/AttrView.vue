<script setup>
import { ref, reactive, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search } from '@element-plus/icons-vue'
import { reqCategoryList, reqAttrList, reqAddOrUpdateAttr, reqDeleteAttr, reqAddCategory } from '@/api/product/attr'

// 状态定义
const loading = ref(false)
const categoryOptions = ref([]) // 分类选项
const selectedCategory = ref('') // 选中的分类
const attrList = ref([]) // 属性列表
const dialogVisible = ref(false)
const dialogTitle = ref('添加属性')
const formRef = ref(null)
const inputRef = ref(null)
const inputVisible = ref(false)
const inputValue = ref('')

// 添加分类相关的状态
const categoryDialogVisible = ref(false)
const categoryFormRef = ref(null)
const categoryForm = reactive({
  name: '',
  description: ''
})

// 分类表单验证规则
const categoryRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ]
}

// 属性表单数据
const attrForm = reactive({
  id: '',
  attrName: '',
  categoryId: '',
  attrValues: []
})

// 表单验证规则
const rules = {
  attrName: [
    { required: true, message: '请输入属性名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择所属分类', trigger: 'change' }
  ]
}

// 获取分类列表
const getCategoryList = async () => {
  try {
    // TODO: 调用获取分类列表的API
    const res = await reqCategoryList()
    categoryOptions.value = res.data
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

// 获取属性列表
const getAttrList = async () => {
  if (!selectedCategory.value) return
  try {
    loading.value = true
    const res = await reqAttrList(selectedCategory.value)
    if (res.code === 200) {
      attrList.value = res.data.records || []
    } else {
      ElMessage.error(res.message || '获取属性列表失败')
    }
  } catch (error) {
    console.error('获取属性列表失败:', error)
    ElMessage.error('获取属性列表失败')
  } finally {
    loading.value = false
  }
}

// 添加属性
const addAttr = () => {
  dialogVisible.value = true
  dialogTitle.value = '添加属性'
  Object.assign(attrForm, {
    id: '',
    attrName: '',
    categoryId: selectedCategory.value,
    attrValues: []
  })
}

// 编辑属性
const editAttr = (row) => {
  dialogVisible.value = true
  dialogTitle.value = '编辑属性'
  Object.assign(attrForm, {
    id: row.attr_id,
    attrName: row.attr_name,
    categoryId: row.category_id,
    attrValues: Array.isArray(row.attr_values) 
      ? row.attr_values.map(value => ({
          value: value.trim(),
          isEdit: false
        }))
      : []
  })
}

// 删除属性
const deleteAttr = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除属性 ${row.attr_name} 吗？`, '提示', {
      type: 'warning'
    })
    await reqDeleteAttr(row.attr_id)
    ElMessage.success('删除成功')
    getAttrList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

// 确认提交
const confirm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.error('请完善表单信息')
      return
    }
    
    // 验证属性值
    const values = attrForm.attrValues
      .map(item => item.value.trim())
      .filter(value => value !== '')
    
    if (values.length === 0) {
      ElMessage.error('请至少添加一个属性值')
      return
    }
    
    if (new Set(values).size !== values.length) {
      ElMessage.error('属性值不能重复')
      return
    }
    
    try {
      loading.value = true
      // 构造符合后端要求的数据格式
      const submitData = {
        attr_id: attrForm.id || undefined,
        category_id: attrForm.categoryId,
        attr_name: attrForm.attrName,
        attr_values: values
      }
      
      console.log('提交数据:', submitData)
      
      const res = await reqAddOrUpdateAttr(submitData)
      if (res.code === 200) {
        ElMessage.success(attrForm.id ? '修改成功' : '添加成功')
        dialogVisible.value = false
        getAttrList()
      } else {
        ElMessage.error(res.message || '操作失败')
      }
    } catch (error) {
      console.error('操作失败:', error)
      ElMessage.error(error.message || '操作失败')
    } finally {
      loading.value = false
    }
  })
}

// 取消操作
const cancel = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
  attrForm.attrValues = []
  inputVisible.value = false
  inputValue.value = ''
}

// 监听分类变化
watch(selectedCategory, () => {
  getAttrList()
})

// 添加分类方法
const addCategory = () => {
  categoryDialogVisible.value = true
  categoryForm.name = ''
  categoryForm.description = ''
}

// 确认添加分类
const confirmAddCategory = async () => {
  if (!categoryFormRef.value) return
  
  await categoryFormRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.error('请完善分类信息')
      return
    }
    
    try {
      // TODO: 调用添加分类的API
      const res = await reqAddCategory(categoryForm)
      if (res.code === 200) {
        ElMessage.success('添加分类成功')
        categoryDialogVisible.value = false
        getCategoryList() // 刷新分类列表
      } else {
        ElMessage.error(res.message || '添加分类失败')
      }
    } catch (error) {
      console.error('添加分类失败:', error)
      ElMessage.error('添加分类失败')
    }
  })
}

// 处理输入确认
const handleInputConfirm = () => {
  if (inputValue.value.trim()) {
    if (!attrForm.attrValues.some(item => item.value === inputValue.value.trim())) {
      attrForm.attrValues.push({ value: inputValue.value.trim(), isEdit: false })
    } else {
      ElMessage.warning('属性值不能重复')
    }
  }
  inputVisible.value = false
  inputValue.value = ''
}

// 添加属性值输入框
const addAttrValue = () => {
  if (inputVisible.value) {
    handleInputConfirm()
  }
  inputVisible.value = true
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.input.focus()
    }
  })
}

// 删除属性值
const deleteAttrValue = (index) => {
  attrForm.attrValues.splice(index, 1)
}

onMounted(() => {
  getCategoryList()
})
</script>

<template>
  <div class="attr-container">
    <el-card class="attr-card">
      <!-- 分类选择 -->
      <el-form :inline="true" class="category-form">
        <el-form-item label="选择分类：">
          <el-select
            v-model="selectedCategory"
            placeholder="请选择分类"
            clearable
            style="width: 200px;"
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Plus" @click="addCategory">
            添加分类
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <div class="operation-area" v-if="selectedCategory">
        <el-button type="primary" :icon="Plus" @click="addAttr">
          添加属性
        </el-button>
      </div>

      <!-- 属性列表 -->
      <el-table
        v-loading="loading"
        :data="attrList"
        border
        style="margin-top: 20px"
      >
        <el-table-column type="index" label="序号" width="80" align="center" />
        <el-table-column prop="attr_name" label="属性名称" min-width="150" />
        <el-table-column label="属性值" min-width="300">
          <template #default="{ row }">
            <el-tag
              v-for="(value, index) in row.attr_values"
              :key="index"
              class="attr-tag"
            >
              {{ value }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              :icon="Edit"
              circle
              @click="editAttr(row)"
            />
            <el-popconfirm
              :title="`确定删除 ${row.attr_name} 属性吗？`"
              width="250px"
              @confirm="deleteAttr(row)"
            >
              <template #reference>
                <el-button type="danger" :icon="Delete" circle />
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑属性对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="cancel"
    >
      <el-form
        ref="formRef"
        :model="attrForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="属性名称" prop="attrName">
          <el-input
            v-model="attrForm.attrName"
            placeholder="请输入属性名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="属性值">
          <div class="attr-values">
            <div
              v-for="(item, index) in attrForm.attrValues"
              :key="index"
              class="attr-value-item"
            >
              <el-input
                v-if="item.isEdit"
                v-model="item.value"
                placeholder="请输入属性值"
                @blur="item.isEdit = false"
              />
              <div
                v-else
                class="attr-value-text"
                @click="item.isEdit = true"
              >
                {{ item.value || '点击输入' }}
              </div>
              <el-button
                type="danger"
                :icon="Delete"
                circle
                @click="deleteAttrValue(index)"
              />
            </div>
            <div v-if="inputVisible" class="attr-value-item">
              <el-input
                ref="inputRef"
                v-model="inputValue"
                placeholder="请输入属性值"
                @keyup.enter="handleInputConfirm"
                @blur="handleInputConfirm"
              />
            </div>
            <el-button
              v-else
              type="primary"
              :icon="Plus"
              @click="addAttrValue"
            >
              添加属性值
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="confirm">确 定</el-button>
      </template>
    </el-dialog>

    <!-- 添加分类对话框 -->
    <el-dialog
      v-model="categoryDialogVisible"
      title="添加分类"
      width="500px"
    >
      <el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="categoryRules"
        label-width="100px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input
            v-model="categoryForm.name"
            placeholder="请输入分类名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="分类描述">
          <el-input
            v-model="categoryForm.description"
            type="textarea"
            placeholder="请输入分类描述"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmAddCategory">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.attr-container {
  padding: 20px;

  .attr-card {
    .category-form {
      margin-bottom: 20px;
    }

    .operation-area {
      margin-bottom: 20px;
    }

    .attr-tag {
      margin-right: 8px;
      margin-bottom: 8px;
    }
  }

  .attr-values {
    .attr-value-item {
      display: flex;
      align-items: center;
      margin-bottom: 10px;

      .el-input {
        margin-right: 10px;
        flex: 1;
      }

      .attr-value-text {
        flex: 1;
        padding: 5px 10px;
        border: 1px dashed #dcdfe6;
        border-radius: 4px;
        margin-right: 10px;
        cursor: pointer;
        color: #606266;

        &:hover {
          border-color: #409eff;
          color: #409eff;
        }
      }
    }

    .el-button {
      margin-top: 10px;
    }
  }
}

.category-form {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  
  .el-form-item {
    margin-bottom: 0;
    margin-right: 16px;
  }
}
</style>