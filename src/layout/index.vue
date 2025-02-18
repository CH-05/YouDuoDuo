<template>
  <div class="layout_container">
    <div class="layout_slider">
      <Logo></Logo>
      <el-scrollbar class="scrollbar">
        <el-menu
          :default-active="$route.path"
          background-color="#001529"
          text-color="white"
          active-text-color="#1890ff"
        >
          <Menu :menuList="userStore.menuRoutes"/>
        </el-menu>
      </el-scrollbar>
    </div>
    <div class="layout_tabbar">
      <Tabbar></Tabbar>
    </div>
    <div class="layout_main">
      <Main></Main>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import Logo from './logo/index.vue'
import Menu from './menu/index.vue'
import Main from './main/index.vue'
import Tabbar from './tabbar/index.vue'
import { useUserStore } from '@/stores/modules/user'

const route = useRoute()
const userStore = useUserStore()
</script>

<script>
export default {
  name: 'Layout',
}
</script>

<style scoped lang="scss">
.layout_container {
  width: 100%;
  height: 100vh;

  .layout_slider {
    width: $base-menu-width;
    height: 100vh;
    background: $base-menu-background;
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1;
    transition: all 0.3s;

    .scrollbar {
      width: 100%;
      height: calc(100vh - $base-menu-logo-height);
    }
  }

  .layout_tabbar {
    position: fixed;
    width: calc(100% - $base-menu-width);
    height: $base-tabbar-height;
    top: 0;
    left: $base-menu-width;
    z-index: 1;
  }

  .layout_main {
    position: relative;
    width: calc(100% - $base-menu-width);
    height: calc(100vh - $base-tabbar-height);
    background: #f0f2f5;
    margin-left: $base-menu-width;
    margin-top: $base-tabbar-height;
    padding: 15px;
    overflow: auto;
  }
}
</style>
