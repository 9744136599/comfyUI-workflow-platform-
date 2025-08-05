const userSyncService = require('../services/userSyncService');

async function testSync() {
  try {
    console.log('=== 测试用户同步功能 ===');
    
    // 测试手动同步
    console.log('\n1. 测试手动同步...');
    const result = await userSyncService.manualSync();
    console.log('同步结果:', result);
    
    // 测试登录验证
    console.log('\n2. 测试登录验证...');
    // 这里需要根据实际的用户名来测试
    const testUsername = 'EMP001'; // 假设存在这个用户
    const loginResult = await userSyncService.validateUserLogin(testUsername, '123456');
    if (loginResult.success) {
      console.log('✓ 登录验证成功:', loginResult.user.username);
    } else {
      console.log('⚠ 登录验证失败:', loginResult.message);
    }
    
    // 获取同步统计
    console.log('\n3. 获取同步统计...');
    const stats = await userSyncService.getSyncStats();
    console.log('同步统计:', stats);
    
    console.log('\n=== 测试完成 ===');
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testSync();
}

module.exports = { testSync }; 