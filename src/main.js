import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// svg插件需要的配置代码
import 'virtual:svg-icons-register'
import App from '@/App.vue'
import globalComponent from '@/components'
// 路由
import router from '@/router'
// 仓库
import pinia from '@/stores'
// 路由鉴权文件
import './permission'
import '@/styles/index.scss'
//引入动态粒子效果
import Particles from "@tsparticles/vue3";
import {loadSlim} from "@tsparticles/slim";
//暗黑模式
import 'element-plus/theme-chalk/dark/css-vars.css'
import {zhCn} from "element-plus/es/locale/index";

// 路由鉴权文件
import './permission'
import '@/styles/index.scss'

const app = createApp(App)

// 注册ElementPlus，并且使用国际化语言为中文
app.use(ElementPlus, {
    locale: zhCn,
})
// 自定义全局组件
app.use(globalComponent)
app.use(Particles, {
    init: async engine => {
        await loadSlim(engine);
    },
})
app.use(router)
// 注册仓库
app.use(pinia)

app.mount('#app')
