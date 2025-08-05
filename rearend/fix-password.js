const { sequelize, connectDB, initModels } = require('./database/database');
const bcrypt = require('bcryptjs');

async function fixPassword() {
  try {
    console.log('=== 修复密码问题 ===');
    
    // 连接数据库
    await connectDB();
    initModels();
    
    // 1. 查看现有用户
    console.log('\n1. 查看现有用户...');
    const [users] = await sequelize.query('SELECT id, username, email FROM users');
    console.log('用户列表:', users);
    
    // 2. 直接使用SQL更新密码，绕过模型hooks
    console.log('\n2. 修复用户密码...');
    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log(`新密码: ${newPassword}`);
    console.log(`密码哈希: ${hashedPassword.substring(0, 20)}...`);
    
    // 直接更新数据库，不触发模型hooks
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
    
    // 4. 创建测试用户（不使用模型hooks）
    console.log('\n4. 创建测试用户...');
    const testUsername = 'test_fix';
    const testPassword = '123456';
    const testHashedPassword = await bcrypt.hash(testPassword, 10);
    
    // 直接插入数据库
    await sequelize.query(
      'INSERT INTO users (username, email, password, credits, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      {
        replacements: [testUsername, 'test_fix@company.com', testHashedPassword, 100],
        type: sequelize.QueryTypes.INSERT
      }
    );
    
    console.log(`✓ 测试用户创建成功: ${testUsername} / ${testPassword}`);
    
    // 5. 验证测试用户
    const [testUser] = await sequelize.query(
      'SELECT id, username, password FROM users WHERE username = ?',
      {
        replacements: [testUsername],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (testUser.length > 0) {
      const isMatch = await bcrypt.compare(testPassword, testUser[0].password);
      console.log(`测试用户验证: ${isMatch ? '✓ 成功' : '✗ 失败'}`);
    }
    
    await sequelize.close();
    console.log('\n=== 修复完成 ===');
    console.log('所有用户密码已修复为: 123456');
    console.log('测试用户: test_fix / 123456');
    
  } catch (error) {
    console.error('修复失败:', error);
  }
}

fixPassword(); 