const { sequelize, connectDB, initModels } = require('./database/database');
const bcrypt = require('bcryptjs');

async function testPasswordFix() {
  try {
    console.log('=== 测试密码修复 ===');
    
    // 连接数据库
    await connectDB();
    initModels();
    
    // 1. 查看现有用户
    console.log('\n1. 查看现有用户...');
    const [users] = await sequelize.query('SELECT id, username, email FROM users');
    console.log('用户列表:', users.map(u => ({ id: u.id, username: u.username, email: u.email })));
    
    // 2. 修复所有用户密码为123456
    console.log('\n2. 修复用户密码...');
    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    for (const userData of users) {
      await sequelize.query(
        'UPDATE users SET password = ? WHERE id = ?',
        {
          replacements: [hashedPassword, userData.id],
          type: sequelize.QueryTypes.UPDATE
        }
      );
      console.log(`✓ 修复用户 ${userData.username} 的密码为: ${newPassword}`);
    }
    
    // 3. 验证修复结果
    console.log('\n3. 验证修复结果...');
    const [updatedUsers] = await sequelize.query('SELECT id, username, password FROM users');
    
    for (const userData of updatedUsers) {
      const isMatch = await bcrypt.compare(newPassword, userData.password);
      console.log(`用户 ${userData.username}: ${isMatch ? '✓ 密码正确' : '✗ 密码错误'}`);
    }
    
    await sequelize.close();
    console.log('\n=== 修复完成 ===');
    console.log(`所有用户密码已设置为: ${newPassword}`);
    console.log('现在可以使用以下账号登录:');
    users.forEach(user => {
      console.log(`- 用户名: ${user.username}, 密码: ${newPassword}`);
    });
    
  } catch (error) {
    console.error('修复失败:', error);
  }
}

testPasswordFix(); 