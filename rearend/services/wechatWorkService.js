const axios = require('axios');

class WechatWorkService {
  constructor() {
    this.corpId = process.env.WECHAT_CORP_ID;
    this.agentId = process.env.WECHAT_AGENT_ID;
    this.secret = process.env.WECHAT_SECRET;
    this.redirectUri = process.env.WECHAT_REDIRECT_URI || 'http://localhost:3000/auth/wechat/callback';
    this.baseUrl = 'https://qyapi.weixin.qq.com/cgi-bin';
  }

  /**
   * 获取企业微信授权URL
   * @param {string} state - 状态参数
   * @returns {string} 授权URL
   */
  getAuthUrl(state = '') {
    const params = new URLSearchParams({
      appid: this.corpId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'snsapi_base',
      state: state
    });
    
    return `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;
  }

  /**
   * 通过授权码获取访问令牌
   * @param {string} code - 授权码
   * @returns {Promise<Object>} 访问令牌信息
   */
  async getAccessToken(code) {
    try {
      const response = await axios.get(`${this.baseUrl}/gettoken`, {
        params: {
          corpid: this.corpId,
          corpsecret: this.secret
        }
      });

      if (response.data.errcode === 0) {
        return {
          success: true,
          access_token: response.data.access_token,
          expires_in: response.data.expires_in
        };
      } else {
        throw new Error(`获取access_token失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      console.error('获取access_token失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 通过授权码获取用户信息
   * @param {string} code - 授权码
   * @returns {Promise<Object>} 用户信息
   */
  async getUserInfo(code) {
    try {
      // 先获取access_token
      const tokenResult = await this.getAccessToken(code);
      if (!tokenResult.success) {
        throw new Error(tokenResult.error);
      }

      // 获取用户信息
      const response = await axios.get(`${this.baseUrl}/auth/getuserinfo`, {
        params: {
          access_token: tokenResult.access_token,
          code: code
        }
      });

      if (response.data.errcode === 0) {
        return {
          success: true,
          userid: response.data.UserId,
          deviceid: response.data.DeviceId
        };
      } else {
        throw new Error(`获取用户信息失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取用户详细信息
   * @param {string} userid - 用户ID
   * @returns {Promise<Object>} 用户详细信息
   */
  async getUserDetail(userid) {
    try {
      const tokenResult = await this.getAccessToken();
      if (!tokenResult.success) {
        throw new Error(tokenResult.error);
      }

      const response = await axios.get(`${this.baseUrl}/user/get`, {
        params: {
          access_token: tokenResult.access_token,
          userid: userid
        }
      });

      if (response.data.errcode === 0) {
        return {
          success: true,
          user: response.data
        };
      } else {
        throw new Error(`获取用户详情失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      console.error('获取用户详情失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 验证企微配置
   * @returns {Promise<boolean>} 配置是否有效
   */
  async validateConfig() {
    if (!this.corpId || !this.agentId || !this.secret) {
      console.error('企微配置不完整');
      return false;
    }

    try {
      const tokenResult = await this.getAccessToken();
      return tokenResult.success;
    } catch (error) {
      console.error('企微配置验证失败:', error);
      return false;
    }
  }
}

module.exports = WechatWorkService; 