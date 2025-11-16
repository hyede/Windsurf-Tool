const { connect } = require('puppeteer-real-browser');
const { app } = require('electron'); // 导入electron的app模块
const os = require('os'); // 导入os模块

class RegistrationBot {
  constructor(config) {
    this.config = config;
    // 自定义域名邮箱列表
    this.emailDomains = config.emailDomains || ['example.com'];
    // 邮箱编号计数器(1-999)
    this.emailCounter = 1;
  }

  /**
   * 生成域名邮箱
   * 格式: 编号(1-999) + 随机字母数字组合
   */
  async generateTempEmail() {
    // 获取当前编号
    const number = this.emailCounter;
    
    // 生成随机字母数字组合(8位)
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let randomStr = '';
    for (let i = 0; i < 8; i++) {
      randomStr += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // 组合用户名: 编号 + 随机字符串
    const username = `${number}${randomStr}`;
    
    // 随机选择配置的域名
    const randomIndex = Math.floor(Math.random() * this.emailDomains.length);
    const domain = this.emailDomains[randomIndex];
    
    // 递增计数器(1-999循环)
    this.emailCounter++;
    if (this.emailCounter > 999) {
      this.emailCounter = 1;
    }
    
    return `${username}@${domain}`;
  }

  /**
   * 获取邮箱验证码（使用本地EmailReceiver）
   * 支持重试机制：最多重试3次，每次间隔30秒
   */
  async getVerificationCode(email, maxWaitTime = 120000) {
    const emailConfig = this.config.emailConfig;
    
    if (!emailConfig) {
      throw new Error('未配置邮箱 IMAP 信息，请先在“配置”页面正确填写 QQ 邮箱账号和授权码');
    }
    
    const EmailReceiver = require('./emailReceiver');
    // 将批量注册的日志回调传入 EmailReceiver，便于在前端实时看到详细 IMAP 日志
    const receiver = new EmailReceiver(emailConfig, this.logCallback);
    
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 30000; // 30秒
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (this.logCallback) {
          this.logCallback(`第 ${attempt} 次尝试获取验证码（QQ 邮箱 IMAP）...`);
        }
        console.log(`[尝试 ${attempt}/${MAX_RETRIES}] 等待 ${email} 的验证码邮件...`);
        
        const code = await receiver.getVerificationCode(email, maxWaitTime);
        
        if (code) {
          if (this.logCallback) {
            this.logCallback(`成功获取验证码: ${code}`);
          }
          return code;
        }
      } catch (error) {
        console.error(`[尝试 ${attempt}/${MAX_RETRIES}] 获取验证码失败:`, error.message);
        if (this.logCallback) {
          this.logCallback(`获取验证码失败（第 ${attempt}/${MAX_RETRIES} 次）：${error.message}`);
        }
        
        if (attempt < MAX_RETRIES) {
          if (this.logCallback) {
            this.logCallback(`第 ${attempt} 次获取失败，${RETRY_DELAY/1000} 秒后将重试...`);
          }
          console.log(`等待 ${RETRY_DELAY/1000} 秒后重试...`);
          await this.sleep(RETRY_DELAY);
        } else {
          if (this.logCallback) {
            this.logCallback(`已重试 ${MAX_RETRIES} 次，仍未获取到验证码，请检查 QQ 邮箱 IMAP 配置、授权码和邮件是否正常发送`);
          }
          throw new Error(`获取验证码失败，已重试 ${MAX_RETRIES} 次: ${error.message}`);
        }
      }
    }
    
    throw new Error('获取验证码失败，已达到最大重试次数');
  }


  /**
   * 生成随机密码
   * 包含大小写字母、数字和符号，长度12-16位
   */
  generateRandomPassword() {
    const length = Math.floor(Math.random() * 5) + 12; // 12-16位
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + symbols;
    
    let password = '';
    
    // 确保至少包含一个大写字母
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    // 确保至少包含一个小写字母
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    // 确保至少包含一个数字
    password += numbers[Math.floor(Math.random() * numbers.length)];
    // 确保至少包含一个符号
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // 填充剩余长度
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // 打乱密码字符顺序
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * 生成随机英文名
   */
  generateRandomName() {
    const firstNames = [
      'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
      'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
      'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth',
      'Emily', 'Ashley', 'Kimberly', 'Melissa', 'Donna', 'Michelle', 'Dorothy', 'Carol', 'Amanda', 'Betty'
    ];
    
    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
      'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White',
      'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott',
      'Green', 'Baker', 'Adams', 'Nelson', 'Hill', 'Carter', 'Mitchell', 'Roberts', 'Turner', 'Phillips'
    ];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return { firstName, lastName };
  }

  /**
   * 输出日志(同时发送到前端)
   */
  log(message) {
    console.log(message);
    if (this.logCallback) {
      this.logCallback(message);
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
    
    // 添加环境变量路径（需要检查是否存在）
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
        // 忽略错误，继续尝试下一个路径
      }
    }

    return null;
  }

  /**
   * 注册单个账号
   */
  async registerAccount(logCallback) {
    this.logCallback = logCallback;
    let browser, page;
    
    try {
      this.log('开始连接浏览器...');
      
      // 检测操作系统
      const platform = os.platform();
      const isWindows = platform === 'win32';
      const isMac = platform === 'darwin';
      
      let response;
      let browserType = 'Chrome';
      
      if (isWindows) {
        // Windows系统：优先使用Edge浏览器，失败则使用Chrome
        this.log('检测到Windows系统，尝试使用Edge浏览器');
        
        const edgePath = this.detectEdgePath();
        
        if (edgePath) {
          try {
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
            
            browserType = 'Edge';
            this.log('Edge浏览器连接成功');
          } catch (edgeError) {
            this.log('Edge浏览器启动失败，尝试使用Chrome浏览器');
            this.log(`Edge错误: ${edgeError.message}`);
            
            // Edge失败，回退到Chrome
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
            
            browserType = 'Chrome';
            this.log('Chrome浏览器连接成功');
          }
        } else {
          // 没有Edge，直接使用Chrome
          this.log('未找到Edge浏览器，使用Chrome浏览器');
          
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
          
          browserType = 'Chrome';
          this.log('Chrome浏览器连接成功');
        }
      } else if (isMac) {
        // Mac系统：使用Chrome浏览器
        this.log('检测到Mac系统，使用Chrome浏览器');
        
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
        
        browserType = 'Chrome';
        this.log('Chrome浏览器连接成功');
      } else {
        throw new Error('不支持的操作系统，仅支持Windows和Mac系统');
      }
      
      this.log(`当前使用浏览器: ${browserType}`);
      
      browser = response.browser;
      page = response.page;
      
      if (!browser || !page) {
        throw new Error('浏览器或页面对象未创建');
      }
      
      this.log('浏览器已启动');
      
      // 生成临时邮箱和密码
      const email = await this.generateTempEmail();
      
      // 根据配置选择密码生成方式
      const passwordMode = this.config.passwordMode || 'email'; // 默认使用邮箱作为密码
      let password;
      
      if (passwordMode === 'random') {
        // 使用随机密码
        password = this.generateRandomPassword();
        this.log(`密码模式: 随机密码`);
      } else {
        // 使用邮箱作为密码（默认）
        password = email;
        this.log(`密码模式: 邮箱作为密码`);
      }
      
      const { firstName, lastName } = this.generateRandomName();
      
      this.log(`邮箱: ${email}`);
      this.log(`密码: ${password}`);
      this.log(`姓名: ${firstName} ${lastName}`);
      
      // 访问注册页面（带重试机制）
      this.log('正在访问注册页面...');
      let navigationSuccess = false;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!navigationSuccess && retryCount < maxRetries) {
        try {
          retryCount++;
          this.log(`尝试访问注册页面 (${retryCount}/${maxRetries})`);
          
          await page.goto('https://windsurf.com/account/register', {
            waitUntil: 'domcontentloaded', // 改为更宽松的等待条件
            timeout: 60000 // 增加到60秒
          });
          
          // 等待页面基本元素加载
          await page.waitForSelector('body', { timeout: 30000 });
          navigationSuccess = true;
          this.log('注册页面访问成功');
          
        } catch (error) {
          this.log(`第${retryCount}次访问失败: ${error.message}`);
          
          if (retryCount < maxRetries) {
            this.log(`等待5秒后重试...`);
            await this.sleep(5000);
          } else {
            throw new Error(`导航失败，已重试${maxRetries}次: ${error.message}`);
          }
        }
      }
      
      await this.sleep(2000);
      
      // ========== 启动网络监听（提前开始） ==========
      this.log('启动网络监听，准备捕获 Token...');
      
      let capturedTokens = {
        accessToken: null,
        refreshToken: null,
        idToken: null
      };
      
      const client = await page.target().createCDPSession();
      await client.send('Network.enable');
      
      // 监听网络响应
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
            }
            
            if (body.refreshToken || body.refresh_token) {
              capturedTokens.refreshToken = body.refreshToken || body.refresh_token;
              console.log('[Token捕获] ✅ 捕获到 refresh_token');
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      });
      
      // ========== 第一步: 填写基本信息 ==========
      this.log('步骤1: 填写基本信息');
      
      // 等待表单加载
      await page.waitForSelector('input', { timeout: 30000 });
      await this.sleep(2000);
      
      // 填写所有输入框
      const allInputs = await page.$$('input');
      
      for (const input of allInputs) {
        const type = await page.evaluate(el => el.type, input);
        const name = await page.evaluate(el => el.name, input);
        const placeholder = await page.evaluate(el => el.placeholder || '', input);
        
        // 填写邮箱
        if (type === 'email' || name === 'email' || placeholder.toLowerCase().includes('email')) {
          await input.click({ clickCount: 3 });
          await input.type(email, { delay: 50 });
          this.log(`已填写邮箱: ${email}`);
        }
        // 填写名字
        else if (name === 'firstName' || placeholder.toLowerCase().includes('first')) {
          await input.click();
          await input.type(firstName, { delay: 50 });
          this.log(`已填写名字: ${firstName}`);
        }
        // 填写姓氏
        else if (name === 'lastName' || placeholder.toLowerCase().includes('last')) {
          await input.click();
          await input.type(lastName, { delay: 50 });
          this.log(`已填写姓氏: ${lastName}`);
        }
      }
      
      // 同意条款复选框
      const checkbox = await page.$('input[type="checkbox"]');
      if (checkbox) {
        const isChecked = await page.evaluate(el => el.checked, checkbox);
        if (!isChecked) {
          await checkbox.click();
          this.log('已勾选同意条款');
        }
      }
      
      await this.sleep(1000);
      
      // 点击Continue按钮
      this.log('点击Continue按钮...');
      const clicked = await this.clickButton(page, ['Continue', '继续', 'Next']);
      
      if (!clicked) {
        throw new Error('无法找到Continue按钮');
      }
      
      await this.sleep(3000);
      
      // ========== 第二步: 填写密码 ==========
      this.log('步骤2: 填写密码信息');
      
      // 等待密码页面加载
      await page.waitForSelector('input[type="password"]', { timeout: 30000 });
      await this.sleep(2000);
      
      // 查找所有密码输入框
      const passwordInputs = await page.$$('input[type="password"]');
      this.log(`找到 ${passwordInputs.length} 个密码输入框`);
      
      if (passwordInputs.length === 0) {
        throw new Error('未找到密码输入框');
      }
      
      // 填写第一个密码输入框
      this.log('填写密码...');
      await passwordInputs[0].click();
      await passwordInputs[0].type(password, { delay: 50 });
      
      // 填写确认密码（如果有）
      if (passwordInputs.length >= 2) {
        this.log('填写确认密码...');
        await passwordInputs[1].click();
        await passwordInputs[1].type(password, { delay: 50 });
      }
      
      await this.sleep(1000);
      
      // 点击第二个Continue按钮
      this.log('点击第二个Continue按钮...');
      const clicked2 = await this.clickButton(page, ['Continue', '继续', 'Next']);
      
      if (!clicked2) {
        throw new Error('无法找到第二个Continue按钮');
      }
      
      await this.sleep(3000);
      
      // ========== 第三步: Cloudflare人机验证 ==========
      this.log('步骤3: 等待Cloudflare验证...');
      
      // puppeteer-real-browser会自动处理Cloudflare Turnstile验证
      await this.sleep(10000);
      
      // 点击验证后的Continue按钮
      this.log('查找验证后的Continue按钮...');
      const clicked3 = await this.clickButton(page, ['Continue', '继续', 'Next'], 3);
      
      if (!clicked3) {
        this.log('未找到Continue按钮,可能已自动跳转');
      }
      
      await this.sleep(3000);
      
      // ========== 第四步: 输入验证码 ==========
      this.log('步骤4: 等待邮箱验证码...');
      
      // 等待验证码输入框
      await page.waitForSelector('input[type="text"], input[name="code"]', { timeout: 30000 });
      
      // 延迟15秒后再获取验证码，避免批量注册时验证码混淆
      this.log('延迟 15 秒后获取验证码，避免混淆...');
      await this.sleep(15000);
      
      // 获取验证码
      this.log('正在接收验证码...');
      const verificationCode = await this.getVerificationCode(email);
      this.log(`获取到验证码: ${verificationCode}`);
      
      // 输入6位验证码
      const codeInputs = await page.$$('input[type="text"], input[name="code"]');
      
      if (codeInputs.length === 6) {
        // 如果是6个独立输入框
        for (let i = 0; i < 6; i++) {
          await codeInputs[i].click();
          await codeInputs[i].type(verificationCode[i], { delay: 100 });
        }
      } else if (codeInputs.length === 1) {
        // 如果是单个输入框
        await codeInputs[0].click();
        await codeInputs[0].type(verificationCode, { delay: 100 });
      }
      
      await this.sleep(1000);
      
      // 点击Create account按钮
      console.log('点击Create account按钮...');
      const createBtn = await page.$('button[type="submit"]');
      if (createBtn) {
        await createBtn.click();
      }
      await this.sleep(5000);
      
      // ========== 检查注册是否成功 ==========
      const currentUrl = page.url();
      const isSuccess = !currentUrl.includes('/login') && !currentUrl.includes('/signup');
      
      if (isSuccess) {
        console.log('注册成功!');
        this.log('注册成功!');
        
        // ========== 获取 Token ==========
        this.log('步骤6: 获取账号 Token...');
        this.log('检查网络监听是否捕获到 Token...');
        
        let tokenInfo = null;
        
        // 等待最多 10 秒，检查是否已捕获到 token
        const maxWaitTime = 10000;
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
          if (capturedTokens.accessToken) {
            this.log('✅ Token 已捕获，继续获取 API Key...');
            break;
          }
          await this.sleep(500);
        }
        
        try {
          if (!capturedTokens.accessToken) {
            // 如果网络拦截失败，尝试从 localStorage 读取
            this.log('⚠️ 网络拦截未捕获到 token，尝试从浏览器读取...');
            
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
              this.log('✅ 从浏览器读取到 token');
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
          
          this.log('✅ Token 获取成功');
          this.log(`  - API Key: ${apiKeyInfo.apiKey.substring(0, 20)}...`);
          this.log(`  - 用户名: ${apiKeyInfo.name}`);
        } catch (tokenError) {
          this.log(`⚠️ 获取 Token 失败: ${tokenError.message}`);
          console.error('获取 Token 失败:', tokenError);
        } finally {
          // 关闭 CDP 会话
          await client.detach();
        }
        
        // 保存账号到本地
        const fs = require('fs').promises;
        const path = require('path');
        const { app } = require('electron');
        const ACCOUNTS_FILE = path.join(app.getPath('userData'), 'accounts.json');
        
        let accounts = [];
        try {
          const data = await fs.readFile(ACCOUNTS_FILE, 'utf-8');
          accounts = JSON.parse(data);
        } catch (error) {
          // 文件不存在，使用空数组
        }
        
        const account = {
          id: Date.now().toString(),
          email,
          password,
          firstName,
          lastName,
          name: tokenInfo ? tokenInfo.name : `${firstName} ${lastName}`,
          apiKey: tokenInfo ? tokenInfo.apiKey : null,
          apiServerUrl: tokenInfo ? tokenInfo.apiServerUrl : null,
          refreshToken: tokenInfo ? tokenInfo.refreshToken : null,
          createdAt: new Date().toISOString()
        };
        
        accounts.push(account);
        await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
        
        console.log('账号已保存到本地');
        this.log('账号已保存到本地');
        
        return {
          success: true,
          email,
          password,
          firstName,
          lastName,
          name: account.name,
          apiKey: account.apiKey,
          createdAt: account.createdAt
        };
      } else {
        throw new Error('注册失败，请检查页面');
      }
      
    } catch (error) {
      console.error('注册过程出错:', error);
      console.error('错误堆栈:', error.stack);
      return {
        success: false,
        error: error.message || '未知错误',
        errorStack: error.stack
      };
    } finally {
      if (browser) {
        try {
          await browser.close();
          console.log('浏览器已关闭');
        } catch (e) {
          console.error('关闭浏览器失败:', e);
        }
      }
    }
  }

  /**
   * 批量注册(控制并发数量)
   * 支持自定义并发数量，支持平台特定优化
   */
  async batchRegister(count, maxConcurrent = 4, progressCallback, logCallback) {
    // 直接使用用户设置的并发数，不超过总注册数
    const MAX_CONCURRENT = Math.min(maxConcurrent || 4, count);
    
    // 平台特定的延迟参数
    const platform = os.platform();
    const isWindows = platform === 'win32';
    const windowStartDelay = isWindows ? 5000 : 3000; // Windows需要更长的窗口启动延迟
    const batchInterval = isWindows ? 15000 : 10000; // Windows需要更长的批次间隔
    
    if (logCallback) {
      logCallback(`开始批量注册 ${count} 个账号`);
      logCallback(`最大并发数: ${MAX_CONCURRENT} 个窗口`);
      logCallback(`验证码延迟: 15 秒`);
      logCallback(`平台: ${platform === 'win32' ? 'Windows' : platform === 'darwin' ? 'macOS' : 'Linux'}`);
    }
    
    const results = [];
    let completed = 0;
    
    // 分批执行，每批最多 MAX_CONCURRENT 个
    for (let i = 0; i < count; i += MAX_CONCURRENT) {
      const batchSize = Math.min(MAX_CONCURRENT, count - i);
      const batchTasks = [];
      
      if (logCallback) {
        logCallback(`\n========== 第 ${Math.floor(i/MAX_CONCURRENT) + 1} 批次，注册 ${batchSize} 个账号 ==========`);
      }
      
      // 创建当前批次的任务
      for (let j = 0; j < batchSize; j++) {
        const taskIndex = i + j + 1;
        
        // 为每个任务创建独立的日志回调
        const taskLogCallback = (log) => {
          if (logCallback) {
            logCallback(`[窗口${taskIndex}] ${log}`);
          }
        };
        
        // 每个窗口间隔启动，避免验证码混淆
        const startDelay = j * 3000; // 每个窗口延迟3秒启动
        
        const task = (async () => {
          await this.sleep(startDelay);
          
          if (logCallback) {
            logCallback(`\n[窗口${taskIndex}] 开始注册...`);
          }
          
          const result = await this.registerAccount(taskLogCallback);
          
          completed++;
          if (progressCallback) {
            progressCallback({ current: completed, total: count });
          }
          
          if (logCallback) {
            if (result.success) {
              logCallback(`[窗口${taskIndex}] 注册成功! 邮箱: ${result.email}`);
            } else {
              logCallback(`[窗口${taskIndex}] 注册失败: ${result.error}`);
            }
          }
          
          return result;
        })();
        
        batchTasks.push(task);
      }
      
      // 等待当前批次完成
      const batchResults = await Promise.all(batchTasks);
      results.push(...batchResults);
      
      // 如果还有下一批，等待一段时间再开始
      if (i + MAX_CONCURRENT < count) {
        if (logCallback) {
          logCallback(`\n等待5秒后开始下一批次...`);
        }
        await this.sleep(5000);
      }
    }
    
    if (logCallback) {
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;
      logCallback(`\n========== 批量注册完成 ==========`);
      logCallback(`成功: ${successCount} 个`);
      logCallback(`失败: ${failedCount} 个`);
    }
    
    return results;
  }

  /**
   * 取消批量注册（跨平台支持）
   */
  async cancel(logCallback = null) {
    const BrowserKiller = require('./registrationBotCancel');
    await BrowserKiller.cancelBatchRegistration(this, logCallback);
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
        
        // 方法1: 查找包含 firebase:authUser 的 key
        for (const key of keys) {
          if (key.includes('firebase:authUser')) {
            try {
              const data = JSON.parse(localStorage.getItem(key));
              // 路径: data.stsTokenManager.refreshToken
              if (data && data.stsTokenManager && data.stsTokenManager.refreshToken) {
                return data.stsTokenManager.refreshToken;
              }
            } catch (e) {
              continue;
            }
          }
        }
        
        // 方法2: 直接构造 key
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
   * 使用 refresh_token 获取 access_token
   */
  async getAccessToken(refreshToken) {
    const axios = require('axios');
    const FIREBASE_API_KEY = 'AIzaSyDsOl-1XpT5err0Tcnx8FFod1H8gVGIycY';
    
    try {
      this.log('正在获取 access_token...');
      
      const formData = new URLSearchParams();
      formData.append('grant_type', 'refresh_token');
      formData.append('refresh_token', refreshToken);
      
      // 使用 Cloudflare Workers 中转（国内可访问）
      const WORKER_URL = 'https://windsurf.crispvibe.cn';
      
      this.log('使用 Cloudflare Workers 中转请求...');
      
      const response = await axios.post(
        WORKER_URL,
        {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          api_key: FIREBASE_API_KEY
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'
          }
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
    const axios = require('axios');
    
    try {
      this.log('正在获取 API Key...');
      
      const response = await axios.post(
        'https://register.windsurf.com/exa.seat_management_pb.SeatManagementService/RegisterUser',
        {
          firebase_id_token: accessToken
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
            'x-client-version': 'Chrome/JsCore/11.0.0/FirebaseCore-web'
          }
        }
      );
      
      this.log('✅ 成功获取 API Key');
      
      return {
        apiKey: response.data.api_key,
        name: response.data.name,
        apiServerUrl: response.data.api_server_url
      };
    } catch (error) {
      this.log(`获取 API Key 失败: ${error.response?.data?.message || error.message}`);
      throw error;
    }
  }

  /**
   * 点击按钮的辅助方法
   * @param {Page} page - Puppeteer页面对象
   * @param {Array} textList - 按钮文本列表
   * @param {Number} retries - 重试次数
   */
  async clickButton(page, textList = ['Continue'], retries = 1) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // 方式1: 通过 type=submit
        const submitBtn = await page.$('button[type="submit"]');
        if (submitBtn) {
          await submitBtn.click();
          this.log('按钮点击成功 (submit)');
          return true;
        }
      } catch (e) {
        // 继续尝试其他方式
      }
      
      try {
        // 方式2: 通过文本内容查找
        const buttons = await page.$$('button');
        for (const btn of buttons) {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text) {
            for (const searchText of textList) {
              if (text.includes(searchText)) {
                await btn.click();
                this.log(`按钮点击成功 (${searchText})`);
                return true;
              }
            }
          }
        }
      } catch (e) {
        // 继续重试
      }
      
      if (attempt < retries - 1) {
        this.log(`第${attempt + 1}次未找到按钮,等待后重试...`);
        await this.sleep(2000);
      }
    }
    
    return false;
  }

  /**
   * 延迟函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = RegistrationBot;
