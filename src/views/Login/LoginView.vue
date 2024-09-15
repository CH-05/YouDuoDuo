<script setup>
import {reactive, ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import useUserStore from "@/stores/modules/user.js";
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
  if (value.trim().length >= 1) {
    callback()
  } else {
    callback(new Error("账号长度至少为5位"))
  }
}
const validatePass = (rule, value, callback) => {
  if (value.trim().length >= 1) {
    callback()
  } else {
    callback(new Error("密码长度至少为6位"))
  }
}

const rules = reactive({
  username: [{validator: validateUsn, trigger: 'blur'}],
  password: [{validator: validatePass, trigger: 'blur'}],
})
const submitForm = async () => {
  await loginForms.value.validate()
  loading.value = true
  try {
    await userStore.userLogin(loginForm)
    const redirect = route.query.redirect
    console.log(redirect);
    router.push({path: redirect || '/'})
    //从仓库中拿数据
    ElMessage({type: 'success', message: "登录成功"})
    loading.value = false
  } catch (e) {
    ElMessage({
      message: "登录失败，请检查用户名和密码是否输入正确",
      type: 'error'
    })
    loading.value = false
  }
}
//重置输入框
const resetForm = (formEl) => {
  if (!formEl) return
  formEl.resetFields()
}

</script>

<template>
  <div id="bg" class="login-other">
    <vue-particles id="tsparticles" :options="particlesOption"/>
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
          <el-button type="primary" :loading="loading" @click="submitForm">
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