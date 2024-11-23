<script setup>
import {onMounted, reactive, ref} from "vue";
import {addUserPermissionAPI, removeUserAPI} from "@/api/acl/user.js";
import {ElMessage} from "element-plus";
import useUserStore from "@/stores/modules/user.js";
import {getRoleListAPI, reqPermissionMenuAPI} from "@/api/acl/role.js";
import moment from "moment";

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
</script>

<template>
  <div>
    <el-card style="height: 80px">
      <el-form class="form" inline>
        <el-form-item label="角色名称：">
          <el-input v-model="keyword" placeholder="请输入角色名称"/>
        </el-form-item>
        <el-form-item>
          <el-button :disabled="!keyword" type="primary" @click="getRoleList">
            搜索
          </el-button>
          <el-button :disabled="!keyword" @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card style="margin: 15px 0">
      <el-table
          :data="tableData"
          border
          style="margin: 10px 0"
          @selection-change="selectChange"
      >
        <el-table-column label="id" prop="user_id" width="80"></el-table-column>
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
          :background="false"
          :page-sizes="[5, 10, 15, 20]"
          :total="total"
          layout="prev, pager, next, jumper, ->, sizes, total"
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
            :default-checked-keys="selectArr"
            :props="defaultProps"
            default-expand-all
            node-key="id"
            show-checkbox
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

<style lang="scss" scoped>

</style>