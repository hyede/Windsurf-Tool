const RegistrationBot = require('./registrationBot');
const WindsurfManagerFactory = require('./windsurfManagerFactory');
const path = require('path');
const fs = require('fs').promises;

/**
 * 批量注册管理器 - 跨平台
 * 集成批量注册和自动登录功能
 */
class BatchRegistrationManager {
  constructor(config, logCallback = null) {
    this.config = config;
    this.logCallback = logCallback;
    this.registrationBot = null;
    this.windsurfManager = null;
    this.registeredAccounts = [];
    this.isCancelled = false;
  }

  /**
   * 日志输出
   */
  log(message) {
    console.log(message);
    if (this.logCallback) {
      this.logCallback(message);
    }
  }

  /**
   * 批量注册并自动登录
   * @param {number} count - 注册账号数量
   * @param {number} maxConcurrent - 最大并发数
   * @param {function} progressCallback - 进度回调
   * @param {function} logCallback - 日志回调
   * @param {boolean} autoLogin - 是否自动登录
   */
  async batchRegisterAndLogin(count, maxConcurrent = 1, progressCallback, logCallback, autoLogin = false) {
    this.logCallback = logCallback;
    this.isCancelled = false;
    this.registeredAccounts = [];

    try {
      this.log('\n' + '='.repeat(60));
      this.log('🚀 批量注册管理器启动');
      this.log('='.repeat(60));
      this.log(`📊 注册数量: ${count}`);
      this.log(`🔄 最大并发: ${maxConcurrent}`);
      this.log(`🔐 自动登录: ${autoLogin ? '启用' : '禁用'}`);

      // 步骤1: 批量注册
      this.log('\n【步骤1/2】开始批量注册');
      this.registrationBot = new RegistrationBot(this.config);
      
      const registrationResults = await this.registrationBot.batchRegister(
        count,
        maxConcurrent,
        progressCallback,
        (log) => this.log(log)
      );

      // 收集成功的账号
      const successAccounts = registrationResults.filter(r => r.success);
      this.registeredAccounts = successAccounts;

      this.log(`\n✅ 注册完成: ${successAccounts.length}/${count} 个账号成功`);

      // 步骤2: 自动登录（如果启用）
      if (autoLogin && successAccounts.length > 0) {
        this.log('\n【步骤2/2】开始自动登录');
        await this.autoLoginAccounts(successAccounts, progressCallback);
      }

      this.log('\n' + '='.repeat(60));
      this.log('✅ 批量注册管理完成！');
      this.log('='.repeat(60));

      return {
        success: true,
        registeredCount: successAccounts.length,
        totalCount: count,
        accounts: successAccounts
      };

    } catch (error) {
      this.log(`\n❌ 批量注册失败: ${error.message}`);
      return {
        success: false,
        error: error.message,
        registeredCount: this.registeredAccounts.length,
        accounts: this.registeredAccounts
      };
    }
  }

  /**
   * 自动登录已注册的账号
   */
  async autoLoginAccounts(accounts, progressCallback) {
    try {
      this.windsurfManager = WindsurfManagerFactory.create((log) => this.log(log));
      
      let loginSuccess = 0;
      let loginFailed = 0;

      for (let i = 0; i < accounts.length; i++) {
        if (this.isCancelled) {
          this.log('⚠️ 自动登录已取消');
          break;
        }

        const account = accounts[i];
        this.log(`\n🔐 登录账号 ${i + 1}/${accounts.length}: ${account.email}`);

        try {
          const result = await this.windsurfManager.autoLogin(account.email, account.password);
          
          if (result.success) {
            this.log(`✅ 账号 ${account.email} 登录成功`);
            loginSuccess++;
          } else {
            this.log(`❌ 账号 ${account.email} 登录失败: ${result.error}`);
            loginFailed++;
          }
        } catch (error) {
          this.log(`❌ 账号 ${account.email} 登录异常: ${error.message}`);
          loginFailed++;
        }

        // 更新进度
        if (progressCallback) {
          progressCallback({ 
            current: i + 1, 
            total: accounts.length,
            phase: 'login'
          });
        }

        // 账号之间间隔5秒，避免过快
        if (i < accounts.length - 1) {
          await this.sleep(5000);
        }
      }

      this.log(`\n📊 自动登录统计: 成功 ${loginSuccess} 个，失败 ${loginFailed} 个`);

    } catch (error) {
      this.log(`⚠️ 自动登录过程出错: ${error.message}`);
    }
  }

  /**
   * 取消操作
   */
  async cancel(logCallback = null) {
    this.isCancelled = true;
    const log = logCallback || this.logCallback || ((msg) => console.log(msg));

    log('\n⚠️ 正在取消操作...');

    // 取消注册
    if (this.registrationBot) {
      try {
        await this.registrationBot.cancel(log);
      } catch (error) {
        log(`⚠️ 取消注册失败: ${error.message}`);
      }
    }

    // 关闭 Windsurf 管理器
    if (this.windsurfManager) {
      try {
        await this.windsurfManager.closeWindsurf();
      } catch (error) {
        log(`⚠️ 关闭 Windsurf 管理器失败: ${error.message}`);
      }
    }

    log('✓ 已取消');
  }

  /**
   * 保存账号到文件
   */
  async saveAccountsToFile(filePath) {
    try {
      const data = {
        timestamp: new Date().toISOString(),
        count: this.registeredAccounts.length,
        accounts: this.registeredAccounts
      };

      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      this.log(`✓ 账号已保存到: ${filePath}`);
      return true;
    } catch (error) {
      this.log(`❌ 保存账号失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 延迟函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = BatchRegistrationManager;
