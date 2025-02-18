async getUserInfo() {
  const result = await getInfo()
  console.log("result",result)
  if (result.code === 200) {
    this.userInfo = result.data
    this.username = result.data.username
    this.avatar = result.data.avatar
    
    // 设置用户最高权限角色
    if (result.data.roles && result.data.roles.length > 0) {
      const highestRole = result.data.roles.reduce((prev, curr) => 
        parseInt(prev.role_id) < parseInt(curr.role_id) ? prev : curr
      )
      this.role = {
        id: parseInt(highestRole.role_id),
        name: highestRole.role_name
      }
    } else {
      this.role = {
        id: 999, // 设置一个较大的数值表示最低权限
        name: '普通用户'
      }
    }
    
    // 添加调试信息
    console.log('用户信息:', result.data)
  }
} 