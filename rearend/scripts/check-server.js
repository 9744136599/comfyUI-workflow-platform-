const axios = require('axios');

async function checkServer() {
  try {
    console.log('=== 检查服务器状态 ===');
    
    const baseURL = 'http://localhost:8000';
    
    // 1. 检查服务器是否运行
    console.log('\n1. 检查服务器连接...');
    try {
      const response = await axios.get(`${baseURL}/`);
      console.log('✓ 服务器运行正常');
      console.log('响应:', response.data);
    } catch (error) {
      console.log('✗ 服务器连接失败:', error.message);
      return;
    }
    
    // 2. 检查API路由
    console.log('\n2. 检查API路由...');
    try {
      const response = await axios.get(`${baseURL}/api/users/profile`, {
        headers: { Authorization: 'Bearer test' }
      });
      console.log('API路由正常');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✓ API路由正常 (需要认证)');
      } else {
        console.log('⚠ API路由可能有问题:', error.response?.status);
      }
    }
    
    // 3. 检查同步状态
    console.log('\n3. 检查同步状态...');
    try {
      const response = await axios.get(`${baseURL}/api/user-sync/sync-stats`);
      console.log('✓ 同步服务正常');
      console.log('同步统计:', response.data.data);
    } catch (error) {
      console.log('⚠ 同步服务可能有问题:', error.response?.data || error.message);
    }
    
    console.log('\n=== 检查完成 ===');
    
  } catch (error) {
    console.error('检查失败:', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  checkServer();
}

module.exports = { checkServer }; 