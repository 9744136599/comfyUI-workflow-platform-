const { sequelize, connectDB, initModels } = require('./database/database');
const bcrypt = require('bcryptjs');

async function debugPassword() {
  try {
    console.log('=== 密码调试 ===');
    
    // 连接数据库
    await connectDB();
    initModels();
    
    // 获取User模型
    const User = require('./models/user.model');
    
    // 1. 查看用户和密码哈希
    console.log('\n1. 查看用户密码哈希...');
    const [users] = await sequelize.query('SELECT id, username, email, password FROM users LIMIT 3');
    
    users.forEach((user, index) => {
      console.log(`用户${index + 1}:`);
      console.log(`  - ID: ${user.id}`);
      console.log(`  - 用户名: ${user.username}`);
      console.log(`  - 邮箱: ${user.email}`);
      console.log(`  - 密码哈希: ${user.password.substring(0, 20)}...`);
      console.log(`  - 密码长度: ${user.password.length}`);
    });
    
    // 2. 测试不同密码
    console.log('\n2. 测试密码验证...');
    const testPasswords = ['123456', '2213213', 'password', 'admin'];
    
    for (const userData of users) {
      console.log(`\n测试用户: ${userData.username}`);
      
      for (const testPassword of testPasswords) {
        const isMatch = await bcrypt.compare(testPassword, userData.password);
        console.log(`  - 密码 "${testPassword}": ${isMatch ? '✓ 匹配' : '✗ 不匹配'}`);
      }
    }
    
    // 3. 创建测试用户
    console.log('\n3. 创建测试用户...');
    const testUsername = 'debug_test';
    const testPassword = '2213213';
    
    // 检查是否已存在
    const existingUser = await User.findOne({ where: { username: testUsername } });
    if (existingUser) {
      console.log('删除已存在的测试用户...');
      await existingUser.destroy();
    }
    
    // 创建新用户
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const newUser = await User.create({
      username: testUsername,
      email: 'debug_test@company.com',
      password: hashedPassword,
      credits: 100
    });
    
    console.log('✓ 测试用户创建成功');
    console.log(`用户名: ${testUsername}`);
    console.log(`密码: ${testPassword}`);
    console.log(`密码哈希: ${hashedPassword.substring(0, 20)}...`);
    
    // 4. 立即测试登录
    console.log('\n4. 测试新用户登录...');
    const testUser = await User.findOne({ where: { username: testUsername } });
    
    if (testUser) {
      const isMatch = await bcrypt.compare(testPassword, testUser.password);
      console.log(`密码验证结果: ${isMatch ? '✓ 成功' : '✗ 失败'}`);
      
      if (isMatch) {
        console.log('✓ 新用户登录测试成功');
      } else {
        console.log('✗ 新用户登录测试失败');
      }
    }
    
    await sequelize.close();
    console.log('\n=== 调试完成 ===');
    
  } catch (error) {
    console.error('调试失败:', error);
  }
}

debugPassword(); 