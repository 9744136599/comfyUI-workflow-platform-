const axios = require('axios');
const multer = require('multer');

// 配置multer用于处理文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  }
});

// 处理ComfyUI的/upload/image接口 - 转发FormData到ComfyUI服务器
const uploadImage = async (req, res) => {
  try {
    // 使用multer处理文件上传
    upload.single('image')(req, res, async (err) => {
      if (err) {
        console.error('文件上传错误:', err);
        return res.status(400).json({ 
          success: false, 
          error: '文件上传失败: ' + err.message 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: '没有接收到文件' 
        });
      }

      console.log('接收到文件:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      // ComfyUI服务器地址
      const comfyuiUrl = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';
      
      console.log('转发上传请求到ComfyUI服务器:', comfyuiUrl);

      try {
        // 创建FormData对象转发到ComfyUI
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('image', req.file.buffer, {
          filename: req.file.originalname,
          contentType: req.file.mimetype
        });

        // 转发请求到ComfyUI服务器
        const response = await axios.post(`${comfyuiUrl}/upload/image`, formData, {
          headers: {
            ...formData.getHeaders()
          },
          timeout: 30000 // 30秒超时
        });

        console.log('ComfyUI服务器响应:', response.data);

        // 返回ComfyUI服务器的响应
        res.status(200).json(response.data);

      } catch (error) {
        console.error('转发到ComfyUI失败:', error);
        
        if (error.code === 'ECONNREFUSED') {
          res.status(500).json({ 
            success: false, 
            error: '无法连接到ComfyUI服务器，请确保ComfyUI正在运行' 
          });
        } else if (error.response) {
          // ComfyUI服务器返回的错误
          res.status(error.response.status).json({
            success: false,
            error: error.response.data?.error || 'ComfyUI服务器错误'
          });
        } else {
          res.status(500).json({ 
            success: false, 
            error: '服务器内部错误' 
          });
        }
      }
    });

  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '服务器内部错误' 
    });
  }
};

module.exports = {
  uploadImage
}; 