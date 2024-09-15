<script setup>
import {reactive, ref} from "vue";
import {useRouter} from "vue-router";
import {useUserStore} from "@/stores/user.js";
import {ElMessage} from "element-plus";
import {particlesOption} from "@/config/particlesOption.js";
import {loginAPI} from "@/api/user.js";

const ruleFormRef = ref()
//初始化用户名及密码
const ruleForm = reactive({
  username: '',
  password: '',
})

const validateUsn = (rule, value, callback) => {
  if (value.trim() === '') {
    callback(new Error('请输入用户名！'))
  } else {
    if (ruleForm.username !== '') {
      callback()
    }
  }
}
const validatePass = (rule, value, callback) => {
  if (value.trim() === '') {
    callback(new Error('请输入密码！'))
  } else {
    callback()
  }
}

const rules = reactive({
  username: [{validator: validateUsn, trigger: 'blur'}],
  password: [{validator: validatePass, trigger: 'blur'}],
})

const router = useRouter()
const userStore = useUserStore()

const submitForm = (formEl) => {
  formEl.validate(async (valid) => {
    if (valid) {
      try {
        //从仓库中拿数据
        // await userStore.getUserLoginInfo(ruleForm);
        let res = await loginAPI({username:ruleForm.username,password:ruleForm.password})
        console.log("res",res);
        ElMessage({type: 'success', message: "登录成功咯~~~"})
        await router.replace('/home')
      } catch (e) {
        ElMessage({
          message: "登录失败，请检查用户名密码是否输入正确",
          type: 'error'
        })
      }
    }
  })
}
//重置输入框
const resetForm = (formEl) => {
  if (!formEl) return
  formEl.resetFields()
}

</script>

<template>
  <div id="bg" class="login-other">
    <vue-particles id="tsparticles" :options="particlesOption" />
    <el-form
        class="loginContainer"
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="rules"
        label-width="auto"
        status-icon
    >
      <h2 class="loginTitle">登录</h2>
      <el-form-item label="用户名:" prop="username">
        <el-input v-model="ruleForm.username" type="text"></el-input>
      </el-form-item>
      <el-form-item label="密码:" prop="password">
        <el-input v-model="ruleForm.password" autocomplete="off" type="password"/>
      </el-form-item>
      <el-row justify="center">
        <el-form-item>
          <el-button type="primary" @click="submitForm(ruleFormRef)">
            登录
          </el-button>
          <el-button style="margin-right: 15px" @click="resetForm(ruleFormRef)">重置</el-button>
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