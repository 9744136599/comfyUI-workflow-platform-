const jwt = require('jsonwebtoken');
const WechatWorkService = require('../services/wechatWorkService');
const User = require('../models/user.model');
const { v4: uuidv4 } = require('uuid');

const wechatWorkService = new WechatWorkService();

/**
 * 获取企微登录授权URL
 */
const getWechatAuthUrl = async (req, res) => {
  try {
    // 验证企微配置
    const isValid = await wechatWorkService.validateConfig();
    if (!isValid) {
      return res.status(500).json({
        success: false,
        message: '企微配置无效，请联系管理员'
      });
    }

    // 生成state参数，用于防止CSRF攻击
    const state = uuidv4();
    
    // 获取授权URL
    const authUrl = wechatWorkService.getAuthUrl(state);
    
    console.log('企微授权URL生成成功');
    
    res.json({
      success: true,
      data: {
        authUrl: authUrl,
        state: state
      }
    });
  } catch (error) {
    console.error('生成企微授权URL失败:', error);
    res.status(500).json({
      success: false,
      message: '生成授权URL失败'
    });
  }
};

/**
 * 企微登录回调处理
 */
const wechatLoginCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: '缺少授权码'
      });
    }

    console.log('收到企微登录回调，code:', code);

    // 获取用户基本信息
    const userInfoResult = await wechatWorkService.getUserInfo(code);
    if (!userInfoResult.success) {
      return res.status(400).json({
        success: false,
        message: userInfoResult.error
      });
    }

    const { userid } = userInfoResult;

    // 获取用户详细信息
    const userDetailResult = await wechatWorkService.getUserDetail(userid);
    if (!userDetailResult.success) {
      return res.status(400).json({
        success: false,
        message: userDetailResult.error
      });
    }

    const wechatUser = userDetailResult.user;
    console.log('企微用户信息:', wechatUser);

    // 查找或创建本地用户
    let user = await User.findOne({
      where: { wechat_userid: userid }
    });

    if (!user) {
      // 创建新用户
      user = await User.create({
        username: wechatUser.name || `user_${userid}`,
        email: wechatUser.email || `${userid}@company.com`,
        password: 'wechat_user', // 企微用户不需要密码
        wechat_userid: userid,
        wechat_name: wechatUser.name,
        wechat_mobile: wechatUser.mobile,
        wechat_avatar: wechatUser.avatar,
        wechat_department: wechatUser.department ? wechatUser.department.join(',') : '',
        wechat_position: wechatUser.position || '',
        credits: 100, // 新用户默认积分
        is_active: true
      });
      
      console.log('创建新企微用户:', user.username);
    } else {
      // 更新现有用户信息
      await user.update({
        wechat_name: wechatUser.name,
        wechat_mobile: wechatUser.mobile,
        wechat_avatar: wechatUser.avatar,
        wechat_department: wechatUser.department ? wechatUser.department.join(',') : '',
        wechat_position: wechatUser.position || ''
      });
      
      console.log('更新企微用户信息:', user.username);
    }

    // 生成JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        wechat_userid: user.wechat_userid
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 返回登录成功信息
    res.json({
      success: true,
      message: '企微登录成功',
      data: {
        token: token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          credits: user.credits,
          wechat_name: user.wechat_name,
          wechat_avatar: user.wechat_avatar,
          wechat_department: user.wechat_department,
          wechat_position: user.wechat_position
        }
      }
    });

  } catch (error) {
    console.error('企微登录失败:', error);
    res.status(500).json({
      success: false,
      message: '企微登录失败，请重试'
    });
  }
};

/**
 * 检查企微配置状态
 */
const checkWechatConfig = async (req, res) => {
  try {
    const isValid = await wechatWorkService.validateConfig();
    
    res.json({
      success: true,
      data: {
        enabled: isValid,
        corpId: process.env.WECHAT_CORP_ID ? '已配置' : '未配置',
        agentId: process.env.WECHAT_AGENT_ID ? '已配置' : '未配置',
        secret: process.env.WECHAT_SECRET ? '已配置' : '未配置'
      }
    });
  } catch (error) {
    console.error('检查企微配置失败:', error);
    res.status(500).json({
      success: false,
      message: '检查配置失败'
    });
  }
};

module.exports = {
  getWechatAuthUrl,
  wechatLoginCallback,
  checkWechatConfig
}; 