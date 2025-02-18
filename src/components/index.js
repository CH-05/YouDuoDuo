// 自定义插件 (统一注册全局组件)
import SvgIcon from './SvgIcon/index.vue'
// element-plus提供的所有图标组件
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const allGlobalComponent = { SvgIcon }

export default {
    install(app) {
        // 添加判断，避免重复注册
        Object.keys(allGlobalComponent).forEach((key) => {
            if (!app._context.components[key]) {
                app.component(key, allGlobalComponent[key])
            }
        })
        
        // element-plus图标也添加判断
        for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
            if (!app._context.components[key]) {
                app.component(key, component)
            }
        }
    },
}
