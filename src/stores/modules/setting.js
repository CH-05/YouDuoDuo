import {defineStore} from 'pinia'

const useLayoutSettingStore = defineStore('settingStore', {
  state: () => {
    return {
      fold: false, // 控制菜单折叠开始收起
      refresh: false, // 刷新
    }
  },
})

export default useLayoutSettingStore
