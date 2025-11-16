/**
 * 账号登录获取 Token 模块
 * 用于为已有账号（只有邮箱密码）获取完整的 Token 信息
 */

const { connect } = require('puppeteer-real-browser');
const axios = require('axios');
const os = require('os');

class AccountLogin {
  constructor() {
    this.logCallback = null;
  }

  /**
   * 输出日志
   */
  log(message) {
    console.log(message);
    if (this.logCallback) {
      this.logCallback(message);
    }
  }

  /**
   * 延迟函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 智能点击按钮（支持多种文本匹配）
   */
  async clickButton(page, texts) {
    try {
      const clicked = await page.evaluate((buttonTexts) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        for (const button of buttons) {
          const text = button.textContent.trim();
          for (const btnText of buttonTexts) {
            if (text.includes(btnText) || text.toLowerCase().includes(btnText.toLowerCase())) {
              button.click();
              return true;
            }
          }
        }
        return false;
      }, texts);
      
      return clicked;
    } catch (error) {
      console.error('点击按钮失败:', error);
      return false;
    }
  }

  /**
   * 检测Edge浏览器路径（Windows）
   */
  detectEdgePath() {
    const fs = require('fs');
    const possiblePaths = [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    
    if (process.env.LOCALAPPDATA) {
      possiblePaths.push(process.env.LOCALAPPDATA + '\\Microsoft\\Edge\\Application\\msedge.exe');
    }
    if (process.env.PROGRAMFILES) {
      possiblePaths.push(process.env.PROGRAMFILES + '\\Microsoft\\Edge\\Application\\msedge.exe');
    }
    if (process.env['PROGRAMFILES(X86)']) {
      possiblePaths.push(process.env['PROGRAMFILES(X86)'] + '\\Microsoft\\Edge\\Application\\msedge.exe');
    }

    for (const path of possiblePaths) {
      try {
        if (path && fs.existsSync(path)) {
          this.log(`找到Edge浏览器: ${path}`);
          return path;
        }
      } catch (e) {
        // 忽略错误
      }
    }

    return null;
  }

  /**
   * 使用 refresh_token 获取 access_token
   */
  async getAccessToken(refreshToken) {
    const FIREBASE_API_KEY = 'AIzaSyDsOl-1XpT5err0Tcnx8FFod1H8gVGIycY';
    
    try {
      this.log('正在获取 access_token...');
      
      // 使用 Cloudflare Workers 中转（国内可访问）
      const WORKER_URL = 'https://windsurf.crispvibe.cn';
      
      const response = await axios.post(
        WORKER_URL,
        {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          api_key: FIREBASE_API_KEY
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      this.log('✅ 成功获取 access_token');
      
      return {
        accessToken: response.data.id_token,
        refreshToken: response.data.refresh_token,
        expiresIn: parseInt(response.data.expires_in)
      };
    } catch (error) {
      this.log(`获取 access_token 失败: ${error.response?.data?.error?.message || error.message}`);
      throw error;
    }
  }

  /**
   * 使用 access_token 获取 API Key
   */
  async getApiKey(accessToken) {
    try {
      this.log('正在获取 API Key...');
      
      const response = await axios.post(
        'https://register.windsurf.com/exa.seat_management_pb.SeatManagementService/RegisterUser',
        {
          firebase_id_token: accessToken
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      this.log('✅ 成功获取 API Key');
      
      return {
        apiKey: response.data.api_key,
        name: response.data.name,
        apiServerUrl: response.data.api_server_url
      };
    } catch (error) {
      this.log(`获取 API Key 失败: ${error.response?.data?.error?.message || error.message}`);
      throw error;
    }
  }

  /**
   * 从浏览器提取 Firebase refresh_token
   */
  async extractRefreshToken(page) {
    try {
      this.log('正在从浏览器提取 refresh_token...');
      
      const refreshToken = await page.evaluate(() => {
        // Firebase 存储格式: firebase:authUser:{API_KEY}:{APP_NAME}
        const keys = Object.keys(localStorage);
        
        // 方法1: 遍历所有 localStorage 键
        for (const key of keys) {
          if (key.includes('firebase:authUser')) {
            try {
              const data = JSON.parse(localStorage.getItem(key));
              if (data && data.stsTokenManager && data.stsTokenManager.refreshToken) {
                return data.stsTokenManager.refreshToken;
              }
            } catch (e) {
              continue;
            }
          }
        }
        
        // 方法2: 尝试直接访问已知的 key
        const authKey = 'firebase:authUser:AIzaSyDsOl-1XpT5err0Tcnx8FFod1H8gVGIycY:[DEFAULT]';
        if (localStorage.getItem(authKey)) {
          try {
            const data = JSON.parse(localStorage.getItem(authKey));
            if (data && data.stsTokenManager && data.stsTokenManager.refreshToken) {
              return data.stsTokenManager.refreshToken;
            }
          } catch (e) {
            // 继续尝试其他方法
          }
        }
        
        return null;
      });
      
      if (refreshToken) {
        this.log('✅ 成功提取 refresh_token');
        return refreshToken;
      } else {
        throw new Error('未找到 refresh_token');
      }
    } catch (error) {
      this.log(`提取 refresh_token 失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 登录账号并获取完整 Token
   * @param {Object} account - 账号信息 { email, password }
   * @param {Function} logCallback - 日志回调函数
   * @returns {Object} - 包含完整 Token 信息的账号对象
   */
  async loginAndGetTokens(account, logCallback) {
    this.logCallback = logCallback;
    let browser, page;
    
    try {
      this.log('========== 开始登录获取 Token ==========');
      this.log(`账号: ${account.email}`);
      this.log('');
      
      // 检测操作系统
      const platform = os.platform();
      const isWindows = platform === 'win32';
      const isMac = platform === 'darwin';
      
      this.log('步骤1: 连接浏览器...');
      
      let response;
      let browserType = 'Chrome';
      
      if (isWindows) {
        this.log('[检测] Windows 系统，优先使用 Microsoft Edge 浏览器');
        const edgePath = this.detectEdgePath();
        
        if (edgePath) {
          try {
            this.log(`[尝试] 启动 Edge 浏览器: ${edgePath}`);
            response = await connect({
              headless: false,
              fingerprint: true,
              turnstile: true,
              tf: true,
              timeout: 60000,
              executablePath: edgePath,
              args: [
                '--disable-blink-features=AutomationControlled',
                '--disable-features=IsolateOrigins,site-per-process',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
              ]
            });
            
            browserType = 'Microsoft Edge';
            this.log('[成功] Microsoft Edge 浏览器已启动');
          } catch (edgeError) {
            this.log('[警告] Edge 浏览器启动失败，回退到 Chrome 浏览器');
            this.log(`[错误详情] ${edgeError.message}`);
            console.error('Edge启动失败:', edgeError);
          }
        } else {
          this.log('[提示] 未找到 Edge 浏览器，将使用 Chrome 浏览器');
        }
      }
      
      // 如果Edge失败或不是Windows，使用Chrome
      if (!response) {
        if (isMac) {
          this.log('[检测] macOS 系统，使用 Google Chrome 浏览器');
        } else if (isWindows) {
          this.log('[回退] 使用 Google Chrome 浏览器');
        } else {
          this.log('[检测] Linux 系统，使用 Google Chrome 浏览器');
        }
        
        this.log('[尝试] 启动 Chrome 浏览器...');
        
        response = await connect({
          headless: false,
          fingerprint: true,
          turnstile: true,
          tf: true,
          timeout: 60000,
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
          ]
        });
        
        browserType = 'Google Chrome';
        this.log('[成功] Google Chrome 浏览器已启动');
      }
      
      browser = response.browser;
      page = response.page;
      
      this.log(`[成功] ${browserType} 浏览器已启动`);
      this.log('');
      
      this.log('步骤2: 打开登录页面...');
      await page.goto('https://windsurf.com/account/login', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      this.log('[成功] 登录页面已加载');
      this.log('');
      
      // 等待页面完全加载
      await this.sleep(2000);
      
      // ========== 提前启动 CDP 监听（关键改进）==========
      this.log('步骤3: 启动 Token 监听...');
      
      const client = await page.target().createCDPSession();
      await client.send('Network.enable');
      
      let capturedTokens = {
        accessToken: null,
        refreshToken: null,
        idToken: null
      };
      
      // 监听网络响应，捕获 Token
      client.on('Network.responseReceived', async (params) => {
        const url = params.response.url;
        
        // 捕获 Firebase token 请求
        if (url.includes('securetoken.googleapis.com') || url.includes('identitytoolkit.googleapis.com')) {
          try {
            const response = await client.send('Network.getResponseBody', {
              requestId: params.requestId
            });
            
            const body = JSON.parse(response.body);
            
            if (body.idToken || body.id_token) {
              capturedTokens.idToken = body.idToken || body.id_token;
              capturedTokens.accessToken = body.idToken || body.id_token;
              console.log('[Token捕获] ✅ 捕获到 access_token');
              this.log('[成功] 捕获到 access_token');
            }
            
            if (body.refreshToken || body.refresh_token) {
              capturedTokens.refreshToken = body.refreshToken || body.refresh_token;
              console.log('[Token捕获] ✅ 捕获到 refresh_token');
              this.log('[成功] 捕获到 refresh_token');
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      });
      
      this.log('[成功] Token 监听已启动');
      this.log('');
      
      this.log('步骤4: 自动填写登录信息...');
      
      // 等待输入框加载
      try {
        await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
      } catch (e) {
        this.log('[警告] 未找到邮箱输入框，请手动填写');
      }
      
      const maxRetries = 3;
      let fillSuccess = false;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          this.log(`尝试填写表单 (${attempt}/${maxRetries})...`);
          
          // 填写邮箱 - 使用真实输入模拟
          this.log('正在填写邮箱...');
          const emailInput = await page.$('input[type="email"], input[name="email"]');
          if (emailInput) {
            await emailInput.click({ clickCount: 3 }); // 三击选中
            await emailInput.type(account.email, { delay: 50 }); // 模拟真实输入
            this.log(`[成功] 已填写邮箱: ${account.email}`);
          } else {
            throw new Error('未找到邮箱输入框');
          }
          
          await this.sleep(500);
          
          // 填写密码 - 使用真实输入模拟
          this.log('正在填写密码...');
          const passwordInput = await page.$('input[type="password"]');
          if (passwordInput) {
            await passwordInput.click();
            await passwordInput.type(account.password, { delay: 50 }); // 模拟真实输入
            this.log('[成功] 已填写密码');
          } else {
            throw new Error('未找到密码输入框');
          }
          
          await this.sleep(800);
          
          // 点击登录按钮 - 使用智能点击
          this.log('正在点击登录按钮...');
          const clicked = await this.clickButton(page, ['Log in', 'Sign in', '登录', 'Submit']);
          
          if (clicked) {
            this.log('[成功] 已点击登录按钮');
            fillSuccess = true;
            break;
          } else {
            // 尝试使用 type=submit 选择器
            const submitBtn = await page.$('button[type="submit"]');
            if (submitBtn) {
              await submitBtn.click();
              this.log('[成功] 已点击登录按钮');
              fillSuccess = true;
              break;
            } else {
              throw new Error('未找到登录按钮');
            }
          }
          
        } catch (error) {
          this.log(`[警告] 第 ${attempt} 次尝试失败: ${error.message}`);
          if (attempt < maxRetries) {
            this.log(`等待 2 秒后重试...`);
            await this.sleep(2000);
          }
        }
      }
      
      if (!fillSuccess) {
        this.log('[警告] 自动填写失败，请在浏览器中手动完成登录');
      } else {
        this.log('');
        this.log('[提示] 如果出现验证码，请在浏览器中手动完成验证');
      }
      
      this.log('');
      this.log('[等待] 等待登录完成并捕获 Token（最多等待 3 分钟）...');
      this.log('');
      
      // 等待登录完成的标志
      const maxWaitTime = 180000; // 3分钟
      const startTime = Date.now();
      let loginSuccess = false;
      
      while (!loginSuccess && (Date.now() - startTime) < maxWaitTime) {
        try {
          // 检查是否已经登录成功（localStorage 中有 Firebase 认证信息）
          const hasToken = await page.evaluate(() => {
            const keys = Object.keys(localStorage);
            for (const key of keys) {
              if (key.includes('firebase:authUser')) {
                try {
                  const data = JSON.parse(localStorage.getItem(key));
                  if (data && data.stsTokenManager && data.stsTokenManager.refreshToken) {
                    return true;
                  }
                } catch (e) {
                  continue;
                }
              }
            }
            return false;
          });
          
          if (hasToken) {
            loginSuccess = true;
            this.log('[成功] 检测到登录成功！');
            break;
          }
          
          // 检查 URL 是否已经跳转（不在登录页）
          const currentUrl = page.url();
          if (!currentUrl.includes('/login') && currentUrl.includes('windsurf.com')) {
            loginSuccess = true;
            this.log('[成功] 检测到页面跳转，登录成功！');
            break;
          }
          
          // 每秒检查一次
          await this.sleep(1000);
        } catch (e) {
          // 忽略检查错误，继续等待
        }
      }
      
      if (!loginSuccess) {
        throw new Error('登录超时，未检测到登录成功。请确保在 5 分钟内完成登录操作。');
      }
      
      // 额外等待确保 Token 被完全捕获
      this.log('等待 Token 数据同步...');
      await this.sleep(3000);
      
      this.log('');
      this.log('步骤5: 提取账号 Token...');
      this.log('检查网络监听是否捕获到 Token...');
      
      let tokenInfo = null;
      
      // 等待最多 10 秒，检查是否已捕获到 token
      const tokenWaitTime = 10000;
      const tokenStartTime = Date.now();
      
      while (!capturedTokens.accessToken && (Date.now() - tokenStartTime) < tokenWaitTime) {
        await this.sleep(500);
      }
      
      try {
        if (!capturedTokens.accessToken) {
          // 如果网络拦截失败，尝试从 localStorage 读取
          this.log('[警告] 网络拦截未捕获到 token，尝试从浏览器读取...');
          
          const tokens = await page.evaluate(() => {
            const keys = Object.keys(localStorage);
            for (const key of keys) {
              if (key.includes('firebase:authUser')) {
                try {
                  const data = JSON.parse(localStorage.getItem(key));
                  if (data && data.stsTokenManager) {
                    return {
                      accessToken: data.stsTokenManager.accessToken,
                      refreshToken: data.stsTokenManager.refreshToken
                    };
                  }
                } catch (e) {
                  continue;
                }
              }
            }
            return null;
          });
          
          if (tokens) {
            capturedTokens.accessToken = tokens.accessToken;
            capturedTokens.refreshToken = tokens.refreshToken;
            this.log('[成功] 从浏览器读取到 token');
          } else {
            throw new Error('无法获取 access_token');
          }
        }
        
        // 使用 access_token 获取 API Key
        const apiKeyInfo = await this.getApiKey(capturedTokens.accessToken);
        
        tokenInfo = {
          name: apiKeyInfo.name,
          apiKey: apiKeyInfo.apiKey,
          apiServerUrl: apiKeyInfo.apiServerUrl,
          refreshToken: capturedTokens.refreshToken
        };
        
        this.log('[成功] Token 获取成功');
        this.log(`  - API Key: ${apiKeyInfo.apiKey.substring(0, 20)}...`);
        this.log(`  - 用户名: ${apiKeyInfo.name}`);
        this.log(`  - Refresh Token: ${capturedTokens.refreshToken.substring(0, 20)}...`);
        
        // 只有成功获取 Token 后才关闭浏览器
        this.log('');
        this.log('步骤6: 关闭浏览器...');
        
        if (browser) {
          await browser.close();
          this.log('[成功] 浏览器已关闭');
        }
        
        this.log('');
        this.log('========== 登录完成 ==========');
        this.log('');
        
        // 返回更新后的账号信息
        return {
          success: true,
          account: {
            ...account,
            name: tokenInfo.name,
            apiKey: tokenInfo.apiKey,
            apiServerUrl: tokenInfo.apiServerUrl,
            refreshToken: tokenInfo.refreshToken,
            updatedAt: new Date().toISOString()
          }
        };
        
      } catch (tokenError) {
        this.log('');
        this.log(`[警告] 获取 Token 失败: ${tokenError.message}`);
        console.error('获取 Token 失败:', tokenError);
        this.log('');
        this.log('[警告] 浏览器保持打开状态，请检查问题或手动关闭');
        this.log('[提示] 您可以尝试手动完成登录，或关闭浏览器后重试');
        
        // Token 获取失败，不关闭浏览器，让用户检查问题
        return {
          success: false,
          error: `Token 获取失败: ${tokenError.message}`,
          browserOpen: true
        };
      } finally {
        // 关闭 CDP 会话
        if (client) {
          try {
            await client.detach();
          } catch (e) {
            console.error('关闭 CDP 会话失败:', e);
          }
        }
      }
      
    } catch (error) {
      this.log('');
      this.log(`[错误] 登录失败: ${error.message}`);
      console.error('登录错误:', error);
      
      if (browser) {
        try {
          await browser.close();
          this.log('浏览器已关闭');
        } catch (e) {
          console.error('关闭浏览器失败:', e);
        }
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccountLogin;
}

// 挂载到全局
if (typeof window !== 'undefined') {
  window.AccountLogin = AccountLogin;
}
