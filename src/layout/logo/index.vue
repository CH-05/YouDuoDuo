<template>
  <div class="logo" v-if="setting.logoHidden">
    <img :src="setting.logo" alt="" />
    <p v-if="!layoutSettingStore.fold">{{ setting.title }}</p>
  </div>
</template>

<script setup>
import setting from '@/setting'
import useLayoutSettingStore from '@/stores/modules/setting'
const layoutSettingStore = useLayoutSettingStore()
</script>

<script>
export default {
  name: 'Logo',
}
</script>

<style scoped lang="scss">
.logo {
  width: 100%;
  height: $base-menu-logo-height;
  color: white;
  display: flex;
  align-items: center;
  padding: 10px;
  img {
    width: 40px;
    height: 40px;
  }
  p {
    font-size: $base-logo-title-fontSize;
    margin-left: 10px;
    white-space: nowrap;
  }
}
</style>
