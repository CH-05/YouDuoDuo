<script setup>
import {reactive, ref} from "vue";
import {useRouter} from "vue-router";
import {useUserStore} from "@/stores/user.js";
import {ElMessage} from "element-plus";
import {particlesOption} from "@/config/particlesOption.js";
import {registerAPI} from "@/api/user.js";

const ruleFormRef = ref()
const ruleForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
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
    if (ruleForm.confirmPassword !== '') {
      if (!ruleFormRef.value) return
      ruleFormRef.value.validateField('confirmPassword', () => null)
    }
    callback()
  }
}
const validatePass2 = (rule, value, callback) => {
  if (value.trim() === '') {
    callback(new Error('请再次输入密码！'))
  } else if (value !== ruleForm.password) {
    callback(new Error("两次密码不一致！！！"))
  } else {
    callback()
  }
}

const rules = reactive({
  username: [{validator: validateUsn, trigger: 'blur'}],
  password: [{validator: validatePass, trigger: 'blur'}],
  confirmPassword: [{validator: validatePass2, trigger: 'blur'}],
})

const router = useRouter();
const userStore = useUserStore()

const submitForm = (formEl) => {
  const data = ruleForm;
  if (!formEl) return
  formEl.validate(async (valid) => {
    if (valid) {
      try {
        // await userStore.getUserRegisterInfo(data)
        let res = await registerAPI({username:ruleForm.username,password:ruleForm.password});
        console.log(res);
        ElMessage({
          message: '注册成功！,请登录',
          type: 'success'
        })
        await router.push('/user/login')
      }catch (e) {
        ElMessage({
          message: '用户名已被占用',
          type: 'error'
        })
      }
    }
  })
}

const resetForm = (formEl) => {
  if (!formEl) return
  formEl.resetFields()
}
</script>

<template>
  <div id="bg" class="register-other">
    <vue-particles id="tsparticles" :options="particlesOption" />
      <el-form
          ref="ruleFormRef"
          :model="ruleForm"
          :rules="rules"
          class="registerContainer"
          label-width="auto"
          status-icon
      >
        <h2 class="registerTitle">注册</h2>
          <el-form-item label="用户名" prop="username">
            <el-input v-model="ruleForm.username" type="text"></el-input>
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="ruleForm.password" autocomplete="off" type="password"/>
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
                v-model="ruleForm.confirmPassword"
                autocomplete="off"
                type="password"
            />
          </el-form-item>
        <el-row justify="center">
          <el-form-item>
            <el-button type="primary" @click="submitForm(ruleFormRef)"
            >注册
            </el-button
            >
            <el-button @click="resetForm(ruleFormRef)">重置</el-button>
            <div>已有账号，
              <router-link :to="{name: 'login'}" style="color:#409EFF">点击登录</router-link>
            </div>
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
</style>