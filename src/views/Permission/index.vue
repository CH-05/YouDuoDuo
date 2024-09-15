<template>
  <div>
    <el-card>
      <el-table border :data="tableData" row-key="id">
        <el-table-column label="名称" prop="name"></el-table-column>
        <el-table-column label="权限值" prop="code"></el-table-column>
        <el-table-column label="修改时间" prop="updateTime"></el-table-column>
        <el-table-column label="操作" width="300">
          <template v-slot="{ row }">
            <el-button
                icon="User"
                size="small"
                type="primary"
                :disabled="row.level === 4"
                @click="addMenu(row)"
            >
              {{ row.level === 3 ? '添加功能' : '添加菜单' }}
            </el-button>
            <el-button
                icon="Edit"
                size="small"
                type="success"
                :disabled="row.level === 1"
                @click="editMenu(row)"
            >
              编辑
            </el-button>
            <el-popconfirm
                :title="`您确定删除${row.name}吗？`"
                width="250"
                @confirm="deleteMenu(row.id)"
            >
              <template #reference>
                <el-button
                    icon="Delete"
                    size="small"
                    type="danger"
                    :disabled="row.level === 1"
                >
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加菜单 -->
    <el-dialog
        v-model="addMenuVisible"
        :title="`${menuParams.id ? '更新' : '添加'}菜单`"
        @close="addMenuCancel"
    >
      <el-form
          ref="formRef"
          label-width="100px"
          :model="menuParams"
          :rules="rules"
      >
        <el-form-item label="名称：" prop="name">
          <el-input v-model="menuParams.name" placeholder="请输入名称"/>
        </el-form-item>
        <el-form-item label="权限值：" prop="code">
          <el-input v-model="menuParams.code" placeholder="请输入权限值"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addMenuCancel">取消</el-button>
        <el-button type="primary" @click="addMenuConfirm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {nextTick, onMounted, reactive, ref} from 'vue'
import {ElMessage} from 'element-plus'
import {reqMenu} from "@/api/menu/index.js";

const tableData = ref([])
const addMenuVisible = ref(false)
const menuParams = reactive({
  id: '',
  name: '',
  code: '',
  level: '',
  pid: '',
})

onMounted(() => {
  getMenuList()
})

// 校验
const formRef = ref()
const validateName = (_rule, value, callback) => {
  if (value.trim().length >= 2) {
    callback()
  } else {
    callback(new Error('名称位数大于等于2位'))
  }
}
const validateCode = (_rule, value, callback) => {
  if (value.trim().length >= 2) {
    callback()
  } else {
    callback(new Error('权限值位数大于等于2位'))
  }
}
const rules = {
  name: [{required: true, trigger: 'blur', validator: validateName}],
  code: [{required: true, trigger: 'blur', validator: validateCode}],
}

// 菜单列表
const getMenuList = async () => {
  const result = await reqMenu()
  console.log(result);
  if (result.code === 200) {
    tableData.value = result.data
  }
}

// 添加菜单按钮
const addMenu = (row) => {
  addMenuVisible.value = true
  Object.assign(menuParams, {
    id: '',
    name: '',
    code: '',
    level: row.level + 1,
    pid: row.id,
  })
}

// 编辑菜单按钮
const editMenu = (row) => {
  addMenuVisible.value = true
  nextTick(() => {
    Object.assign(menuParams, {
      id: row.id,
      name: row.name,
      code: row.code,
      level: '',
      pid: '',
    })
  })
}

// 添加、编辑菜单确定
const addMenuConfirm = async () => {
  await formRef.value?.validate()
  const result = await reqAddOrUpdateMenu(menuParams)
  if (result.code === 200) {
    ElMessage({
      type: 'success',
      message: `${menuParams.id ? '编辑' : '新增'}成功`,
    })
    addMenuCancel()
    getMenuList()
  }
}

// 添加、编辑菜单取消
const addMenuCancel = () => {
  addMenuVisible.value = false
}

// 删除
const deleteMenu = async (id) => {
  const result = await reqRemoveMenu(id)
  if (result.code === 200) {
    ElMessage({
      type: 'success',
      message: '删除成功',
    })
    getMenuList()
  }
}
</script>

<style scoped lang="scss">
.form {
  display: flex;
  justify-content: space-between;
}
</style>
