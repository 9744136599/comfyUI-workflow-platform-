require('dotenv').config();
const { sequelize, connectDB, initModels } = require('../database/database');

async function checkDatabase() {
  try {
    console.log('=== 检查数据库状态 ===');
    
    // 连接数据库
    await connectDB();
    
    // 初始化模型
    initModels();
    
    // 检查表结构
    console.log('\n1. 检查表结构...');
    const [tables] = await sequelize.query('SHOW TABLES');
    console.log('当前数据库中的表:', tables.map(t => Object.values(t)[0]));
    
    // 检查users表结构
    if (tables.some(t => Object.values(t)[0] === 'users')) {
      console.log('\n2. 检查users表结构...');
      const [columns] = await sequelize.query('DESCRIBE users');
      console.log('users表字段:');
      columns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type})`);
      });
      
      // 检查用户数量
      const [userCount] = await sequelize.query('SELECT COUNT(*) as count FROM users');
      console.log(`\n3. 用户数量: ${userCount[0].count}`);
    }
    
    await sequelize.close();
    console.log('\n=== 检查完成 ===');
    
  } catch (error) {
    console.error('检查失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  checkDatabase();
}

module.exports = { checkDatabase };