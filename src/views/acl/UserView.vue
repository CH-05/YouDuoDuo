<script setup>

</script>

<template>
  <el-card style="height: 80px">
    <el-form inline class="form">
      <el-form-item label="用户名：">
        <el-input placeholder="请输入用户名" v-model="keyword"/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getUserList" :disabled="!keyword">
          搜索
        </el-button>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
  <el-card style="margin: 15px 0px">
    <el-button type="primary" @click="addUser">添加</el-button>
    <el-button
        type="danger"
        :disabled="!selectIdArr.length"
        @click="userBatchDelete"
    >
      批量删除
    </el-button>
    <el-table
        style="margin: 10px 0px"
        border
        :data="tableData"
        @selection-change="selectChange"
    >
      <el-table-column type="selection"></el-table-column>
      <el-table-column label="id" width="80" prop="id"></el-table-column>
      <el-table-column label="用户姓名" prop="username"></el-table-column>
      <el-table-column label="用户昵称" prop="name"></el-table-column>
      <el-table-column label="用户角色" prop="roleName"></el-table-column>
      <el-table-column label="创建时间" prop="createTime"></el-table-column>
      <el-table-column label="更新时间" prop="updateTime"></el-table-column>
      <el-table-column label="操作" width="270">
        <template v-slot="{ row }">
          <el-button
              icon="User"
              size="small"
              type="primary"
              @click="clickRoleBtn(row)"
          >
            分配角色
          </el-button>
          <el-button
              icon="Edit"
              size="small"
              type="success"
              @click="updateUser(row)"
          >
            编辑
          </el-button>
          <el-popconfirm
              :title="`您确定删除${row.username}吗？`"
              width="250"
              @confirm="userDelete(row.id)"
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
        background
        layout="prev, pager, next, jumper, ->, sizes, total"
        :total="total"
        @size-change="getUserList"
        @current-change="getUserList"
    />
  </el-card>

  <!-- 添加、修改 -->
  <el-drawer v-model="drawerShow" direction="rtl" size="35%">
    <template #header>
      <h4>{{ userParams.id ? '更新' : '添加' }}用户</h4>
    </template>
    <template #default>
      <el-form :model="userParams" :rules="rules" ref="formRef">
        <el-form-item label="用户姓名:" prop="username">
          <el-input placeholder="请输入姓名" v-model="userParams.username"/>
        </el-form-item>
        <el-form-item label="用户昵称:" prop="name">
          <el-input placeholder="请输入昵称" v-model="userParams.name"/>
        </el-form-item>
        <el-form-item label="账号密码:" prop="password" v-if="!userParams.id">
          <el-input placeholder="请输入密码" v-model="userParams.password"/>
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

  <!-- 分配角色 -->
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
              v-model="userParams.username"
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

</template>

<style scoped lang="scss">

</style>