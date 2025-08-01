# ComfyUI上传配置说明

## 功能概述

文件上传功能现在支持两种模式：
1. **代理模式**：通过本地后端代理转发到ComfyUI服务器
2. **直连模式**：前端直接调用ComfyUI服务器

## 配置方式

### 1. 环境变量配置

在 `frontend/.env` 文件中添加以下配置：

```env
# ComfyUI服务器配置
VITE_COMFYUI_URL=http://127.0.0.1:8188
VITE_USE_COMFYUI_PROXY=true
```

### 2. 配置说明

- `VITE_COMFYUI_URL`: ComfyUI服务器地址，默认为 `http://127.0.0.1:8188`
- `VITE_USE_COMFYUI_PROXY`: 是否使用代理模式
  - `true`: 通过本地后端代理（推荐，可以处理CORS问题）
  - `false`: 直接调用ComfyUI服务器

## 使用方式

### 代理模式（推荐）

1. 确保后端服务器正在运行
2. 确保ComfyUI服务器正在运行
3. 设置 `VITE_USE_COMFYUI_PROXY=true`
4. 前端会调用 `/api/upload/image`，后端会转发到ComfyUI服务器

### 直连模式

1. 确保ComfyUI服务器正在运行
2. 设置 `VITE_USE_COMFYUI_PROXY=false`
3. 前端会直接调用 `http://127.0.0.1:8188/upload/image`

## 技术实现

### 前端实现

```javascript
// 配置文件
const config = {
  COMFYUI_URL: import.meta.env.VITE_COMFYUI_URL || 'http://127.0.0.1:8188',
  USE_COMFYUI_PROXY: import.meta.env.VITE_USE_COMFYUI_PROXY !== 'false'
}

// 上传逻辑
const useProxy = USE_COMFYUI_PROXY
const uploadUrl = useProxy 
  ? '/api/upload/image'  // 代理模式
  : `${COMFYUI_URL}/upload/image` // 直连模式
```

### 后端代理实现

```javascript
// 转发到ComfyUI服务器
const comfyuiUrl = process.env.COMFYUI_URL || 'http://127.0.0.1:8188'
const response = await axios.post(`${comfyuiUrl}/upload/image`, {
  image: image
})
```

## API接口

### ComfyUI服务器接口

**请求**: `POST http://127.0.0.1:8188/upload/image`

**请求体**:
```json
{
  "image": "string(binary)"
}
```

**响应**:
```json
{
  "name": "1750640879022-32be6192.png",
  "subfolder": "",
  "type": "input"
}
```

### 本地代理接口

**请求**: `POST /api/upload/image`

**请求体**: 同上

**响应**: 同上（转发ComfyUI服务器的响应）

## 错误处理

### 代理模式错误

- `ECONNREFUSED`: ComfyUI服务器未运行
- `ETIMEDOUT`: 请求超时
- `500`: ComfyUI服务器内部错误

### 直连模式错误

- `CORS`: 跨域问题（需要ComfyUI服务器支持CORS）
- `ECONNREFUSED`: ComfyUI服务器未运行
- `404`: 接口不存在

## 推荐配置

**开发环境**:
```env
VITE_COMFYUI_URL=http://127.0.0.1:8188
VITE_USE_COMFYUI_PROXY=true
```

**生产环境**:
```env
VITE_COMFYUI_URL=https://your-comfyui-server.com
VITE_USE_COMFYUI_PROXY=true
```

## 注意事项

1. **CORS问题**: 直连模式可能遇到跨域问题，建议使用代理模式
2. **网络问题**: 确保前端能够访问ComfyUI服务器
3. **文件大小**: ComfyUI服务器可能有文件大小限制
4. **超时设置**: 大文件上传可能需要较长时间 