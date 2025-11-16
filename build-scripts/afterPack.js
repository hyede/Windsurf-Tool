const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const JavaScriptObfuscator = require('javascript-obfuscator');

async function obfuscateJsInDir(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') {
        continue;
      }
      await obfuscateJsInDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      try {
        const code = fs.readFileSync(fullPath, 'utf8');
        const result = JavaScriptObfuscator.obfuscate(code, {
          compact: true,
          controlFlowFlattening: true,
          deadCodeInjection: false,
          debugProtection: false,
          disableConsoleOutput: true,
          stringArray: true,
          stringArrayEncoding: ['base64'],
          stringArrayThreshold: 0.75
        });
        fs.writeFileSync(fullPath, result.getObfuscatedCode(), 'utf8');
      } catch (error) {
        console.warn('⚠️ JS 混淆失败:', fullPath, error.message);
      }
    }
  }
}

async function obfuscateAppJs(appOutDir, platformName) {
  let appDir = null;

  if (platformName === 'mac') {
    appDir = path.join(appOutDir, 'Windsurf-Tool.app', 'Contents', 'Resources', 'app');
  } else if (platformName === 'win') {
    appDir = path.join(appOutDir, 'resources', 'app');
  } else if (platformName === 'linux') {
    appDir = path.join(appOutDir, 'resources', 'app');
  }

  if (!appDir || !fs.existsSync(appDir)) {
    return;
  }

  console.log('开始对打包产物进行 JS 混淆:', appDir);
  await obfuscateJsInDir(appDir);
  console.log('✅ JS 混淆完成');
}

/**
 * electron-builder afterPack 钩子
 * 确保打包后 Python 脚本有执行权限（macOS）
 */
exports.default = async function(context) {
  const { appOutDir, platformName } = context;
  
  if (platformName === 'mac') {
    // macOS 打包后，Python 脚本在 Resources/scripts/ 目录
    const scriptsPath = path.join(appOutDir, 'Windsurf-Tool.app', 'Contents', 'Resources', 'scripts');
    
    if (fs.existsSync(scriptsPath)) {
      console.log('设置 Python 脚本执行权限...');
      try {
        // 给所有 .py 文件添加执行权限
        execSync(`chmod +x "${scriptsPath}"/*.py`, { stdio: 'inherit' });
        console.log('✅ Python 脚本权限设置完成');
      } catch (error) {
        console.warn('⚠️ 设置 Python 脚本权限失败:', error.message);
      }
    }
    await obfuscateAppJs(appOutDir, platformName);
  } else if (platformName === 'win') {
    // Windows 不需要设置执行权限
    console.log('Windows 平台，跳过权限设置');
    await obfuscateAppJs(appOutDir, platformName);
  } else if (platformName === 'linux') {
    // Linux 打包后，Python 脚本在 resources/scripts/ 目录
    const scriptsPath = path.join(appOutDir, 'resources', 'scripts');
    
    if (fs.existsSync(scriptsPath)) {
      console.log('设置 Python 脚本执行权限...');
      try {
        execSync(`chmod +x "${scriptsPath}"/*.py`, { stdio: 'inherit' });
        console.log('✅ Python 脚本权限设置完成');
      } catch (error) {
        console.warn('⚠️ 设置 Python 脚本权限失败:', error.message);
      }
    }
    await obfuscateAppJs(appOutDir, platformName);
  }
};

