const axios = require('axios');

async function testLogin() {
  try {
    console.log('=== 测试登录功能 ===');
    
    const baseURL = 'http://localhost:8000/api';
    
    // 测试登录
    console.log('\n1. 测试登录...');
    const loginData = {
      username: 'EMP001', // 使用工号作为用户名
      password: '123456'
    };
    
    console.log('登录数据:', loginData);
    
    const response = await axios.post(`${baseURL}/users/login`, loginData);
    
    if (response.data.success) {
      console.log('✓ 登录成功');
      console.log('用户信息:', response.data.data.user);
      console.log('Token:', response.data.data.token.substring(0, 50) + '...');
    } else {
      console.log('✗ 登录失败:', response.data.error);
    }
    
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testLogin();
}

module.exports = { testLogin }; 