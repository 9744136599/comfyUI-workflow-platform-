const axios = require('axios');

async function testApiLogin() {
  try {
    console.log('=== API登录测试 ===');
    
    const baseURL = 'http://localhost:8000/api';
    
    // 测试数据
    const testCases = [
      { username: 'haers111', password: '2213213' },
      { username: 'haers111', password: '123456' },
      { username: 'debug_test', password: '2213213' },
      { username: 'test001', password: '123456' }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n测试: ${testCase.username} / ${testCase.password}`);
      
      try {
        const response = await axios.post(`${baseURL}/users/login`, testCase);
        
        if (response.data.success) {
          console.log('✓ 登录成功');
          console.log('用户信息:', response.data.data.user);
          console.log('Token:', response.data.data.token.substring(0, 50) + '...');
        } else {
          console.log('✗ 登录失败:', response.data.error);
        }
        
      } catch (error) {
        if (error.response) {
          console.log(`✗ HTTP ${error.response.status}: ${error.response.data.error || error.response.data.message}`);
        } else {
          console.log('✗ 网络错误:', error.message);
        }
      }
    }
    
    console.log('\n=== 测试完成 ===');
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testApiLogin(); 