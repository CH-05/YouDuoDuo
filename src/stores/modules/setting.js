import {defineStore} from 'pinia'
import { ref } from 'vue'

const useLayoutSettingStore = defineStore('Setting', () => {
  const dark = ref(localStorage.getItem('theme-dark') === 'true')
  
  // 设置暗黑模式
  const setDark = (isDark) => {
    dark.value = isDark
    localStorage.setItem('theme-dark', isDark)
  }

  return {
    color: '',
    dark,
    fold: false, // 控制菜单折叠开始收起
    refresh: false, // 刷新
    setDark
  }
}, {
  persist: true
})

export default useLayoutSettingStore
