const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

// ComfyUI图片上传接口
router.post('/image', uploadController.uploadImage);

module.exports = router; 