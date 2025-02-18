<script setup>
import {onMounted, reactive, ref} from "vue";
import {addUserPermissionAPI, removeUserAPI} from "@/api/acl/user.js";
import {ElMessage, ElMessageBox} from "element-plus";
import {useUserStore} from "@/stores/modules/user.js";
import {
  getRoleListAPI,
  reqPermissionMenuAPI,
  addRoleAPI,
  updateRoleAPI,
  deleteRoleAPI,
  updateRoleStatusAPI
} from "@/api/acl/role";
import moment from "moment";
import { Plus, Edit, Delete, Search } from '@element-plus/icons-vue'

//当前页
const pageNo = ref(1);
//每页用户条数
const pageSize = ref(5);
//用户总数
const total = ref();
//所有用户
const tableData = ref([]);
//搜索关键字
const keyword = ref("")
//抽屉是否可见
const drawerShow = ref(false);
const formRef = ref();
//权限角色选项是否显示
const roleShow = ref(false)
//从pinia中拿到user数据
const userStore = useUserStore()
//定义菜单数据
const menuData = ref([])
//定义树形控件中所有选中的id
const selectArr = ref([])
//定义用户点击选中的树形控件的权限id数组
const treeRef = ref([])

//用户基本信息
const roleParams = reactive({
  user_id: '',
  id: '',
  name: '',
})

// 添加缺失的响应式变量
const loading = ref(false)
const dialogVisible = ref(false)
const saving = ref(false)

// 角色信息对象
const roleInfo = reactive({
  role_id: '',
  role_name: '',
  role_code: '',
  description: '',
  status: 1
})

// 修改表单验证规则
const rules = {
  role_name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  role_code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { pattern: /^[A-Z_]+$/, message: '角色编码只能包含大写字母和下划线', trigger: 'blur' }
  ]
}

// 自定义表达校验
const validateUserName = (_rule, value, callback) => {
  if (value.trim().length >= 1) {
    callback()
  } else {
    callback(new Error('用户姓名至少为5位'))
  }
}
const validatePassword = (_rule, value, callback) => {
  if (value.trim().length >= 1) {
    callback()
  } else {
    callback(new Error('用户密码至少为6位'))
  }
}

//重置输入框
const reset = async () => {
  keyword.value = '';
  await getRoleList()
}

//获取所有用户
const getRoleList = async () => {
  //简单判断一下用户输入的内容是否值得发送请求
  if (!["超级管理员", "管理员", "员工", "供应商", "客户", ""].includes(keyword.value)) {
    ElMessage({
      type: 'warning',
      message: '查询不到该字段'
    })
  } else {
    let res = await getRoleListAPI(pageNo.value, pageSize.value, keyword.value);
    if (res.code === 200) {
      tableData.value = res.data.result.map((item) => {
        item.role = JSON.parse(item.role)
        item.created_at = moment(item.created_at).format("YYYY-MM-DD HH:mm:ss")
        item.updated_at = moment(item.updated_at).format("YYYY-MM-DD HH:mm:ss")
        return item
      })
      total.value = res.data.total
    } else if (res.code === 501) {
      ElMessage({
        type: 'error',
        message: res.message
      })
    }
  }
}

onMounted(() => {
  getRoleList()
})

//单个删除
const userDelete = async (user_id) => {
  const res = await removeUserAPI({user_id})
  if (res.code === 200) {
    ElMessage({
      type: 'success',
      message: res.message,
    })
    await getRoleList()
  } else {
    ElMessage({
      type: 'error',
      message: res.message,
    })
  }
}

//批量删除
const selectId = ref();
const selectChange = (value) => {
  selectId.value = value.map(item => {
    return item.user_id
  })
}


let userRole = ref({
  id: 0,
  name: ''
})

//分配权限按钮
const addPermission = async (row) => {
  Object.assign(roleParams, {
    id: row.role.id,
    name: row.role.name,
  })
  const currentRoleId = userStore.role.id;
  const roleId = roleParams.id;
  //用户id
  roleParams.user_id = row.user_id
  if (currentRoleId > roleId) {
    drawerShow.value = true
    //获取当前点击用户拥有哪些权限
    const res = await reqPermissionMenuAPI(roleParams.user_id)
    console.log(res);
    if (res.code === 200) {
      menuData.value = JSON.parse(res.data.routes)
      selectArr.value = filterSelectArr(menuData.value, [])
    }
    userRole.value.id = roleParams.id;
    userRole.value.name = roleParams.name
    console.log(userRole.value);
  } else {
    ElMessage({
      type: "warning",
      message: "你无权分配同级别以及更高人的权限"
    })
  }
}
const defaultProps = {
  children: 'children',
  label: 'name',
}
//树形控件过滤哪些选项有被勾选上
const filterSelectArr = (allData, initArr) => {
  allData.forEach((item) => {
    if (item.select && item.level === 3) {
      initArr.push(item.id);
    }
    if (item.children && item.children.length > 0) {
      filterSelectArr(item.children, initArr);
    }
  })
  return initArr;
}

//判断该用户有没有权限修改此用户的权限
const hasPermission = (item) => {
  const roleId = userStore.role.id
  return roleId <= item.id;
}

//取消用户权限分配
const closeRole = () => {
  roleShow.value = false
}
//改变权限分配时
const changePermission = (item) => {
  userRole.value.name = item.name
}
//用户修改权限分配确认
const roleSave = async () => {
  //拿到点击的用户id
  const user_id = roleParams.user_id
  //拿到用户点击的树形控件中点击的权限permissionId
  const arr = treeRef.value.getCheckedKeys()
  const arr1 = treeRef.value.getHalfCheckedKeys()
  const permissionId = arr.concat(arr1)
  const res = await addUserPermissionAPI({user_id, permissionId})
  if (res.code === 200) {
    ElMessage({
      type: 'success',
      message: res.message
    })
    drawerShow.value = false;
    setTimeout(() => {
      window.location.reload()
    }, 800)
  } else {
    ElMessage({
      type: 'warning',
      message: res.message
    })
  }
}

//用户取消修改其他人的权限
const roleCancel = () => {
  drawerShow.value = false
}

// 添加角色方法
const addRole = () => {
  Object.assign(roleInfo, {
    role_id: '',
    role_name: '',
    role_code: '',
    description: '',
    status: 1
  })
  dialogVisible.value = true
}

// 更新角色方法
const updateRole = (row) => {
  Object.assign(roleInfo, row)
  dialogVisible.value = true
}

// 删除角色方法
const roleDelete = async (roleId) => {
  try {
    await ElMessageBox.confirm('确定要删除该角色吗？', '提示', {
      type: 'warning'
    })
    const res = await deleteRoleAPI(roleId)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      getRoleList()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 保存角色方法
const save = async () => {
  if (!formRef.value) return
  
  try {
    saving.value = true
    await formRef.value.validate()
    
    const res = roleInfo.role_id
      ? await updateRoleAPI(roleInfo.role_id, roleInfo)
      : await addRoleAPI(roleInfo)
      
    if (res.code === 200) {
      ElMessage.success(roleInfo.role_id ? '更新成功' : '添加成功')
      dialogVisible.value = false
      getRoleList()
    } else {
      ElMessage.error(res.message || (roleInfo.role_id ? '更新失败' : '添加失败'))
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('表单验证失败，请检查输入')
  } finally {
    saving.value = false
  }
}

// 处理状态变更
const handleStatusChange = async (row) => {
  try {
    const res = await updateRoleStatusAPI(row.role_id, row.status)
    if (res.code === 200) {
      ElMessage.success('状态更新成功')
    } else {
      row.status = row.status === 1 ? 0 : 1
      ElMessage.error(res.message || '状态更新失败')
    }
  } catch (error) {
    console.error('更新状态失败:', error)
    ElMessage.error('更新状态失败')
    row.status = row.status === 1 ? 0 : 1
  }
}

// 分页处理方法
const handleSizeChange = (val) => {
  pageSize.value = val
  getRoleList()
}

const handleCurrentChange = (val) => {
  pageNo.value = val
  getRoleList()
}

// 对话框关闭处理
const handleDialogClose = () => {
  formRef.value?.resetFields()
}
</script>

<template>
  <div class="role-container">
    <!-- 搜索和操作栏 -->
    <div class="operation-bar">
      <el-input
        v-model="keyword"
        placeholder="请输入角色名称搜索"
        class="search-input"
        clearable
        @clear="reset"
        @keyup.enter="getRoleList"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <div class="operation-buttons">
        <el-button type="primary" :icon="Plus" @click="addRole">添加角色</el-button>
      </div>
    </div>

    <!-- 角色列表表格 -->
    <el-table
      v-loading="loading"
      :data="tableData"
      style="width: 100%"
    >
      <el-table-column prop="role_name" label="角色名称" min-width="120" />
      <el-table-column prop="role_code" label="角色编码" min-width="120" />
      <el-table-column prop="description" label="描述" min-width="180" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-switch
            v-model="row.status"
            :active-value="1"
            :inactive-value="0"
            :disabled="row.role_id === 1"
            @change="handleStatusChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button
              type="primary"
              :icon="Edit"
              link
              :disabled="row.role_id === 1"
              @click="updateRole(row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              :icon="Delete"
              link
              :disabled="row.role_id === 1"
              @click="roleDelete(row.role_id)"
            >
              删除
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pageNo"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 角色表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="roleInfo.role_id ? '编辑角色' : '添加角色'"
      width="500px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="roleInfo"
        :rules="rules"
        label-width="100px"
        class="role-form"
      >
        <el-form-item label="角色名称" prop="role_name">
          <el-input v-model="roleInfo.role_name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" prop="role_code">
          <el-input v-model="roleInfo.role_code" placeholder="请输入角色编码" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="roleInfo.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="roleInfo.status"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="save" :loading="saving">
            {{ roleInfo.role_id ? '更新' : '添加' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.role-container {
  padding: 20px;
}

.operation-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.search-input {
  width: 250px;
}

.operation-buttons {
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.role-form {
  padding: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>