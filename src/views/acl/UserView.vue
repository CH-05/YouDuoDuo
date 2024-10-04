<script setup>
import {nextTick, onMounted, reactive, ref} from "vue";
import {addNewUserAPI, getUserListAPI, removeUserAPI, removeUsersAPI} from "@/api/acl/user.js";
import {ElMessage} from "element-plus";

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
const roleShow = ref(false)

//用户基本信息
const userInfo = reactive({
  user_id: '',
  username: '',
  password: '',
  role: '',
  created_at: ''
})

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
const rules = {
  username: [{ required: true, validator: validateUserName, trigger: 'blur' }],
  password: [{ required: true, validator: validatePassword, trigger: 'blur' }],
}

//重置输入框
const reset = async () => {
  keyword.value = '';
  await getUserList()
}

//获取所有用户
const getUserList = async () => {
  let res = await getUserListAPI(pageNo.value, pageSize.value, keyword.value);
  console.log(res);
  if (res.code === 200) {
    tableData.value = res.data.result
    total.value = res.data.total
  }else if (res.code=== 501){
    ElMessage({
      type: 'error',
      message:res.message
    })
  }
}

onMounted(() => {
  getUserList()
})

//单个删除
const userDelete = async (user_id) => {
  const res = await removeUserAPI({user_id})
  if (res.code === 200){
    ElMessage({
      type: 'success',
      message: res.message,
    })
    await getUserListAPI()
  }else {
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
const userBatchDelete = async () => {
  const res = await removeUsersAPI({users_id:selectId.value})
  if (res.code === 200) {
    ElMessage({
      type: 'success',
      message: res.message
    })
    await getUserList()
  }else{
    ElMessage({
      type: 'error',
      message: res.message
    })
  }
}

//添加新用户
const addUser = async () => {
  Object.assign(userInfo,{ user_id:'', username: '', password: '' })
  drawerShow.value = true;
  nextTick(() => {
    formRef.value.clearValidate()
  })
}

//取消添加用户
const cancel = () => {
  drawerShow.value=false;
}

//保存(即添加用户)
const save = async () => {
  await formRef.value.validate();
  let res = await addNewUserAPI(userInfo)
  if (res.code===200){
    drawerShow.value=false
    ElMessage({
      type: 'success',
      message:res.message
    })
    await getUserList()
  }else{
    ElMessage({
      type: 'error',
      message: res.message
    })
  }
}

// 修改
const updateUser = (row) => {
  Object.assign(userInfo, {
    username: row.username,
    password: row.password,
    user_id: row.user_id,
  })
  nextTick(() => {
    formRef.value.clearValidate()
  })
  drawerShow.value = true
}

const checkAll = ref(false)
const isIndeterminate = ref(false)
const allRole = ref([])
const userRole = ref([])

//分配角色
const handleCheckAllChange = () => {

}
//角色全选
const handleCheckedRoleChange = () => {

}
</script>

<template>
  <div>

  <el-card style="height: 80px">
    <el-form inline class="form">
      <el-form-item label="用户名：">
        <el-input placeholder="请输入用户名" v-model="keyword"/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getUserList" :disabled="!keyword">
          搜索
        </el-button>
        <el-button @click="reset" :disabled="!keyword">重置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
  <el-card style="margin: 15px 0">
    <el-button type="primary" @click="addUser">添加</el-button>
    <el-button
        type="danger"
        @click="userBatchDelete"
    >
      批量删除
    </el-button>
    <el-table
        style="margin: 10px 0"
        border
        :data="tableData"
        @selection-change="selectChange"
    >
      <el-table-column type="selection"></el-table-column>
      <el-table-column label="id" width="80" prop="user_id"></el-table-column>
      <el-table-column label="用户姓名" prop="username"></el-table-column>
      <el-table-column label="用户角色" prop="role"></el-table-column>
      <el-table-column label="创建时间" prop="created_at"></el-table-column>
      <el-table-column label="更新时间" prop="updated_at"></el-table-column>
      <el-table-column label="操作" width="270">
        <template v-slot="{ row }">
          <el-button
              icon="User"
              size="small"
              type="primary"
          >
            分配角色
          </el-button>
          <el-button
              icon="Edit"
              size="small"
              type="success"
          >
            编辑
          </el-button>
          <el-popconfirm
              :title="`您确定删除${row.username}吗？`"
              width="250"
              @confirm="userDelete(row.user_id)"
          >
            <template #reference>
              <el-button icon="Delete" size="small" type="danger">
                删除
              </el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
        v-model:current-page="pageNo"
        v-model:page-size="pageSize"
        :page-sizes="[5, 10, 15, 20]"
        :background="false"
        layout="prev, pager, next, jumper, ->, sizes, total"
        :total="total"
        @size-change="getUserList"
        @current-change="getUserList"
    />
  </el-card>

      <!-- 添加、修改 -->
      <el-drawer v-model="drawerShow" direction="rtl" size="35%">
        <template #header>
          <h4>{{ userInfo.user_id ? '更新' : '添加' }}用户</h4>
        </template>
        <template #default>
          <el-form :model="userInfo" :rules="rules" ref="formRef">
            <el-form-item label="用户姓名:" prop="username">
              <el-input placeholder="请输入姓名" v-model="userInfo.username"/>
            </el-form-item>
            <el-form-item label="账号密码:" prop="password" v-if="!userInfo.user_id">
              <el-input placeholder="请输入密码" v-model="userInfo.password"/>
            </el-form-item>
          </el-form>
        </template>
        <template #footer>
          <div style="flex: auto">
            <el-button @click="cancel">取消</el-button>
            <el-button type="primary" @click="save">确定</el-button>
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
              <el-checkbox
                  v-model="checkAll"
                  :indeterminate="isIndeterminate"
                  @change="handleCheckAllChange"
              >
                全选
              </el-checkbox>
              <el-checkbox-group
                  v-model="userRole"
                  @change="handleCheckedRoleChange"
              >
                <el-checkbox v-for="item in allRole" :key="item.id" :label="item">
                  {{ item.roleName }}
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-form>
        </template>
        <template #footer>
          <div style="flex: auto">
            <el-button @click="colseRole">取消</el-button>
            <el-button
                type="primary"
                :disabled="!userRole.length"
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

</style>