/*
* main:主入口文件*/
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router/index.js'
import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus'
//引入动态粒子效果
import Particles from "@tsparticles/vue3";
import { loadSlim } from "@tsparticles/slim";

const app = createApp(App)

app.use(ElementPlus)
app.use(Particles, {
    init: async engine => {
        await loadSlim(engine);
    },
})
app.use(createPinia())
app.use(router)

app.mount('#app')
