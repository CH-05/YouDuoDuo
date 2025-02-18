<template>
  <div class="home">
    <div>
      <el-card>
        <div class="box">
          <img :src="userStore.avatar" alt="" class="avatar" />
          <div class="bottom">
            <h3 class="title">{{ getTime() }}好呀{{ userStore.username }}</h3>
            <p class="subtitle">油多多管理平台</p>
          </div>
        </div>
      </el-card>
      <div class="bottoms">
        <svg-icon name="welcome" width="600px" height="300px"></svg-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getTime } from '@/utils/time'
import { useUserStore } from '@/stores/modules/user'

//获取用户仓库
const userStore = useUserStore()
</script>

<style scoped lang="scss">
.home {
  width: 100%;
  height: 100%;
}

.box {
  display: flex;

  .avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
  }

  .bottom {
    margin-left: 20px;

    .title {
      font-size: 30px;
      font-weight: 900;
      margin-bottom: 30px;
    }

    .subtitle {
      font-style: italic;
      color: skyblue;
    }
  }
}
.bottoms {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}
</style>
