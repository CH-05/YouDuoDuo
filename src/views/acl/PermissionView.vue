<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import {
  getMenuListAPI,
  addMenuAPI,
  updateMenuAPI,
  deleteMenuAPI,
  updateMenuStatusAPI
} from '@/api/acl/menu'

// 状态定义
const loading = ref(false)
const menuTree = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('添加菜单')
const formRef = ref(null)

// 菜单类型选项
const menuTypeOptions = [
  { label: '目录', value: 1 },
  { label: '菜单', value: 2 },
  { label: '按钮', value: 3 }
]

// 表单数据
const menuForm = reactive({
  menu_id: '',
  parent_id: null,
  menu_name: '',
  menu_code: '',
  menu_level: 1,
  menu_type: 1,
  path: '',
  component: '',
  redirect: '',
  icon: '',
  sort_order: 0,
  hidden: false,
  disabled: false
})

// 表单验证规则
const rules = {
  menu_name: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  menu_code: [
    { required: true, message: '请输入菜单编码', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  menu_type: [
    { required: true, message: '请选择菜单类型', trigger: 'change' }
  ]
}

// 获取菜单树
const getMenuTree = async () => {
  try {
    loading.value = true
    const res = await getMenuListAPI()
    if (res.code === 200) {
      menuTree.value = res.data
    } else {
      ElMessage.error(res.message || '获取菜单树失败')
    }
  } catch (error) {
    console.error('获取菜单树失败:', error)
    ElMessage.error('获取菜单树失败')
  } finally {
    loading.value = false
  }
}

// 添加子菜单
const addChildMenu = (row) => {
  dialogVisible.value = true
  dialogTitle.value = '添加子菜单'
  Object.assign(menuForm, {
    menu_id: '',
    parent_id: row.menu_id,
    menu_name: '',
    menu_code: '',
    menu_level: row.menu_level + 1,
    menu_type: row.menu_type === 1 ? 2 : 3,
    path: '',
    component: '',
    redirect: '',
    icon: '',
    sort_order: 0,
    hidden: false,
    disabled: false
  })
}

// 添加顶级菜单
const addTopMenu = () => {
  dialogVisible.value = true
  dialogTitle.value = '添加顶级菜单'
  Object.assign(menuForm, {
    menu_id: '',
    parent_id: null,
    menu_name: '',
    menu_code: '',
    menu_level: 1,
    menu_type: 1,
    path: '',
    component: '',
    redirect: '',
    icon: '',
    sort_order: 0,
    hidden: false,
    disabled: false
  })
}

// 编辑菜单
const editMenu = (row) => {
  dialogVisible.value = true
  dialogTitle.value = '编辑菜单'
  Object.assign(menuForm, {
    ...row,
    hidden: Boolean(row.hidden),
    disabled: Boolean(row.disabled)
  })
}

// 删除菜单
const deleteMenu = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除菜单 ${row.menu_name} 吗？`, '提示', {
      type: 'warning'
    })
    await deleteMenuAPI(row.menu_id)
    ElMessage.success('删除成功')
    getMenuTree()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
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
      const formData = {
        ...menuForm,
        hidden: Boolean(menuForm.hidden),
        disabled: Boolean(menuForm.disabled),
        sort_order: Number(menuForm.sort_order)
      }
      
      if (menuForm.menu_id) {
        await updateMenuAPI(menuForm.menu_id, formData)
        ElMessage.success('更新成功')
      } else {
        await addMenuAPI(formData)
        ElMessage.success('添加成功')
      }
      dialogVisible.value = false
      getMenuTree()
    } catch (error) {
      console.error('保存失败:', error)
    }
  })
}

// 对话框关闭处理
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

// 处理菜单类型变化
const handleMenuTypeChange = (type) => {
  if (type === 1) {
    menuForm.component = 'Layout'
  } else {
    menuForm.component = ''
  }
}

// 获取菜单列表
const getMenuList = async () => {
  try {
    const res = await getMenuListAPI()
    if (res.code === 200) {
      menuTree.value = res.data
    } else {
      ElMessage.error(res.message || '获取菜单列表失败')
    }
  } catch (error) {
    console.error('获取菜单列表错误:', error)
    ElMessage.error('获取菜单列表失败')
  }
}

// 添加菜单
const handleAddMenu = async (formData) => {
  try {
    const res = await addMenuAPI(formData)
    if (res.code === 200) {
      ElMessage.success('添加成功')
      getMenuList()
    } else {
      ElMessage.error(res.message || '添加失败')
    }
  } catch (error) {
    console.error('添加菜单错误:', error)
    ElMessage.error('添加失败')
  }
}

// 更新菜单
const handleUpdateMenu = async (menuId, formData) => {
  try {
    const res = await updateMenuAPI(menuId, formData)
    if (res.code === 200) {
      ElMessage.success('更新成功')
      getMenuList()
    } else {
      ElMessage.error(res.message || '更新失败')
    }
  } catch (error) {
    console.error('更新菜单错误:', error)
    ElMessage.error('更新失败')
  }
}

// 删除菜单
const handleDeleteMenu = async (menuId) => {
  try {
    const res = await deleteMenuAPI(menuId)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      getMenuList()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    console.error('删除菜单错误:', error)
    ElMessage.error('删除失败')
  }
}

// 更新菜单状态
const handleStatusChange = async (menuId, status) => {
  try {
    const res = await updateMenuStatusAPI(menuId, status)
    if (res.code === 200) {
      ElMessage.success('状态更新成功')
    } else {
      ElMessage.error(res.message || '状态更新失败')
    }
  } catch (error) {
    console.error('更新状态错误:', error)
    ElMessage.error('更新状态失败')
  }
}

onMounted(() => {
  getMenuTree()
})
</script>

<template>
  <div class="menu-container">
    <el-card class="menu-card">
      <template #header>
        <div class="card-header">
          <span>菜单管理</span>
          <el-button type="primary" :icon="Plus" @click="addTopMenu">
            添加顶级菜单
          </el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="menuTree"
        row-key="menu_id"
        border
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="menu_name" label="菜单名称" min-width="180" />
        <el-table-column prop="menu_code" label="菜单编码" min-width="150" />
        <el-table-column prop="menu_type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.menu_type === 1 ? 'primary' : row.menu_type === 2 ? 'success' : 'warning'">
              {{ menuTypeOptions.find(opt => opt.value === row.menu_type)?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" min-width="150" />
        <el-table-column prop="component" label="组件路径" min-width="150" />
        <el-table-column prop="icon" label="图标" width="100">
          <template #default="{ row }">
            <el-icon v-if="row.icon">
              <component :is="row.icon" />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="80" align="center" />
        <el-table-column label="状态" width="150">
          <template #default="{ row }">
            <el-tag
              :type="row.disabled ? 'danger' : 'success'"
              effect="plain"
            >
              {{ row.disabled ? '禁用' : '启用' }}
            </el-tag>
            <el-tag
              :type="row.hidden ? 'info' : 'success'"
              effect="plain"
              class="ml-2"
            >
              {{ row.hidden ? '隐藏' : '显示' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.menu_type !== 3"
              type="primary"
              :icon="Plus"
              circle
              @click="addChildMenu(row)"
              title="添加子菜单"
            />
            <el-button
              type="primary"
              :icon="Edit"
              circle
              @click="editMenu(row)"
              title="编辑菜单"
            />
            <el-popconfirm
              :title="`确定删除 ${row.menu_name} 吗？`"
              width="250px"
              @confirm="deleteMenu(row)"
            >
              <template #reference>
                <el-button type="danger" :icon="Delete" circle />
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 菜单表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="menuForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="菜单名称" prop="menu_name">
          <el-input
            v-model="menuForm.menu_name"
            placeholder="请输入菜单名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="菜单编码" prop="menu_code">
          <el-input
            v-model="menuForm.menu_code"
            placeholder="请输入菜单编码"
            clearable
          />
        </el-form-item>
        <el-form-item label="菜单类型" prop="menu_type">
          <el-select
            v-model="menuForm.menu_type"
            placeholder="请选择菜单类型"
            @change="handleMenuTypeChange"
          >
            <el-option
              v-for="item in menuTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="路由路径" v-if="menuForm.menu_type !== 3">
          <el-input
            v-model="menuForm.path"
            placeholder="请输入路由路径"
            clearable
          />
        </el-form-item>
        <el-form-item label="组件路径" v-if="menuForm.menu_type !== 3">
          <el-input
            v-model="menuForm.component"
            placeholder="请输入组件路径"
            clearable
          />
        </el-form-item>
        <el-form-item label="重定向" v-if="menuForm.menu_type === 1">
          <el-input
            v-model="menuForm.redirect"
            placeholder="请输入重定向路径"
            clearable
          />
        </el-form-item>
        <el-form-item label="图标" v-if="menuForm.menu_type !== 3">
          <el-input
            v-model="menuForm.icon"
            placeholder="请输入图标名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number
            v-model="menuForm.sort_order"
            :min="0"
            :precision="0"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="menuForm.disabled"
            active-text="禁用"
            inactive-text="启用"
            :active-value="true"
            :inactive-value="false"
          />
          <el-switch
            v-model="menuForm.hidden"
            class="ml-4"
            active-text="隐藏"
            inactive-text="显示"
            :active-value="true"
            :inactive-value="false"
          />
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
.menu-container {
  padding: 20px;

  .menu-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .ml-2 {
    margin-left: 8px;
  }

  .ml-4 {
    margin-left: 16px;
  }
}
</style>