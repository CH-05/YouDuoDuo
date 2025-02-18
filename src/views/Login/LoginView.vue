<script setup>
import {onMounted, onUnmounted, reactive, ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useUserStore} from "@/stores/modules/user.js";
import {particlesOption} from "@/config/particlesOption.js";
import {ElMessage} from "element-plus";


const loading = ref(false)
const loginForms = ref()
//初始化用户名及密码
const loginForm = reactive({
  username: '',
  password: '',
})
const router = useRouter()
const userStore = useUserStore()
const route = useRoute()


const validateUsn = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入用户名'))
  } else if (value.length < 3) {
    callback(new Error('用户名长度不能小于3个字符'))
  } else {
    callback()
  }
}

const validatePass = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入密码'))
  } else if (value.length < 6) {
    callback(new Error('密码长度不能小于6个字符'))
  } else {
    callback()
  }
}

const rules = reactive({
  username: [{validator: validateUsn, trigger: 'blur'}],
  password: [{validator: validatePass, trigger: 'blur'}]
})

const submitForm = async () => {
  if (!loginForms.value) return
  
  try {
    await loginForms.value.validate()
    loading.value = true
    await userStore.userLogin(loginForm)
    const redirect = route.query.redirect
    router.push({path: redirect || '/'})
    ElMessage({
      type: 'success',
      message: '登录成功'
    })
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage({
      type: 'error',
      message: error.message || '登录失败，请检查用户名和密码'
    })
  } finally {
    loading.value = false
  }
}

//重置输入框
const resetForm = () => {
  if (!loginForms.value) return
  loginForms.value.resetFields()
}

//键盘enter键入时登录
const keyDown = (e) => {
  if (e.keyCode === 13) {
    submitForm()
  }
}

// 页面挂载时
onMounted(() => {
  //绑定监听事件
  window.addEventListener('keydown', keyDown)
})

//页面卸载时
onUnmounted(() => {
  window.removeEventListener('keydown', keyDown, false)
})


</script>

<template>
  <div id="bg" class="login-other">
    <vue-particles id="tsparticles" :options="particlesOption" />
    <el-form
        class="loginContainer"
        ref="loginForms"
        :model="loginForm"
        :rules="rules"
        label-width="auto"
        status-icon
    >
      <h2 class="loginTitle">登录</h2>
      <el-form-item label="用户名:" prop="username">
        <el-input v-model="loginForm.username" type="text"></el-input>
      </el-form-item>
      <el-form-item label="密码:" prop="password">
        <el-input v-model="loginForm.password" autocomplete="off" type="password"/>
      </el-form-item>
      <el-row justify="center">
        <el-form-item>
          <el-button type="primary" :loading="loading" @keydown.enter="keyDown()" @click="submitForm">
            登录
          </el-button>
          <el-button style="margin-right: 15px" @click="resetForm(loginForms)">重置</el-button>
          <h5>没有账号，
            <router-link :to="{name: 'register'}" style="color:#409EFF">去注册</router-link>
          </h5>
        </el-form-item>
      </el-row>
    </el-form>
  </div>
</template>

<style scoped>
.login-other {
  z-index: 100;
  margin: 180px 0 0 calc(calc(100vw - 410px) / 2);
  position: absolute;
}

.loginContainer {
  border-radius: 15px;
  background-clip: padding-box;
  width: 350px;
  padding: 15px 35px 15px 35px;
  background: #fefefe;
  border: 1px solid #eaeaea;
  box-shadow: 0 0 25px #cac6c6;
}

.loginTitle {
  margin: 15px auto 20px auto;
  text-align: center;
  color: #707070;
}
</style>