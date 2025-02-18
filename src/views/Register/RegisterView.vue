<script setup>
import {onMounted, onUnmounted, reactive, ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import {ElMessage} from "element-plus";
import {particlesOption} from "@/config/particlesOption.js";
import {useUserStore} from "@/stores/modules/user.js";

const ruleFormRef = ref()
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
})
const router = useRouter();
const userStore = useUserStore()
const loading = ref(false)
const registerForms = ref()
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
    if (registerForm.confirmPassword) {
      registerForms.value?.validateField('confirmPassword')
    }
    callback()
  }
}

const validatePass2 = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = reactive({
  username: [{validator: validateUsn, trigger: 'blur'}],
  password: [{validator: validatePass, trigger: 'blur'}],
  confirmPassword: [{validator: validatePass2, trigger: 'blur'}]
})

const submitForm = async () => {
  if (!registerForms.value) return
  
  try {
    await registerForms.value.validate()
    loading.value = true
    await userStore.userRegister(registerForm)
    ElMessage({
      type: 'success',
      message: '注册成功，请登录'
    })
    router.push('/login')
  } catch (error) {
    console.error('注册失败:', error)
    ElMessage({
      type: 'error',
      message: error.message || '注册失败，请重试'
    })
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  if (!registerForms.value) return
  registerForms.value.resetFields()
}

const keyDown = (e) => {
  if (e.keyCode === 13) {
    submitForm()
  }
}

onMounted(() => {
  window.addEventListener('keydown', keyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', keyDown, false)
})
</script>

<template>
  <div id="bg" class="register-other">
    <vue-particles id="tsparticles" :options="particlesOption"/>
    <el-form
        ref="registerForms"
        :model="registerForm"
        :rules="rules"
        class="registerContainer"
        label-width="auto"
        status-icon
    >
      <h2 class="registerTitle">注册</h2>
      <el-form-item label="用户名:" prop="username">
        <el-input v-model="registerForm.username" type="text" placeholder="请输入用户名"></el-input>
      </el-form-item>
      <el-form-item label="密码:" prop="password">
        <el-input v-model="registerForm.password" autocomplete="off" type="password" placeholder="请输入密码"/>
      </el-form-item>
      <el-form-item label="确认密码:" prop="confirmPassword">
        <el-input
            v-model="registerForm.confirmPassword"
            autocomplete="off"
            type="password"
            placeholder="请再次输入密码"
        />
      </el-form-item>
      <el-row justify="center">
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="submitForm" @keydown.enter="keyDown()">
            注册
          </el-button>
          <el-button style="margin-right: 15px" @click="resetForm(ruleFormRef)">重置</el-button>
          <h5>已有账号，
            <router-link :to="{name: 'login'}" style="color:#409EFF">去登录</router-link>
          </h5>
        </el-form-item>
      </el-row>
    </el-form>
  </div>
</template>

<style scoped>
.register-other {
  z-index: 100;
  margin: 180px 0 0 calc(calc(100vw - 410px) / 2);
  position: absolute;
}

.registerContainer {
  border-radius: 15px;
  background-clip: padding-box;
  width: 350px;
  padding: 15px 35px 15px 35px;
  background: #fefefe;
  border: 1px solid #eaeaea;
  box-shadow: 0 0 25px #cac6c6;
}

.registerTitle {
  margin: 15px auto 20px auto;
  text-align: center;
  color: #707070;
}

.el-button {
  margin: 10px 0;
}

h5 {
  margin: 10px 0;
  text-align: center;
  font-weight: normal;
}

.el-form-item {
  margin-bottom: 20px;
}

.el-input {
  width: 100%;
}
</style>