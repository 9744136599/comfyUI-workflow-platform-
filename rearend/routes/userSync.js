const express = require('express');
const router = express.Router();
const userSyncService = require('../services/userSyncService');
const jwt = require('jsonwebtoken');

// 手动同步所有用户数据
router.post('/sync-users', async (req, res) => {
  try {
    console.log('开始手动同步用户数据...');
    const result = await userSyncService.manualSync();
    
    res.json({
      success: true,
      message: '用户同步完成',
      data: result
    });
  } catch (error) {
    console.error('同步用户失败:', error);
    res.status(500).json({
      success: false,
      message: '同步用户失败',
      error: error.message
    });
  }
});

// 企业用户登录（使用默认密码）
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    // 验证用户登录
    const result = await userSyncService.validateUserLogin(username, password);
    
    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.message
      });
    }

    // 生成JWT token
    const token = jwt.sign(
      { 
        userId: result.user.id, 
        username: result.user.username
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          credits: result.user.credits
        }
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
});

// 获取同步统计信息
router.get('/sync-stats', async (req, res) => {
  try {
    const stats = await userSyncService.getSyncStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取同步统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取同步统计失败',
      error: error.message
    });
  }
});

// 检查用户是否存在
router.get('/check-user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await userSyncService.findUserByUsername(username);
    
    res.json({
      success: true,
      data: {
        exists: !!user,
        user: user ? {
          id: user.id,
          username: user.username,
          email: user.email
        } : null
      }
    });
  } catch (error) {
    console.error('检查用户失败:', error);
    res.status(500).json({
      success: false,
      message: '检查用户失败',
      error: error.message
    });
  }
});

// 重置用户密码为默认密码
router.post('/reset-password/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await userSyncService.findUserByUsername(username);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 重置为默认密码
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('123456', 10);
    await user.update({ password: hashedPassword });

    res.json({
      success: true,
      message: '密码重置成功',
      data: {
        username: user.username,
        defaultPassword: '123456'
      }
    });
  } catch (error) {
    console.error('重置密码失败:', error);
    res.status(500).json({
      success: false,
      message: '重置密码失败',
      error: error.message
    });
  }
});

module.exports = router; 