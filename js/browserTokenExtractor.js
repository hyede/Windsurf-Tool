// browserTokenExtractor.js - 浏览器Token提取模块
const { connect } = require('puppeteer-real-browser');

// 自定义sleep函数，替代page.waitForTimeout
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Token提取器
const BrowserTokenExtractor = {
  // 提取token
  async extractToken(credentials) {
    const { email, password } = credentials;
    
    if (!email || !password) {
      return { success: false, error: '邮箱或密码不能为空' };
    }
    
    // 保存凭据以便在结果中使用
    this.currentCredentials = { email, password };
    
    console.log(`开始获取账号 ${email} 的token...`);
    
    // 根据平台选择不同的提取方法
    if (process.platform === 'win32') {
      return await this.extractTokenWindows(email, password);
    } else {
      return await this.extractTokenMac(email, password);
    }
  },
  
  // Windows平台提取token
  async extractTokenWindows(email, password) {
    let browser = null;
    let page = null;
    
    try {
      // 连接浏览器
      console.log('正在连接浏览器...');
      const response = await connect({
        headless: false, // 可见浏览器窗口
        fingerprint: true, // 启用指纹伪装
        turnstile: true, // 自动处理Cloudflare Turnstile
        tf: true, // 目标过滤
        timeout: 60000, // 浏览器启动超时60秒
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-features=IsolateOrigins,site-per-process',
          '--no-sandbox', // 提高兼容性
          '--disable-dev-shm-usage' // 减少内存使用
        ]
      });
      
      browser = response.browser;
      page = response.page;
      
      if (!browser || !page) {
        throw new Error('浏览器或页面对象未创建');
      }
      
      console.log('浏览器连接成功');
      
      return await this.performBrowserExtraction(page, email, password);
    } catch (error) {
      console.error('Windows提取token失败:', error);
      return { success: false, error: `Windows提取失败: ${error.message}` };
    } finally {
      // 确保浏览器关闭
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          console.error('关闭浏览器失败:', e);
        }
      }
    }
  },
  
  // Mac平台提取token
  async extractTokenMac(email, password) {
    let browser = null;
    let page = null;
    
    try {
      // 连接浏览器
      console.log('正在连接浏览器...');
      const response = await connect({
        headless: false, // 可见浏览器窗口
        fingerprint: true, // 启用指纹伪装
        turnstile: true, // 自动处理Cloudflare Turnstile
        tf: true, // 目标过滤
        timeout: 60000, // 浏览器启动超时60秒
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-features=IsolateOrigins,site-per-process',
          '--no-sandbox', // 提高兼容性
          '--disable-dev-shm-usage' // 减少内存使用
        ]
      });
      
      browser = response.browser;
      page = response.page;
      
      if (!browser || !page) {
        throw new Error('浏览器或页面对象未创建');
      }
      
      console.log('浏览器连接成功');
      
      return await this.performBrowserExtraction(page, email, password);
    } catch (error) {
      console.error('Mac提取token失败:', error);
      return { success: false, error: `Mac提取失败: ${error.message}` };
    } finally {
      // 确保浏览器关闭
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          console.error('关闭浏览器失败:', e);
        }
      }
    }
  },
  
  // 执行浏览器提取
  async performBrowserExtraction(page, email, password) {
    // 保存凭据以便在结果中使用
    this.currentEmail = email;
    this.currentPassword = password;
    try {
      console.log('============================================================');
      console.log('🚀 开始浏览器Token提取流程');
      console.log('============================================================');
      console.log(`📧 邮箱: ${email}`);
      console.log(`🔑 密码: ${'*'.repeat(password.length)}`);
      console.log(`⏰ 开始时间: ${new Date().toLocaleString()}`);
      console.log('');
      
      // 设置用户代理
      console.log('🔧 设置用户代理...');
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36');
      console.log('✅ 用户代理设置完成');
      
      // 启用网络请求拦截，专门捕获Firebase认证请求
      console.log('🕸️ 启用Firebase认证请求拦截...');
      await page.setRequestInterception(true);
      const capturedTokens = [];
      let requestCount = 0;
      let responseCount = 0;
      
      // 设置更快的超时时间
      page.setDefaultTimeout(30000); // 30秒超时
      let firebaseTokens = {
        refreshToken: null,
        idToken: null,
        accessToken: null
      };
      
      page.on('request', (request) => {
        requestCount++;
        const url = request.url();
        
        // 只记录关键请求，但不再中断任何请求，避免影响登录页面加载
        
        // 特别关注Firebase相关请求
        if (url.includes('securetoken.googleapis.com') || 
            url.includes('identitytoolkit.googleapis.com') || 
            url.includes('firebase') || 
            url.includes('auth')) {
          console.log(`🔥 Firebase相关请求: ${request.method()} ${url}`);
          
          // 检查POST请求的body
          if (request.method() === 'POST') {
            try {
              const postData = request.postData();
              if (postData) {
                capturedTokens.push({
                  type: 'firebase_request',
                  url: url,
                  data: postData
                });
              }
            } catch (e) {
              console.log(`⚠️ 无法读取Firebase POST数据: ${e.message}`);
            }
          }
        }
        
        // 所有请求一律放行，只做监听，不做阻断
        request.continue();
      });
      
      page.on('response', async (response) => {
        responseCount++;
        const url = response.url();
        
        // 专门处理Firebase认证响应
        if (url.includes('securetoken.googleapis.com') || 
            url.includes('identitytoolkit.googleapis.com')) {
          console.log(`🔥 Firebase认证响应: ${response.status()} ${url}`);
          
          try {
            const responseText = await response.text();
            
            try {
              const responseData = JSON.parse(responseText);
              
              // 检查各种可能的token字段
              if (responseData.refreshToken) {
                console.log(`🎯 找到refreshToken: ${responseData.refreshToken.substring(0, 20)}...`);
                firebaseTokens.refreshToken = responseData.refreshToken;
              }
              
              if (responseData.idToken) {
                console.log(`🎯 找到idToken: ${responseData.idToken.substring(0, 20)}...`);
                firebaseTokens.idToken = responseData.idToken;
              }
              
              if (responseData.access_token) {
                console.log(`🎯 找到access_token: ${responseData.access_token.substring(0, 20)}...`);
                firebaseTokens.accessToken = responseData.access_token;
              }
              
              // 保存完整的Firebase响应
              capturedTokens.push({
                type: 'firebase_response',
                url: url,
                data: responseData
              });
              
              // 如果找到了idToken，可以立即结束流程
              if (firebaseTokens.idToken || firebaseTokens.refreshToken) {
                console.log('✅ 已找到所需的Firebase Token，准备提前结束流程');
              }
              
            } catch (parseError) {
              // 简化错误日志
            }
            
          } catch (e) {
            // 简化错误日志
          }
        }
        
        // 只捕获关键认证响应，减少不必要的处理
        else if ((url.includes('windsurf.com') && url.includes('auth')) || 
                 url.includes('identitytoolkit')) {
          try {
            const contentType = response.headers()['content-type'] || '';
            
            // 只处理JSON响应，加快速度
            if (contentType.includes('json')) {
              const responseText = await response.text();
              if (responseText && (responseText.includes('token') || responseText.includes('key'))) {
                capturedTokens.push({
                  type: 'auth_response',
                  url: url,
                  data: responseText
                });
              }
            }
          } catch (e) {
            // 简化错误日志
          }
        }
      });
      
      console.log('✅ 网络请求拦截设置完成');
      
      // 清除cookies和缓存
      console.log('🧹 清除浏览器缓存和Cookies...');
      try {
        const client = await page.target().createCDPSession();
        await client.send('Network.clearBrowserCookies');
        await client.send('Network.clearBrowserCache');
        console.log('✅ 浏览器缓存和Cookies清除完成');
      } catch (error) {
        console.warn('⚠️ 清除浏览器缓存和Cookies失败，继续执行:', error.message);
      }
      
      // 打开登录页面
      console.log('');
      console.log('🌐 开始访问登录页面...');
      console.log('🔗 目标URL: https://windsurf.com/account/login');
      let navigationSuccess = false;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!navigationSuccess && retryCount < maxRetries) {
        try {
          retryCount++;
          console.log(`📍 尝试访问登录页面 (第${retryCount}次，共${maxRetries}次)`);
          const startTime = Date.now();
          
          await page.goto('https://windsurf.com/account/login', {
            waitUntil: 'domcontentloaded', // 更宽松的等待条件
            timeout: 30000 // 30秒超时
          });
          
          const loadTime = Date.now() - startTime;
          console.log(`⏱️ 页面加载耗时: ${loadTime}ms`);
          
          // 等待页面基本元素加载
          console.log('⏳ 等待页面基本元素加载...');
          await page.waitForSelector('body', { timeout: 10000 });
          navigationSuccess = true;
          
          // 获取页面基本信息
          const pageTitle = await page.title();
          const pageUrl = page.url();
          console.log(`✅ 登录页面访问成功`);
          console.log(`📄 页面标题: ${pageTitle}`);
          console.log(`🔗 实际URL: ${pageUrl}`);
          
        } catch (error) {
          console.log(`❌ 第${retryCount}次访问失败: ${error.message}`);
          
          if (retryCount < maxRetries) {
            console.log(`⏳ 等待5秒后重试...`);
            await sleep(5000);
          } else {
            console.log(`💥 无法访问登录页面，已重试${maxRetries}次`);
            throw new Error(`无法访问登录页面，已重试${maxRetries}次: ${error.message}`);
          }
        }
      }
      
      // 等待页面加载完成 - 增加等待时间让动态内容完全加载
      console.log('⏳ 等待页面完全加载...');
      await sleep(5000); // 等待5秒让页面完全渲染
      
      // 智能等待:检查页面是否有React/Vue等框架的加载标识
      console.log('🔍 检查页面动态加载状态...');
      let dynamicLoadWaitTime = 0;
      const maxDynamicWaitTime = 10000; // 最多再等10秒
      
      while (dynamicLoadWaitTime < maxDynamicWaitTime) {
        const hasInputs = await page.evaluate(() => {
          // 检查页面是否有输入框元素
          const inputs = document.querySelectorAll('input');
          return inputs.length > 0;
        });
        
        if (hasInputs) {
          console.log('✅ 检测到页面输入框已加载');
          break;
        }
        
        console.log(`⏳ 等待动态内容加载... (${dynamicLoadWaitTime/1000}s/${maxDynamicWaitTime/1000}s)`);
        await sleep(1000);
        dynamicLoadWaitTime += 1000;
      }
      
      console.log('✅ 页面加载等待完成');
      
      // 分析页面结构
      console.log('');
      console.log('🔍 开始分析页面结构...');
      const pageContent = await page.content();
      const pageTitle = await page.title();
      const pageUrl = page.url();
      
      console.log(`📄 页面标题: ${pageTitle}`);
      console.log(`🔗 当前URL: ${pageUrl}`);
      console.log(`📏 页面内容长度: ${pageContent.length} 字符`);
      
      // 检查页面中是否包含登录表单
      const hasEmailInput = pageContent.includes('type="email"') || pageContent.includes('name="email"');
      const hasPasswordInput = pageContent.includes('type="password"') || pageContent.includes('name="password"');
      const hasLoginButton = pageContent.toLowerCase().includes('log in') || pageContent.toLowerCase().includes('login');
      
      console.log(`📧 包含邮箱输入框: ${hasEmailInput ? '✅' : '❌'}`);
      console.log(`🔑 包含密码输入框: ${hasPasswordInput ? '✅' : '❌'}`);
      console.log(`🔘 包含登录按钮: ${hasLoginButton ? '✅' : '❌'}`);
      
      // 查找邮箱输入框
      console.log('');
      console.log('📧 开始查找邮箱输入框...');
      const emailSelectors = [
        'input[type="email"]', 
        'input[name="email"]', 
        'input[placeholder*="email" i]',
        'input[placeholder*="mail" i]',
        'input[id*="email" i]',
        'input.email',
        'input[type="text"]'
      ];
      
      console.log(`🔍 将尝试 ${emailSelectors.length} 个选择器:`);
      emailSelectors.forEach((selector, index) => {
        console.log(`   ${index + 1}. ${selector}`);
      });
      
      let emailInput = null;
      for (let i = 0; i < emailSelectors.length; i++) {
        const selector = emailSelectors[i];
        try {
          console.log(`🔍 尝试选择器 ${i + 1}/${emailSelectors.length}: ${selector}`);
          emailInput = await page.$(selector);
          if (emailInput) {
            console.log(`✅ 找到邮箱输入框: ${selector}`);
            
            // 获取输入框的详细信息
            const inputInfo = await page.evaluate((el) => {
              return {
                tagName: el.tagName,
                type: el.type,
                name: el.name,
                id: el.id,
                placeholder: el.placeholder,
                className: el.className,
                visible: el.offsetParent !== null,
                disabled: el.disabled,
                readonly: el.readOnly
              };
            }, emailInput);
            
            console.log(`📋 输入框信息:`, JSON.stringify(inputInfo, null, 2));
            break;
          } else {
            console.log(`❌ 选择器未找到元素: ${selector}`);
          }
        } catch (e) {
          console.log(`⚠️ 选择器执行错误 ${selector}: ${e.message}`);
        }
      }
      
      if (!emailInput) {
        console.log('❌ 未找到邮箱输入框，尝试额外等待5秒后重试...');
        await sleep(5000);
        
        // 再次尝试查找
        for (let i = 0; i < emailSelectors.length; i++) {
          const selector = emailSelectors[i];
          try {
            console.log(`🔍 重试选择器 ${i + 1}/${emailSelectors.length}: ${selector}`);
            emailInput = await page.$(selector);
            if (emailInput) {
              console.log(`✅ 重试成功，找到邮箱输入框: ${selector}`);
              break;
            }
          } catch (e) {
            console.log(`⚠️ 重试选择器执行错误 ${selector}: ${e.message}`);
          }
        }
        
        if (!emailInput) {
          console.log('❌ 重试后仍未找到邮箱输入框，保存页面截图用于调试...');
          await page.screenshot({ path: 'login-page-no-email.png' });
          console.log('📸 截图已保存: login-page-no-email.png');
          throw new Error('未找到邮箱输入框，请检查页面结构');
        }
      }
      
      // 查找密码输入框（在同一页面）
      console.log('查找密码输入框...');
      const passwordSelectors = [
        'input[type="password"]', 
        'input[name="password"]', 
        'input[placeholder*="password" i]',
        'input[placeholder*="Password" i]',
        'input[placeholder*="密码" i]',
        'input[id*="password" i]',
        'input[id*="Password" i]',
        'input.password',
        'input[name="pwd"]',
        'input[id="pwd"]'
      ];
      
      let passwordInput = null;
      for (const selector of passwordSelectors) {
        try {
          passwordInput = await page.$(selector);
          if (passwordInput) {
            console.log(`找到密码输入框: ${selector}`);
            break;
          }
        } catch (e) {
          console.log(`选择器 ${selector} 未找到元素`);
        }
      }
      
      if (!passwordInput) {
        console.log('截图保存页面状态...');
        await page.screenshot({ path: 'login-page-no-password.png' });
        throw new Error('未找到密码输入框，请检查页面结构');
      }
      
      // 输入邮箱
      console.log(`输入邮箱: ${email}...`);
      await emailInput.click();
      // 清空输入框 - 使用键盘快捷键
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      // 输入邮箱
      await page.keyboard.type(email, { delay: 100 });
      await sleep(500);
      
      // 输入密码
      console.log(`输入密码...`);
      await passwordInput.click();
      // 清空输入框 - 使用键盘快捷键
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      // 输入密码
      await page.keyboard.type(password, { delay: 100 });
      await sleep(500);
      
      // 查找登录按钮
      console.log('查找登录按钮...');
      const buttonSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button.submit',
        'button.login',
        'button[class*="login"]',
        'button[class*="submit"]',
        'button[id*="login"]',
        'button[id*="submit"]',
        'button:not([disabled])',
        'button',
        'a.btn',
        'a[class*="btn"]',
        'input.btn',
        'div[role="button"]',
        '[type="submit"]'
      ];
      
      let loginButton = null;
      for (const selector of buttonSelectors) {
        try {
          const buttons = await page.$$(selector);
          for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent.toLowerCase().trim(), btn);
            const value = await page.evaluate(el => (el.value || '').toLowerCase().trim(), btn);
            const isVisible = await page.evaluate(el => {
              const style = window.getComputedStyle(el);
              return style && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
            }, btn);
            
            // 检查按钮文本或值是否包含登录相关关键词
            const loginKeywords = ['log in', 'login', 'sign in', 'submit', '登录', '提交', '确认', 'enter'];
            const hasLoginText = loginKeywords.some(keyword => 
              text.includes(keyword) || value.includes(keyword)
            );
            
            if (isVisible && hasLoginText) {
              loginButton = btn;
              console.log(`找到登录按钮: ${selector}, 文本: "${text}", 值: "${value}"`);
              break;
            }
          }
          if (loginButton) break;
        } catch (e) {
          console.log(`选择器 ${selector} 检查失败: ${e.message}`);
        }
      }
      
      if (!loginButton) {
        console.log('截图保存页面状态...');
        await page.screenshot({ path: 'login-page-no-button.png' });
        throw new Error('未找到登录按钮，请检查页面结构');
      }
      
      // 点击登录按钮
      console.log('点击登录按钮...');
      try {
        await loginButton.click();
        console.log('登录按钮点击成功，等待页面加载...');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {
          console.log('等待导航超时，继续执行...');
        });
      } catch (e) {
        console.log(`点击按钮失败，尝试使用JavaScript点击: ${e.message}`);
        await page.evaluate(btn => btn.click(), loginButton).catch(e => {
          console.log(`JavaScript点击也失败: ${e.message}`);
        });
        await sleep(3000); // 等待3秒
      }
      
      // 等待可能的验证码挑战
      console.log('等待可能的验证码处理...');
      await sleep(1000); // 减少等待时间到1秒
      
      // 检查是否登录成功 - 仅用于日志，不再中断流程
      console.log('检查登录状态...');
      const currentUrl = page.url();
      console.log(`当前页面URL: ${currentUrl}`);
      
      const loginCheck = await page.evaluate(() => {
        const hasUserElements = document.querySelector('.dashboard, .user-profile, .account-info, .user-menu, .profile') !== null;
        const urlIndicatesSuccess = window.location.href.includes('/dashboard') || 
                                   window.location.href.includes('/editor') ||
                                   window.location.href.includes('/profile') ||
                                   window.location.href.includes('/workspace');
        const notOnLoginPage = !window.location.href.includes('/login') && 
                              !window.location.href.includes('/signin') &&
                              !window.location.href.includes('/auth');
        
        return {
          hasUserElements,
          urlIndicatesSuccess,
          notOnLoginPage,
          currentUrl: window.location.href
        };
      });
      
      console.log('登录检查结果:', loginCheck);
      const isLoggedIn = loginCheck.hasUserElements || loginCheck.urlIndicatesSuccess || loginCheck.notOnLoginPage;
      console.log(`登录状态检查结果: ${isLoggedIn ? '成功' : '不确定/仍在登录页，继续通过网络请求尝试获取Token'}`);
      
      if (!isLoggedIn) {
        // 只记录截图用于调试，不再抛错中断流程
        try {
          await page.screenshot({ path: 'login-failed.png' });
          console.log('已保存登录状态页面截图: login-failed.png');
        } catch (e) {
          console.log('保存登录失败截图出错:', e.message);
        }
      }
      
      console.log('继续尝试提取token...');
      
      // 等待token加载 - 登录后可能需要时间设置token
      console.log('等待token设置...');
      await sleep(5000);
      
      // 尝试导航到可能包含token的页面
      console.log('尝试导航到dashboard或profile页面...');
      try {
        await page.goto('https://windsurf.com/dashboard', { 
          waitUntil: 'networkidle2', 
          timeout: 30000 
        }).catch(() => {
          console.log('导航到dashboard失败，尝试profile页面');
          return page.goto('https://windsurf.com/profile', { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
          });
        }).catch(() => {
          console.log('导航失败，继续在当前页面查找token');
        });
        await sleep(3000);
      } catch (e) {
        console.log('页面导航失败，继续在当前页面查找token');
      }
      
      // 等待登录完成并检查拦截到的Firebase token
      console.log('');
      console.log('🔍 检查拦截到的Firebase认证信息...');
      
      // 等待一段时间让登录过程完成
      let waitTime = 0;
      const maxWaitTime = 30000; // 最多等待30秒
      const checkInterval = 2000; // 每2秒检查一次
      
      while (waitTime < maxWaitTime) {
        if (firebaseTokens.refreshToken || firebaseTokens.idToken || firebaseTokens.accessToken) {
          console.log('✅ 检测到Firebase认证token！');
          break;
        }
        
        console.log(`⏳ 等待Firebase认证完成... (${waitTime/1000}s/${maxWaitTime/1000}s)`);
        await sleep(checkInterval);
        waitTime += checkInterval;
      }
      
      // 检查我们获取到的token
      console.log('');
      console.log('📊 Firebase Token检查结果:');
      console.log(`🔄 Refresh Token: ${firebaseTokens.refreshToken ? '✅ 已获取' : '❌ 未获取'}`);
      console.log(`🆔 ID Token: ${firebaseTokens.idToken ? '✅ 已获取' : '❌ 未获取'}`);
      console.log(`🔑 Access Token: ${firebaseTokens.accessToken ? '✅ 已获取' : '❌ 未获取'}`);
      
      // 确定使用哪个token
      let firebaseIdToken = null;
      if (firebaseTokens.idToken) {
        firebaseIdToken = firebaseTokens.idToken;
        console.log('🎯 使用ID Token作为firebase_id_token');
      } else if (firebaseTokens.accessToken) {
        firebaseIdToken = firebaseTokens.accessToken;
        console.log('🎯 使用Access Token作为firebase_id_token');
      } else if (firebaseTokens.refreshToken) {
        console.log('🔄 只有Refresh Token，需要先获取Access Token...');
        
        // 使用refresh token获取access token
        try {
          const axios = require('axios');
          console.log('🔄 调用Firebase API获取Access Token...');
          
          const refreshResponse = await axios.post('https://securetoken.googleapis.com/v1/token', 
            `grant_type=refresh_token&refresh_token=${firebaseTokens.refreshToken}`,
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              timeout: 15000
            }
          );
          
          if (refreshResponse.data.access_token) {
            firebaseIdToken = refreshResponse.data.access_token;
            console.log('✅ 通过Refresh Token获取到Access Token');
          } else if (refreshResponse.data.id_token) {
            firebaseIdToken = refreshResponse.data.id_token;
            console.log('✅ 通过Refresh Token获取到ID Token');
          }
        } catch (refreshError) {
          console.error('❌ 使用Refresh Token获取Access Token失败:', refreshError.message);
        }
      }
      
      if (!firebaseIdToken) {
        // 保存页面内容用于调试
        await page.screenshot({ path: 'firebase-token-not-found.png' });
        console.log('📸 已保存调试截图: firebase-token-not-found.png');
        
        // 输出捕获到的所有信息用于调试
        console.log('');
        console.log('🔍 调试信息 - 捕获到的所有认证相关数据:');
        capturedTokens.forEach((item, index) => {
          console.log(`${index + 1}. ${item.type} - ${item.url}`);
          if (item.data) {
            const preview = typeof item.data === 'string' ? item.data.substring(0, 200) : JSON.stringify(item.data).substring(0, 200);
            console.log(`   数据预览: ${preview}...`);
          }
        });
        
        throw new Error('无法获取Firebase ID Token，登录可能未完成或使用了不同的认证方式');
      }
      
      console.log('');
      console.log('🚀 开始调用Windsurf API获取API Key...');
      console.log(`🔑 使用Firebase Token: ${firebaseIdToken.substring(0, 50)}...`);
      
      // 使用Firebase ID Token调用Windsurf API获取API Key
      const axios = require('axios');
      
      let apiKey = null;
      let username = null;
      let token = null;
      
      try {
        console.log('📡 调用RegisterUser接口...');
        const response = await axios.post(
          'https://register.windsurf.com/exa.seat_management_pb.SeatManagementService/RegisterUser',
          {
            firebase_id_token: firebaseIdToken
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
            },
            timeout: 30000
          }
        );
        
        console.log('✅ RegisterUser接口调用成功');
        console.log(`📊 响应状态: ${response.status}`);
        console.log(`📄 响应数据: ${JSON.stringify(response.data, null, 2)}`);
        
        apiKey = response.data?.api_key;
        username = response.data?.name;
        
        if (!apiKey) {
          throw new Error('API响应中未包含api_key');
        }
        
        console.log(`🎉 获取到API Key: ${apiKey.substring(0, 30)}...`);
        console.log(`👤 用户名: ${username}`);
        
        token = apiKey;
      } catch (apiError) {
        console.error('❌ 调用Windsurf API失败:', apiError.message);
        if (apiError.response) {
          console.error(`📊 响应状态: ${apiError.response.status}`);
          console.error(`📄 响应数据: ${JSON.stringify(apiError.response.data, null, 2)}`);
        }
        throw new Error(`获取Windsurf API Key失败: ${apiError.message}`);
      }
      
      console.log('');
      console.log('🎉 Token获取成功!');
      
      // 格式化输出账号信息，一行一个
      console.log('\n============================================================');
      console.log('📋 账号信息（一行一个）');
      console.log('============================================================');
      console.log(`� ${email}|🔑 ${password}|🔑 ${apiKey}`);
      console.log('============================================================\n');
      
      // 详细信息
      console.log(`👤 用户名: ${username}`);
      console.log(`⏰ 完成时间: ${new Date().toLocaleString()}`);
      
      // 输出网络请求统计
      console.log('');
      console.log('📊 网络请求统计:');
      console.log(`📤 总请求数: ${requestCount}`);
      console.log(`📥 总响应数: ${responseCount}`);
      console.log(`🎯 捕获的Token相关信息: ${capturedTokens.length} 条`);
      
      // 输出捕获到的token信息（简化版）
      try {
        if (capturedTokens.length > 0) {
          console.log('');
          console.log(`🔍 捕获到 ${capturedTokens.length} 条Token相关信息`);
          // 只输出Firebase相关的关键token信息
          const firebaseResponses = capturedTokens.filter(item => 
            item.type === 'firebase_response' && 
            item.url && (item.url.includes('securetoken') || item.url.includes('identitytoolkit')));
          
          console.log(`🔥 其中 ${firebaseResponses.length} 条是Firebase认证响应`);
        } else {
          console.log('⚠️ 未捕获到任何token相关的网络请求');
        }
      } catch (debugError) {
        console.log('⚠️ 调试信息输出失败，但不影响主要功能');
      }
      
      console.log('============================================================');
      console.log('✅ 浏览器Token提取流程完成');
      console.log('============================================================');
      
      // 直接返回结果，由上层 finally 负责关闭浏览器
      
      // 返回更完整的信息
      return {
        success: true,
        token,
        email,
        password: this.currentPassword,
        username,
        apiKey
      };
    } catch (error) {
      console.log('');
      console.log('============================================================');
      console.log('❌ 浏览器Token提取流程失败');
      console.log('============================================================');
      console.error(`💥 错误详情: ${error.message}`);
      console.error(`📍 错误堆栈: ${error.stack}`);
      console.log(`⏰ 失败时间: ${new Date().toLocaleString()}`);
      
      // 输出网络请求统计（即使失败也要统计）
      if (typeof requestCount !== 'undefined') {
        console.log('');
        console.log('📊 网络请求统计:');
        console.log(`📤 总请求数: ${requestCount}`);
        console.log(`📥 总响应数: ${responseCount}`);
        console.log(`🎯 捕获的Token相关信息: ${capturedTokens ? capturedTokens.length : 0} 条`);
      }
      
      return { success: false, error: error.message };
    }
  },
  
  // 检查浏览器是否可用
  async checkBrowserAvailability() {
    try {
      console.log(`检查浏览器可用性，当前平台: ${process.platform}`);
      
      if (process.platform === 'win32') {
        // Windows检查Chrome是否安装
        console.log('检查Windows系统上Chrome是否安装...');
        try {
          const { stdout } = await execAsync('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /ve');
          const available = stdout.includes('chrome.exe');
          console.log(`Windows Chrome检测结果: ${available ? '可用' : '不可用'}`);
          return { available, browser: 'Chrome' };
        } catch (winError) {
          console.log('Windows Chrome检测失败，尝试其他方法...');
          // 备用方法，检查程序文件是否存在
          try {
            const { stdout: stdout2 } = await execAsync('if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" echo FOUND');
            const available = stdout2.includes('FOUND');
            console.log(`Windows Chrome备用检测结果: ${available ? '可用' : '不可用'}`);
            return { available, browser: 'Chrome' };
          } catch (winError2) {
            console.error('Windows Chrome备用检测失败:', winError2);
            return { available: false, error: winError2.message };
          }
        }
      } else if (process.platform === 'darwin') {
        // Mac检查Chrome是否安装
        console.log('检查Mac系统上Chrome是否安装...');
        try {
          const { stdout } = await execAsync('ls /Applications | grep -i "chrome"');
          const available = stdout.toLowerCase().includes('chrome');
          console.log(`Mac Chrome检测结果: ${available ? '可用' : '不可用'}`);
          if (available) {
            console.log('检测到的Chrome应用:', stdout.trim());
          }
          return { available, browser: 'Chrome' };
        } catch (macError) {
          console.log('Mac Chrome检测失败，尝试其他方法...');
          // 备用方法，直接检查应用是否存在
          try {
            const { stdout: stdout2 } = await execAsync('[ -d "/Applications/Google Chrome.app" ] && echo "FOUND"');
            const available = stdout2.includes('FOUND');
            console.log(`Mac Chrome备用检测结果: ${available ? '可用' : '不可用'}`);
            return { available, browser: 'Chrome' };
          } catch (macError2) {
            console.error('Mac Chrome备用检测失败:', macError2);
            return { available: false, error: macError2.message };
          }
        }
      } else {
        // Linux或其他平台
        console.log('检查Linux或其他系统上Chrome是否安装...');
        try {
          const { stdout } = await execAsync('which google-chrome || which chrome');
          const available = stdout.trim().length > 0;
          console.log(`Linux Chrome检测结果: ${available ? '可用' : '不可用'}`);
          if (available) {
            console.log('检测到的Chrome路径:', stdout.trim());
          }
          return { available, browser: 'Chrome' };
        } catch (error) {
          console.error('Linux Chrome检测失败:', error);
          return { available: false, error: error.message };
        }
      }
    } catch (error) {
      console.error('检查浏览器可用性失败:', error);
      return { available: false, error: error.message };
    }
  }
};

// 导出模块
module.exports = BrowserTokenExtractor;
