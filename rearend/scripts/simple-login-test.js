const { sequelize, connectDB, initModels } = require('../database/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function simpleLoginTest() {
  try {
    console.log('=== 简单登录测试 ===');
    
    // 连接数据库
    await connectDB();
    initModels();
    
    // 获取User模型
    const User = require('../models/user.model');
    
    // 1. 检查用户表
    console.log('\n1. 检查用户表...');
    const [columns] = await sequelize.query('DESCRIBE users');
    console.log('users表字段:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    // 2. 检查现有用户
    console.log('\n2. 检查现有用户...');
    const [users] = await sequelize.query('SELECT id, username, email FROM users LIMIT 5');
    console.log('现有用户:', users);
    
    if (users.length === 0) {
      console.log('没有用户，创建一个测试用户...');
      
      // 创建测试用户
      const hashedPassword = await bcrypt.hash('123456', 10);
      await User.create({
        username: 'test001',
        email: 'test001@company.com',
        password: hashedPassword,
        credits: 100
      });
      console.log('✓ 测试用户创建成功');
    }
    
    // 3. 测试登录
    console.log('\n3. 测试登录...');
    const testUsername = users.length > 0 ? users[0].username : 'test001';
    console.log(`测试用户名: ${testUsername}`);
    
    const user = await User.findOne({ where: { username: testUsername } });
    
    if (!user) {
      console.log('✗ 用户不存在');
      return;
    }
    
    // 验证密码
    const isMatch = await bcrypt.compare('123456', user.password);
    if (isMatch) {
      console.log('✓ 密码验证成功');
      
      // 生成JWT
      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      
      console.log('✓ JWT生成成功');
      console.log('用户信息:', {
        id: user.id,
        username: user.username,
        email: user.email,
        credits: user.credits
      });
      console.log('Token:', token.substring(0, 50) + '...');
      
    } else {
      console.log('✗ 密码验证失败');
    }
    
    await sequelize.close();
    console.log('\n=== 测试完成 ===');
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  simpleLoginTest();
}

module.exports = { simpleLoginTest }; 