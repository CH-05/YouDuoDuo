<template>
  <div class="menu-container">
    <!-- 顶部操作栏 -->
    <div class="top-actions">
      <el-button type="primary" @click="handleAdd(null)">
        <el-icon><Plus /></el-icon>添加菜单
      </el-button>
    </div>

    <!-- 菜单表格 -->
    <el-table
      :data="menuList"
      row-key="id"
      border
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      style="width: 100%; margin-top: 20px;"
      v-loading="loading"
    >
      <el-table-column prop="name" label="菜单名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="label" label="菜单标识" min-width="180" show-overflow-tooltip />
      <el-table-column prop="level" label="菜单级别" width="100">
        <template #default="{ row }">
          <el-tag :type="row.level === 1 ? 'success' : row.level === 2 ? 'warning' : 'info'">
            {{ row.level === 1 ? '一级' : row.level === 2 ? '二级' : '三级' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-switch
            v-model="row.status"
            :active-value="1"
            :inactive-value="0"
            @change="handleStatusChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button
              type="primary"
              :icon="Plus"
              link
              @click="handleAdd(row)"
              v-if="row.level < 3"
            >
              添加子菜单
            </el-button>
            <el-button
              type="primary"
              :icon="Edit"
              link
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              :icon="Delete"
              link
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑菜单对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="menuFormRef"
        :model="menuForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="menuForm.name" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item label="菜单标识" prop="label">
          <el-input v-model="menuForm.label" placeholder="请输入菜单标识" />
        </el-form-item>
        <el-form-item label="菜单级别" prop="level">
          <el-input v-model="menuForm.level" disabled />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="menuForm.status"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getMenuListAPI,
  addMenuAPI,
  updateMenuAPI,
  deleteMenuAPI,
  updateMenuStatusAPI
} from '@/api/acl/menu'

// 菜单列表数据
const menuList = ref([])
// 添加loading状态
const loading = ref(false)

// 对话框相关数据
const dialogVisible = ref(false)
const dialogTitle = ref('')
const menuFormRef = ref(null)
const menuForm = ref({
  id: null,
  name: '',
  label: '',
  level: 1,
  parent_id: 0,
  status: 1
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  label: [
    { required: true, message: '请输入菜单标识', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

// 获取菜单列表
const getMenuList = async () => {
  try {
    loading.value = true;
    console.log('开始获取菜单列表...');
    const res = await getMenuListAPI();
    console.log('获取菜单列表响应:', res);
    
    if (res.code === 200 && res.data) {
      // 确保数据是数组
      const data = Array.isArray(res.data) ? res.data : [];
      // 处理数据，添加hasChildren属性
      const processedData = data.map(item => ({
        ...item,
        hasChildren: item.children && item.children.length > 0
      }));
      menuList.value = processedData;
      console.log('处理后的菜单列表数据:', menuList.value);
    } else {
      ElMessage.error(res.message || '获取菜单列表失败');
      menuList.value = [];
    }
  } catch (error) {
    console.error('获取菜单列表错误:', error);
    ElMessage.error('获取菜单列表失败');
    menuList.value = [];
  } finally {
    loading.value = false;
  }
}

// 添加菜单
const handleAdd = (row) => {
  dialogTitle.value = row ? '添加子菜单' : '添加菜单'
  menuForm.value = {
    id: null,
    name: '',
    label: '',
    level: row ? row.level + 1 : 1,
    parent_id: row ? row.id : 0,
    status: 1
  }
  dialogVisible.value = true
}

// 编辑菜单
const handleEdit = (row) => {
  dialogTitle.value = '编辑菜单'
  menuForm.value = { ...row }
  dialogVisible.value = true
}

// 保存菜单
const handleSave = async () => {
  if (!menuFormRef.value) return
  
  await menuFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const { id, ...menuData } = menuForm.value
        let res
        
        if (id) {
          res = await updateMenuAPI(id, menuData)
        } else {
          res = await addMenuAPI(menuData)
        }

        if (res.code === 200) {
          ElMessage.success(res.message || '保存成功')
          dialogVisible.value = false
          getMenuList()
        } else {
          ElMessage.error(res.message || '保存失败')
        }
      } catch (error) {
        console.error('保存菜单错误:', error)
        ElMessage.error('保存失败')
      }
    }
  })
}

// 删除菜单
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该菜单吗？删除后不可恢复！',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const res = await deleteMenuAPI(row.id)
    if (res.code === 200) {
      ElMessage.success(res.message || '删除成功')
      getMenuList()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除菜单错误:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 更新菜单状态
const handleStatusChange = async (row) => {
  try {
    const res = await updateMenuStatusAPI(row.id, row.status)
    if (res.code === 200) {
      ElMessage.success(res.message || '状态更新成功')
    } else {
      ElMessage.error(res.message || '状态更新失败')
      row.status = row.status === 1 ? 0 : 1 // 恢复原状态
    }
  } catch (error) {
    console.error('更新菜单状态错误:', error)
    ElMessage.error('状态更新失败')
    row.status = row.status === 1 ? 0 : 1 // 恢复原状态
  }
}

// 重置表单
const resetForm = () => {
  if (menuFormRef.value) {
    menuFormRef.value.resetFields()
  }
  menuForm.value = {
    id: null,
    name: '',
    label: '',
    level: 1,
    parent_id: 0,
    status: 1
  }
}

// 页面加载时获取菜单列表
onMounted(() => {
  getMenuList()
})
</script>

<style scoped>
.menu-container {
  padding: 20px;
}

.top-actions {
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 