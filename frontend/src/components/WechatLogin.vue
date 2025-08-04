<template>
  <div class="wechat-login">
    <el-button 
      type="primary" 
      size="large" 
      @click="handleWechatLogin"
      :loading="isLoading"
      class="wechat-login-btn"
    >
      <el-icon><ChatDotRound /></el-icon>
      企业微信登录
    </el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()
const isLoading = ref(false)

const handleWechatLogin = async () => {
  try {
    isLoading.value = true
    
    // 获取企微授权URL
    const response = await fetch('/api/auth/wechat/url')
    const result = await response.json()
    
    if (result.success) {
      // 跳转到企微授权页面
      window.location.href = result.data.authUrl
    } else {
      ElMessage.error(result.message || '获取授权URL失败')
    }
  } catch (error) {
    console.error('企微登录失败:', error)
    ElMessage.error('企微登录失败，请重试')
  } finally {
    isLoading.value = false
  }
}

// 检查URL参数，处理企微登录回调
const checkWechatCallback = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const state = urlParams.get('state')
  
  if (code) {
    handleWechatCallback(code, state)
  }
}

const handleWechatCallback = async (code, state) => {
  try {
    isLoading.value = true
    
    // 调用企微登录回调接口
    const response = await fetch(`/api/auth/wechat/callback?code=${code}&state=${state}`)
    const result = await response.json()
    
    if (result.success) {
      // 保存token和用户信息
      localStorage.setItem('token', result.data.token)
      userStore.token = result.data.token
      userStore.user = result.data.user
      
      ElMessage.success('企微登录成功！')
      
      // 跳转到首页
      router.push('/dashboard')
    } else {
      ElMessage.error(result.message || '企微登录失败')
    }
  } catch (error) {
    console.error('企微登录回调失败:', error)
    ElMessage.error('企微登录失败，请重试')
  } finally {
    isLoading.value = false
  }
}

// 页面加载时检查回调
checkWechatCallback()
</script>

<style scoped>
.wechat-login {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.wechat-login-btn {
  background: linear-gradient(135deg, #07c160 0%, #00d4aa 100%);
  border: none;
  color: white;
  font-weight: bold;
  padding: 12px 24px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.wechat-login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(7, 193, 96, 0.3);
}

.wechat-login-btn:active {
  transform: translateY(0);
}
</style> 