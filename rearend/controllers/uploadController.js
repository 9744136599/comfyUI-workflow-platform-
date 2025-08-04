const axios = require('axios');
const multer = require('multer');
const sharp = require('sharp');

// 配置multer用于处理文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  }
});

// 获取图片尺寸
const getImageDimensions = async (buffer) => {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height
    };
  } catch (error) {
    console.error('获取图片尺寸失败:', error);
    return { width: 0, height: 0 };
  }
};

// 生成秒分时-日月年-用户名的文件名
const generateTimeBasedFileName = (originalName, username) => {
  try {
    const now = new Date();
    const second = String(now.getSeconds()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    
    // 获取原文件的扩展名，如果没有扩展名则默认为.png
    let ext = '.png';
    if (originalName && originalName.includes('.')) {
      ext = originalName.substring(originalName.lastIndexOf('.'));
      // 确保扩展名是有效的图片格式
      const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
      if (!validExtensions.includes(ext.toLowerCase())) {
        ext = '.png'; // 如果不是有效格式，默认使用.png
      }
    }
    
    // 生成新的文件名：秒分时-日月年-用户名 + 原扩展名
    const newFileName = `${second}${minute}${hour}-${day}${month}${year}-${username}${ext}`;
    
    console.log(`文件重命名: ${originalName} -> ${newFileName}`);
    return newFileName;
  } catch (error) {
    console.error('生成文件名失败:', error);
    // 如果生成失败，返回时间戳作为文件名
    const timestamp = Date.now();
    return `${timestamp}-${username || 'user'}.png`;
  }
};

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

      // 获取图片尺寸
      const dimensions = await getImageDimensions(req.file.buffer);
      console.log(`📁 上传图片尺寸: ${dimensions.width} × ${dimensions.height}`);

      // 生成基于时间的新文件名
      const username = req.headers['x-username'] || 'anonymous';
      const newFileName = generateTimeBasedFileName(req.file.originalname, username);

      // ComfyUI服务器地址
      const comfyuiUrl = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';
      
      console.log('准备向ComfyUI发送请求，图片尺寸:', `${dimensions.width} × ${dimensions.height}`);
      console.log('转发上传请求到ComfyUI服务器:', comfyuiUrl);

      try {
        // 创建FormData对象转发到ComfyUI
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('image', req.file.buffer, {
          filename: newFileName, // 使用重命名的文件名
          contentType: req.file.mimetype
        });

        console.log('开始向ComfyUI发送请求...');
        // 转发请求到ComfyUI服务器
        const response = await axios.post(`${comfyuiUrl}/upload/image`, formData, {
          headers: {
            ...formData.getHeaders()
          },
          timeout: 30000 // 30秒超时
        });

        console.log('ComfyUI服务器响应:', response.data);

        // 返回ComfyUI服务器的响应，并添加图片尺寸信息
        const responseData = response.data;
        if (responseData) {
          responseData.dimensions = dimensions;
          responseData.width = dimensions.width;
          responseData.height = dimensions.height;
          // 使用我们生成的重命名文件名
          if (responseData.name) {
            responseData.name = newFileName;
            console.log(`✅ 图片上传成功，尺寸: ${dimensions.width} × ${dimensions.height}，文件名: ${newFileName}`);
          }
        }

        // 返回修改后的响应
        res.status(200).json(responseData);

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