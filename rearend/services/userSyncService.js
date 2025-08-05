const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { sequelize, connectDB, initModels } = require('../database/database');

// 确保模型已初始化
let User;
try {
  User = require('../models/user.model');
} catch (error) {
  console.error('无法加载User模型:', error);
}

class UserSyncService {
  constructor() {
    this.externalDBConfig = {
      host: '172.18.0.29',
      port: 3307,
      user: 'root',
      password: 'Haers@2025',
      database: 'haers_boot'
    };
    this.defaultPassword = '123456'; // 默认密码
  }

  // 连接外部MySQL数据库
  async connectToExternalDB() {
    try {
      console.log('正在连接外部数据库...');
      const connection = await mysql.createConnection(this.externalDBConfig);
      console.log('✓ 外部数据库连接成功');
      return connection;
    } catch (error) {
      console.error('✗ 连接外部数据库失败:', error.message);
      throw error;
    }
  }

  // 同步单个用户
  async syncUser(externalUser) {
    try {
      // 确保User模型可用
      if (!User) {
        User = require('../models/user.model');
      }
      
      // 从sys_user表的code字段获取用户名
      const username = externalUser.code;
      
      if (!username) {
        console.log('⚠ 跳过用户：未找到code字段', externalUser);
        return;
      }

      // 检查用户是否已存在
      const existingUser = await User.findOne({
        where: { username: username }
      });

      if (existingUser) {
        // 更新现有用户信息
        await existingUser.update({
          email: externalUser.email || externalUser.mail || `${username}@company.com`,
          updatedAt: new Date()
        });
        console.log(`✓ 更新用户: ${username}`);
      } else {
        // 创建新用户，使用默认密码
        const hashedPassword = await bcrypt.hash(this.defaultPassword, 10);
        const email = externalUser.email || externalUser.mail || `${username}@company.com`;
        
        await User.create({
          username: username, // 使用code作为用户名
          password: hashedPassword,
          email: email,
          credits: 100, // 默认积分
        });
        console.log(`✓ 创建新用户: ${username} (默认密码: ${this.defaultPassword})`);
      }
    } catch (error) {
      console.error('✗ 同步用户失败:', error.message);
      throw error;
    }
  }

  // 同步所有用户
  async syncAllUsers() {
    const connection = await this.connectToExternalDB();
    try {
      console.log('开始同步用户数据...');
      
      // 获取外部数据库中的所有用户
      console.log('正在查询sys_user表...');
      const [rows] = await connection.execute('SELECT * FROM sys_user');
      console.log(`从外部数据库获取到 ${rows.length} 个用户`);
      
      if (rows.length === 0) {
        console.log('⚠ 警告: sys_user表为空或查询结果为空');
        console.log('可能的原因:');
        console.log('1. sys_user表不存在');
        console.log('2. sys_user表没有数据');
        console.log('3. 表名大小写不匹配');
        console.log('4. 用户权限不足');
        
        // 尝试检查表是否存在
        try {
          const [tables] = await connection.execute('SHOW TABLES');
          console.log('当前数据库中的表:', tables.map(t => Object.values(t)[0]));
        } catch (tableError) {
          console.error('无法获取表列表:', tableError.message);
        }
      }

      let successCount = 0;
      let errorCount = 0;
      let skipCount = 0;

      for (const user of rows) {
        try {
          await this.syncUser(user);
          successCount++;
        } catch (error) {
          console.error(`✗ 同步用户失败: ${user.code || user.username || user.user_name || user.name}`, error.message);
          errorCount++;
        }
      }

      const result = { successCount, errorCount, skipCount, totalCount: rows.length };
      console.log(`同步完成: 成功 ${successCount} 个, 失败 ${errorCount} 个, 跳过 ${skipCount} 个`);
      return result;
    } finally {
      await connection.end();
      console.log('外部数据库连接已关闭');
    }
  }

  // 根据用户名查找用户
  async findUserByUsername(username) {
    try {
      // 确保User模型可用
      if (!User) {
        User = require('../models/user.model');
      }
      
      const user = await User.findOne({
        where: { username: username }
      });
      return user;
    } catch (error) {
      console.error('查找用户失败:', error);
      throw error;
    }
  }

  // 验证用户登录（使用默认密码）
  async validateUserLogin(username, password) {
    try {
      const user = await this.findUserByUsername(username);
      if (!user) {
        return { success: false, message: '用户不存在' };
      }

      // 检查密码是否正确
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return { success: false, message: '密码错误' };
      }

      return { success: true, user: user };
    } catch (error) {
      console.error('验证用户登录失败:', error);
      throw error;
    }
  }

  // 获取同步统计信息
  async getSyncStats() {
    try {
      // 确保User模型可用
      if (!User) {
        User = require('../models/user.model');
      }
      
      const totalUsers = await User.count();
      
      return {
        totalUsers,
        activeUsers: totalUsers, // 暂时使用总用户数
        lastSyncTime: new Date()
      };
    } catch (error) {
      console.error('获取同步统计失败:', error);
      throw error;
    }
  }

  // 手动触发同步
  async manualSync() {
    console.log('=== 开始手动同步用户数据 ===');
    try {
      const result = await this.syncAllUsers();
      console.log('=== 手动同步完成 ===');
      return result;
    } catch (error) {
      console.error('=== 手动同步失败 ===', error);
      throw error;
    }
  }
}

module.exports = new UserSyncService(); 