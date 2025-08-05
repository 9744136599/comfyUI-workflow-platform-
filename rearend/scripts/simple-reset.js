const { Sequelize } = require('sequelize');
require('dotenv').config();

async function simpleReset() {
  console.log('=== 简单数据库重置 ===');
  
  // 创建Sequelize实例
  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: process.env.DB_DIALECT || 'mysql',
      logging: false,
    }
  );

  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('✓ 数据库连接成功');
    
    // 删除所有表
    console.log('\n正在删除所有表...');
    const tables = [
      'user_work_likes',
      'work_views', 
      'credit_transactions',
      'works',
      'users'
    ];
    
    for (const table of tables) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS \`${table}\``);
        console.log(`✓ 删除表: ${table}`);
      } catch (error) {
        console.log(`⚠ 删除表 ${table} 失败:`, error.message);
      }
    }
    
    console.log('\n=== 重置完成 ===');
    console.log('所有表已删除，数据库已恢复到初始状态');
    
  } catch (error) {
    console.error('重置失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

// 运行重置
simpleReset(); 