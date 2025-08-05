require('dotenv').config();
const { sequelize, connectDB, initModels } = require('../database/database');

async function resetDatabase() {
  try {
    console.log('=== 开始重置数据库 ===');
    
    // 连接数据库
    await connectDB();
    
    // 初始化模型
    initModels();
    
    console.log('正在删除所有表...');
    
    // 删除所有表（按依赖关系顺序）
    const tableNames = [
      'user_work_likes',
      'work_views', 
      'credit_transactions',
      'works',
      'users'
    ];
    
    for (const table of tableNames) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS \`${table}\``);
        console.log(`✓ 删除表: ${table}`);
      } catch (error) {
        console.log(`⚠ 删除表 ${table} 失败:`, error.message);
      }
    }
    
    console.log('\n正在重新创建表结构...');
    
    // 重新同步表结构（只创建表，不添加同步相关字段）
    await sequelize.sync({ force: true });
    console.log('✓ 表结构重新创建完成');
    
    // 验证表结构
    console.log('\n验证表结构...');
    const [existingTables] = await sequelize.query('SHOW TABLES');
    console.log('当前数据库中的表:', existingTables.map(t => Object.values(t)[0]));
    
    await sequelize.close();
    console.log('\n=== 数据库重置完成 ===');
    console.log('数据库已恢复到初始状态，所有同步相关的字段已移除');
    
  } catch (error) {
    console.error('数据库重置失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  resetDatabase();
}

module.exports = { resetDatabase };
resetDatabase();