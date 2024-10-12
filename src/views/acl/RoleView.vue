<script setup>
import {nextTick, onMounted, reactive, ref, shallowReactive, toRaw, watch, watchEffect} from "vue";
import {addOrUpdateNewUserAPI, removeUserAPI, removeUsersAPI, setUserRoleAPI} from "@/api/acl/user.js";
import {ElMessage} from "element-plus";
import useUserStore from "@/stores/modules/user.js";
import {getRoleListAPI, reqPermissionMenuAPI} from "@/api/acl/role.js";

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
const menuData =ref([])

//用户基本信息
const roleParams = reactive({
  id: '',
  name: '',
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
  username: [{required: true, validator: validateUserName, trigger: 'blur'}],
  password: [{required: true, validator: validatePassword, trigger: 'blur'}],
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
  const user_id = row.user_id
  if (currentRoleId > roleId) {
    drawerShow.value = true
    //获取当前点击用户拥有哪些权限
    const res = await reqPermissionMenuAPI(user_id)
    if (res.code === 200) {

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
//用户修改权限分配
const setRole = async () => {
  const user_id = roleParams.user_id
  const roleId = userRole.value.id
  if (roleId !== roleParams.role.id) {
    const res = await setUserRoleAPI({user_id, role: userRole.value})
    if (res.code === 200) {
      ElMessage({
        type: 'success',
        message: res.message
      })
      roleShow.value = false;
      await getRoleList()
    }
    console.log(res);
  } else {
    ElMessage({
      type: 'info',
      message: '未执行任何操作'
    })
    roleShow.value = false
  }
}
</script>

<template>
  <div>
    <el-card style="height: 80px">
      <el-form inline class="form">
        <el-form-item label="角色名称：">
          <el-input placeholder="请输入角色名称" v-model="keyword"/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getRoleList" :disabled="!keyword">
            搜索
          </el-button>
          <el-button @click="reset" :disabled="!keyword">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card style="margin: 15px 0">
      <el-table
          style="margin: 10px 0"
          border
          :data="tableData"
          @selection-change="selectChange"
      >
        <el-table-column label="id" width="80" prop="user_id"></el-table-column>
        <el-table-column label="用户角色" prop="role.name"></el-table-column>
        <el-table-column label="创建时间" prop="created_at"></el-table-column>
        <el-table-column label="更新时间" prop="updated_at"></el-table-column>
        <el-table-column label="操作" width="270">
          <template v-slot="{ row }">
            <el-button
                icon="User"
                size="small"
                type="primary"
                @click="addPermission(row)"
            >
              分配权限
            </el-button>
            <el-popconfirm
                :title="`您确定删除${row.name}吗？`"
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
          @size-change="getRoleList"
          @current-change="getRoleList"
      />
    </el-card>

    <!-- 分配权限 -->
    <el-drawer v-model="drawerShow" direction="rtl" size="30%">
      <template #header>
        <h4>分配权限</h4>
      </template>
      <template #default>
        <el-tree
            ref="treeRef"
            :data="menuData"
            show-checkbox
            node-key="id"
            default-expand-all
            :props="defaultProps"
        />
      </template>
      <template #footer>
        <div style="flex: auto">
          <el-button @click="roleCancel">取消</el-button>
          <el-button type="primary" @click="roleSave">确定</el-button>
        </div>
      </template>
    </el-drawer>
  </div>

</template>

<style scoped lang="scss">

</style>