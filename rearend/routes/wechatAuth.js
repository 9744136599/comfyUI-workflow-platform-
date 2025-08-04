const express = require('express');
const router = express.Router();
const wechatAuthController = require('../controllers/wechatAuthController');

// 获取企微登录授权URL
router.get('/auth/wechat/url', wechatAuthController.getWechatAuthUrl);

// 企微登录回调
router.get('/auth/wechat/callback', wechatAuthController.wechatLoginCallback);

// 检查企微配置状态
router.get('/auth/wechat/config', wechatAuthController.checkWechatConfig);

module.exports = router; 