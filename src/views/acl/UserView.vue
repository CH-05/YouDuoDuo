<script setup>
import {nextTick, onMounted, reactive, ref} from "vue";
import {
  addOrUpdateUserAPI,
  getUserListAPI,
  removeUserAPI,
  removeUsersAPI,
  setUserRoleAPI,
  updateUserStatusAPI,
  resetPasswordAPI
} from "@/api/acl/user";
import { getAllRolesAPI } from "@/api/acl/role";
import {ElMessage, ElMessageBox} from "element-plus";
import moment from "moment/moment.js";
import { useUserStore } from '@/stores/modules/user'
import { Plus, Edit, Delete, Key, Search } from '@element-plus/icons-vue'

//当前页
const pageNo = ref(1);
//每页用户条数
const pageSize = ref(10);
//用户总数
const total = ref();
//所有用户
const tableData = ref([]);
//搜索关键字
const keyword = ref("")
//加载状态
const loading = ref(false)
//抽屉是否可见
const drawerShow = ref(false);
const formRef = ref();
//权限角色选项是否显示
const roleShow = ref(false)
//从pinia中拿到user数据
const userStore = useUserStore()

//用户基本信息
const userInfo = reactive({
  user_id: '',
  username: '',
  password: '',
  nickname: '',
  email: '',
  phone: '',
  status: 1,
  role_ids: []
})

// 自定义表单校验
const validateUserName = (_rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入用户名'))
  } else if (value.trim().length < 3) {
    callback(new Error('用户名至少为3位'))
  } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    callback(new Error('用户名只能包含字母、数字和下划线'))
  } else {
    callback()
  }
}

const validatePassword = (_rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入密码'))
  } else if (value.trim().length < 6) {
    callback(new Error('密码至少为6位'))
  } else {
    callback()
  }
}

const validatePhone = (_rule, value, callback) => {
  if (!value || /^1[3-9]\d{9}$/.test(value)) {
    callback()
  } else {
    callback(new Error('请输入正确的手机号'))
  }
}

const validateEmail = (_rule, value, callback) => {
  if (!value || /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(value)) {
    callback()
  } else {
    callback(new Error('请输入正确的邮箱'))
  }
}

const validateNickname = (_rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入昵称'))
  } else if (value.length < 2) {
    callback(new Error('昵称至少2个字符'))
  } else {
    callback()
  }
}

const rules = {
  username: [{required: true, validator: validateUserName, trigger: 'blur'}],
  password: [{required: true, validator: validatePassword, trigger: 'blur'}],
  nickname: [{required: true, validator: validateNickname, trigger: 'blur'}],
  phone: [{validator: validatePhone, trigger: 'blur'}],
  email: [{validator: validateEmail, trigger: 'blur'}],
  role_ids: []
}

//重置输入框
const reset = async () => {
  keyword.value = '';
  pageNo.value = 1;
  await getUserList()
}

//获取所有用户
const getUserList = async () => {
  try {
    loading.value = true
    const res = await getUserListAPI({
      page: pageNo.value,
      limit: pageSize.value,
      keyword: keyword.value
    })
    if (res.code === 200) {
      tableData.value = res.data.records
      total.value = res.data.total
    } else {
      ElMessage.error(res.message || '获取用户列表失败')
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getUserList()
  getRoleList()
})

//单个删除
const userDelete = async (userId) => {
  try {
    await ElMessageBox.confirm(`确定删除该用户吗？`, '提示', {
      type: 'warning'
    })
    const res = await removeUserAPI(userId)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      await getUserList()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

//批量删除
const selectId = ref([])
const selectChange = (selection) => {
  selectId.value = selection.map(item => item.user_id)
}

const userBatchDelete = async () => {
  if (!selectId.value.length) {
    return ElMessage.warning('请选择要删除的用户')
  }
  try {
    await ElMessageBox.confirm('确定批量删除选中的用户吗？', '提示', {
      type: 'warning'
    })
    const res = await removeUsersAPI(selectId.value)
    if (res.code === 200) {
      ElMessage.success('批量删除成功')
      getUserList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

//添加新用户
const addUser = async () => {
  let result = isAuthorization();
  if (result) {
    Object.assign(userInfo, {
      user_id: '',
      username: '',
      password: '',
      nickname: '',
      email: '',
      phone: '',
      status: 1,
      role_ids: []
    })
    drawerShow.value = true;
    await nextTick(() => {
      formRef.value?.clearValidate()
    })
  }
}

// 修改用户
const updateUser = (row) => {
  Object.assign(userInfo, {
    ...row,
    role_ids: row.roles.map(role => role.role_id)
  })
  nextTick(() => {
    formRef.value.clearValidate()
  })
  drawerShow.value = true
}

//取消添加用户
const cancel = () => {
  drawerShow.value = false;
}

//保存用户
const save = async () => {
  if (!formRef.value) return
  
  try {
    saving.value = true
    await formRef.value.validate()
    
    const res = await addOrUpdateUserAPI(userInfo)
    if (res.code === 200) {
      ElMessage({
        type: 'success',
        message: userInfo.user_id ? '更新成功' : '添加成功'
      })
      drawerShow.value = false
      if (!userInfo.user_id) pageNo.value = 1
      await getUserList()
    } else {
      ElMessage({
        type: 'error',
        message: res.message || (userInfo.user_id ? '更新失败' : '添加失败')
      })
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('表单验证失败，请检查输入')
  } finally {
    saving.value = false
  }
}
//权限管理
const allRoles = ref([
  {
    id: 1,
    name: "超级管理员"
  },
  {
    id: 1,
    name: "供应商"
  },
  {
    id: 2,
    name: '员工'
  }, {
    id: 3,
    name: '管理员'
  }, {
    id: 4,
    name: '超级管理员'
  }])
let userRole = ref({
  id: 0,
  name: ''
})

//分配角色按钮
const clickRoleBtn = async (row) => {
  Object.assign(userInfo, row)
  
  // 获取当前用户的最高角色ID
  const currentUserRoleId = userStore.role.id;
  
  // 获取目标用户的最高角色ID
  const targetUserHighestRoleId = row.roles && row.roles.length > 0
    ? Math.min(...row.roles.map(role => parseInt(role.role_id)))
    : Infinity;
  
  if (currentUserRoleId > 2 && currentUserRoleId > targetUserHighestRoleId) {
    roleShow.value = true
    // 设置当前选中的角色
    if (row.roles && row.roles.length > 0) {
      const highestRole = row.roles.reduce((prev, curr) => 
        parseInt(prev.role_id) < parseInt(curr.role_id) ? prev : curr
      );
      userRole.value = {
        id: parseInt(highestRole.role_id),
        name: highestRole.role_name
      }
    } else {
      userRole.value = {
        id: 0,
        name: '普通用户'
      }
    }
  } else {
    ElMessage({
      type: "warning",
      message: "权限不够，无法分配角色"
    })
  }
}

//判断该用户有没有权限修改此用户的权限
const hasPermission = (roles) => {
  // 获取当前用户的最高权限角色ID
  const currentUserRoles = userStore.userInfo.roles || []
  const currentUserHighestRoleId = currentUserRoles.length > 0
    ? Math.min(...currentUserRoles.map(role => parseInt(role.role_id)))
    : 999 // 如果没有角色，给一个较大的数值表示最低权限

  // 如果目标用户没有角色，允许任何管理员操作
  if (!roles || roles.length === 0) return false
  
  // 获取目标用户最高权限角色的ID（数字越小权限越高）
  const targetUserHighestRoleId = Math.min(...roles.map(role => parseInt(role.role_id)))
  
  // 如果当前用户是超级管理员（role_id = 1）或管理员（role_id = 2），允许操作
  if (currentUserHighestRoleId <= 2) return false
  
  // 其他情况，只能操作权限比自己低的用户
  return currentUserHighestRoleId <= targetUserHighestRoleId
}

//判断用户是否有权限点击按钮
const isAuthorization = () => {
  const currentUserInfo = userStore.userInfo;
  
  const currentUserRoles = currentUserInfo.roles || [];
  
  const currentUserHighestRoleId = currentUserRoles.length > 0
    ? Math.min(...currentUserRoles.map(role => parseInt(role.role_id)))
    : 999;

  if (currentUserHighestRoleId > 2) {
    ElMessage({
      type: "warning",
      message: "你为普通用户，无法执行此操作"
    })
    return false
  }
  return true
}

//取消用户权限分配
const closeRole = () => {
  roleShow.value = false
}
//改变权限分配时
const changePermission = (item) => {
  userRole.value.name = item.name
}
//用户修改权限分配
const setRole = async () => {
  const user_id = userInfo.user_id
  const roleId = userRole.value.id
  
  // 获取用户当前的最高角色ID
  const currentHighestRoleId = userInfo.roles && userInfo.roles.length > 0
    ? Math.min(...userInfo.roles.map(role => parseInt(role.role_id)))
    : Infinity;
    
  if (roleId !== currentHighestRoleId) {
    const res = await setUserRoleAPI({
      user_id,
      role_id: roleId
    })
    if (res.code === 200) {
      ElMessage({
        type: 'success',
        message: res.message
      })
      roleShow.value = false;
      await getUserList()
    }
  } else {
    ElMessage({
      type: 'info',
      message: '未执行任何操作'
    })
    roleShow.value = false
  }
}

// 状态定义
const dialogVisible = ref(false)
const dialogTitle = ref('添加用户')
const userList = ref([])
const roleList = ref([])

// 获取角色列表
const getRoleList = async () => {
  try {
    const res = await getAllRolesAPI()
    if (res.code === 200) {
      allRoles.value = res.data
    } else {
      ElMessage.error(res.message || '获取角色列表失败')
    }
  } catch (error) {
    console.error('获取角色列表失败:', error)
    ElMessage.error('获取角色列表失败')
  }
}

// 重置密码
const resetPassword = async (row) => {
  try {
    await ElMessageBox.confirm(`确定重置用户 ${row.username} 的密码吗？`, '提示', {
      type: 'warning'
    })
    const res = await resetPasswordAPI(row.user_id)
    if (res.code === 200) {
      ElMessage.success('密码重置成功')
    } else {
      ElMessage.error(res.message || '密码重置失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重置密码失败:', error)
      ElMessage.error('重置密码失败')
    }
  }
}

// 重置用户密码
const resetUserPassword = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要重置用户 ${row.username} 的密码吗？\n重置后的密码为：123456`, 
      '重置密码', 
      {
        type: 'warning',
        confirmButtonText: '确定重置',
        cancelButtonText: '取消'
      }
    )
    const res = await resetPasswordAPI(row.user_id)
    if (res.code === 200) {
      ElMessage.success('密码重置成功，新密码为：123456')
    } else {
      ElMessage.error(res.message || '密码重置失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重置密码失败:', error)
      ElMessage.error('重置密码失败')
    }
  }
}

// 更新用户状态
const handleStatusChange = async (row) => {
  try {
    const res = await updateUserStatusAPI(row.user_id, row.status)
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

// 判断是否是管理员
const isAdmin = (row) => {
  return row.roles.some(role => role.role_id === 1)
}

// 格式化日期
const formatDate = (date) => {
  return date ? moment(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

// 添加必要的响应式变量
const saving = ref(false)

// 处理查询
const handleQuery = () => {
  pageNo.value = 1
  getUserList()
}

// 重置查询
const resetQuery = () => {
  keyword.value = ''
  getUserList()
}

// 处理分页
const handleSizeChange = (val) => {
  pageSize.value = val
  getUserList()
}

const handleCurrentChange = (val) => {
  pageNo.value = val
  getUserList()
}

// 对话框关闭处理
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

// 搜索处理
const handleSearch = () => {
  pageNo.value = 1
  getUserList()
}
</script>

<template>
  <div class="user-container">
    <!-- 搜索和操作栏 -->
    <div class="operation-bar">
      <el-input
        v-model="keyword"
        placeholder="请输入用户名/昵称搜索"
        class="search-input"
        clearable
        @clear="reset"
        @keyup.enter="getUserList"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <div class="operation-buttons">
        <el-button type="primary" :icon="Plus" @click="addUser">添加用户</el-button>
        <el-button type="danger" :icon="Delete" @click="userBatchDelete" :disabled="!selectId.length">
          批量删除
        </el-button>
      </div>
    </div>

    <!-- 用户列表表格 -->
    <el-table
      v-loading="loading"
      :data="tableData"
      style="width: 100%"
      @selection-change="selectChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="username" label="用户名" min-width="120" />
      <el-table-column prop="nickname" label="昵称" min-width="120" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-switch
            v-model="row.status"
            :active-value="1"
            :inactive-value="0"
            :disabled="isAdmin(row)"
            @change="handleStatusChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="角色" min-width="180">
        <template #default="{ row }">
          <el-tag
            v-for="role in row.roles"
            :key="role.role_id"
            :type="role.role_id === 1 ? 'danger' : role.role_id === 2 ? 'warning' : 'info'"
            class="role-tag"
          >
            {{ role.role_name }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" min-width="180">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button
              type="primary"
              :icon="Edit"
              link
              :disabled="isAdmin(row)"
              @click="updateUser(row)"
            >
              编辑
            </el-button>
            <el-button
              type="warning"
              :icon="Key"
              link
              :disabled="isAdmin(row)"
              @click="resetUserPassword(row)"
            >
              重置密码
            </el-button>
            <el-button
              type="danger"
              :icon="Delete"
              link
              :disabled="isAdmin(row)"
              @click="userDelete(row.user_id)"
            >
              删除
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页器 -->
    <div class="pagination-container">
      <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20, 30]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
      />
    </div>

    <!-- 用户表单抽屉 -->
    <el-drawer
      v-model="drawerShow"
      :title="userInfo.user_id ? '编辑用户' : '添加用户'"
      size="400px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="userInfo"
        :rules="rules"
        label-width="80px"
        class="user-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userInfo.username" :disabled="!!userInfo.user_id" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="userInfo.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!userInfo.user_id">
          <el-input v-model="userInfo.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userInfo.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userInfo.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="角色" prop="role_ids">
          <el-select
            v-model="userInfo.role_ids"
            multiple
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option
              v-for="role in allRoles"
              :key="role.role_id"
              :label="role.role_name"
              :value="role.role_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="userInfo.status"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="drawerShow = false">取消</el-button>
          <el-button type="primary" @click="save" :loading="saving">
            {{ userInfo.user_id ? '更新' : '添加' }}
          </el-button>
        </div>
      </template>
    </el-drawer>

    <!--       分配角色 -->
    <el-drawer v-model="roleShow" direction="rtl" size="35%">
      <template #header>
        <h4>分配角色</h4>
      </template>
      <template #default>
        <el-form>
          <el-form-item label="用户姓名:">
            <el-input
                placeholder="请输入用户姓名"
                disabled
                v-model="userInfo.username"
            />
          </el-form-item>
          <el-form-item label="角色列表:">
            <el-radio-group v-model="userRole.id">
              <el-radio v-for="item in allRole" :value="item.id" @change="changePermission(item)" :key="item.id" :disabled="hasPermission(item)">
                {{ item.name }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <div style="flex: auto">
          <el-button @click="closeRole">取消</el-button>
          <el-button
              type="primary"
              :disabled="!userRole"
              @click="setRole"
          >
            确定
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.user-container {
    padding: 20px;
}

.user-card {
    min-height: calc(100vh - 100px);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.search-form {
    margin-bottom: 20px;
}

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

.el-tag {
    margin-right: 5px;
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

.role-tag {
  margin-right: 5px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.user-form {
  padding: 20px;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  padding: 20px;
  gap: 10px;
}

:deep(.el-drawer__body) {
  padding: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>