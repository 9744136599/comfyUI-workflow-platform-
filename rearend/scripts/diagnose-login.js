const userSyncService = require('../services/userSyncService');
const { sequelize, connectDB, initModels } = require('../database/database');

async function diagnoseLogin() {
  try {
    console.log('=== 登录问题诊断 ===');
    
    // 1. 连接数据库
    console.log('\n1. 连接数据库...');
    await connectDB();
    initModels();
    console.log('✓ 数据库连接成功');
    
    // 2. 检查用户表结构
    console.log('\n2. 检查users表结构...');
    const [columns] = await sequelize.query('DESCRIBE users');
    console.log('users表字段:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : ''}`);
    });
    
    // 3. 检查用户数量
    console.log('\n3. 检查用户数量...');
    const [userCount] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    console.log(`用户总数: ${userCount[0].count}`);
    
    if (userCount[0].count > 0) {
      // 4. 查看前几个用户
      console.log('\n4. 查看前3个用户...');
      const [users] = await sequelize.query('SELECT id, username, email, credits FROM users LIMIT 3');
      users.forEach((user, index) => {
        console.log(`  用户${index + 1}:`, user);
      });
      
      // 5. 测试登录验证
      console.log('\n5. 测试登录验证...');
      const testUsername = users[0]?.username;
      if (testUsername) {
        console.log(`测试用户名: ${testUsername}`);
        const loginResult = await userSyncService.validateUserLogin(testUsername, '123456');
        if (loginResult.success) {
          console.log('✓ 登录验证成功');
          console.log('用户信息:', loginResult.user);
        } else {
          console.log('✗ 登录验证失败:', loginResult.message);
        }
      }
    } else {
      console.log('⚠ 没有用户数据，需要先同步用户');
    }
    
    // 6. 测试外部数据库连接
    console.log('\n6. 测试外部数据库连接...');
    try {
      const connection = await userSyncService.connectToExternalDB();
      const [tables] = await connection.execute('SHOW TABLES');
      console.log('外部数据库表:', tables.map(t => Object.values(t)[0]));
      
      if (tables.some(t => Object.values(t)[0] === 'sys_user')) {
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM sys_user');
        console.log(`sys_user表记录数: ${rows[0].count}`);
        
        if (rows[0].count > 0) {
          const [sampleData] = await connection.execute('SELECT * FROM sys_user LIMIT 3');
          console.log('示例数据:');
          sampleData.forEach((row, index) => {
            console.log(`  记录${index + 1}:`, row);
          });
        }
      }
      
      await connection.end();
    } catch (error) {
      console.error('外部数据库连接失败:', error.message);
    }
    
    await sequelize.close();
    console.log('\n=== 诊断完成 ===');
    
  } catch (error) {
    console.error('诊断失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  diagnoseLogin();
}

module.exports = { diagnoseLogin }; 