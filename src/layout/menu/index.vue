<template>
  <template v-for="(item) in menuList" :key="item.path">
    <!-- 没有子路由 -->
    <template v-if="!item.children">
      <el-menu-item v-if="!item.meta.hidden" :index="item.path" @click="goRoute">
        <el-icon>
          <component :is="item.meta.icon"/>
        </el-icon>
        <template #title>
          <span>{{ item.meta.title }}</span>
        </template>
      </el-menu-item>
    </template>
    <!-- 有子路由但只有一个 -->
    <template v-if="item.children && item.children.length == 1">
      <el-menu-item v-if="!item.children[0].meta.hidden" :index="item.children[0].path" @click="goRoute">
        <el-icon>
          <component :is="item.children[0].meta.icon"/>
        </el-icon>
        <template #title>
          <span>{{ item.children[0].meta.title }}</span>
        </template>
      </el-menu-item>
    </template>
    <!-- 有子路由且个数大于一个 -->
    <el-sub-menu v-if="item.children && item.children.length > 1" :index="item.path">
      <template #title>
        <el-icon>
          <component :is="item.meta.icon"/>
        </el-icon>
        <span>{{ item.meta.title }}</span>
      </template>
      <Menu :menuList="item.children"/>
    </el-sub-menu>
  </template>
</template>

<script setup>
import { useRouter } from 'vue-router'

defineProps(['menuList'])

const router = useRouter()
const goRoute = (vc) => { 
  router.push(vc.index)
}
</script>

<script>
export default {
  name: 'Menu',
}
</script>

<style scoped lang="scss">
:deep(.el-menu) {
  border-right: none;
  
  .el-menu-item {
    height: 50px;
    line-height: 50px;
    
    &:hover {
      background-color: #343D4B;
      color: #ffffff !important;
    }
    
    &.is-active {
      background-color: #343D4B;
      border-left: 4px solid #FFB800;
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        width: 4px;
        height: 100%;
        background: #FFB800;
      }
    }
  }

  .el-sub-menu {
    .el-sub-menu__title {
      &:hover {
        background-color: #343D4B;
      }
    }
  }
}

// Logo 样式
:deep(.logo) {
  color: #FFB800;
  background: #2B3440;
  border-bottom: 1px solid #343D4B;
}
</style>
