const { exec } = require('child_process');
const { promisify } = require('util');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const execAsync = promisify(exec);

/**
 * 生成新的机器ID（根据 WINDSURF_CONFIG.md 文档）
 */
function generateMachineIds() {
  // 1. 主机器ID (machineid 文件) - 标准 UUID 小写
  const mainMachineId = uuidv4().toLowerCase();
  
  // 2. 遥测机器ID (telemetry.machineId) - 64位十六进制
  const telemetryMachineId = crypto.randomBytes(32).toString('hex');
  
  // 3. SQM ID (telemetry.sqmId) - UUID 大写带花括号
  const sqmId = '{' + uuidv4().toUpperCase() + '}';
  
  // 4. 开发设备ID (telemetry.devDeviceId) - 标准 UUID 小写
  const devDeviceId = uuidv4().toLowerCase();
  
  // 5. 服务机器ID (storage.serviceMachineId) - 标准 UUID 小写
  const serviceMachineId = uuidv4().toLowerCase();

  return { 
    mainMachineId,
    telemetryMachineId, 
    sqmId, 
    devDeviceId,
    serviceMachineId
  };
}

/**
 * 获取 Windsurf 用户数据路径
 * Windows: %APPDATA%\Windsurf (C:\Users\用户名\AppData\Roaming\Windsurf)
 * macOS: ~/Library/Application Support/Windsurf
 * Linux: ~/.config/Windsurf
 */
function getWindsurfUserDataPath() {
  const platform = process.platform;
  if (platform === 'win32') {
    // Windows 使用 APPDATA (Roaming)
    // 例如: C:\Users\Administrator\AppData\Roaming\Windsurf
    return path.join(process.env.APPDATA, 'Windsurf');
  } else if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Windsurf');
  } else {
    return path.join(os.homedir(), '.config', 'Windsurf');
  }
}

/**
 * 检测 Windows 系统中 Windsurf 的安装路径
 */
async function detectWindsurfInstallPath() {
  const platform = process.platform;
  if (platform !== 'win32') {
    return null;
  }

  const username = os.userInfo().username;
  const possiblePaths = [
    // 标准安装路径
    `C:\\Users\\${username}\\AppData\\Local\\Programs\\Windsurf`,
    'C:\\Users\\Administrator\\AppData\\Local\\Programs\\Windsurf',
    'C:\\Users\\admin\\AppData\\Local\\Programs\\Windsurf',
    // 其他盘符
    'D:\\Windsurf',
    'E:\\Windsurf',
    'F:\\Windsurf',
    'D:\\Programs\\Windsurf',
    'E:\\Programs\\Windsurf',
    'F:\\Programs\\Windsurf',
    'D:\\Program Files\\Windsurf',
    'E:\\Program Files\\Windsurf',
    'F:\\Program Files\\Windsurf'
  ];

  for (const installPath of possiblePaths) {
    try {
      const exePath = path.join(installPath, 'Windsurf.exe');
      await fs.access(exePath);
      console.log(`✅ 检测到 Windsurf 安装路径: ${installPath}`);
      return installPath;
    } catch (err) {
      // 路径不存在，继续检测
    }
  }

  console.log('⚠️ 未能自动检测到 Windsurf 安装路径');
  return null;
}

/**
 * 获取 Windsurf 相关文件路径
 */
function getWindsurfPaths() {
  const userDataPath = getWindsurfUserDataPath();
  return {
    userDataPath,
    machineIdFile: path.join(userDataPath, 'machineid'),
    storageJson: path.join(userDataPath, 'User', 'globalStorage', 'storage.json'),
    stateDb: path.join(userDataPath, 'User', 'globalStorage', 'state.vscdb')
  };
}

/**
 * 检查 Windsurf 是否正在运行
 */
async function checkWindsurfRunning() {
  try {
    const platform = process.platform;
    let command;

    if (platform === 'win32') {
      command = 'tasklist /FI "IMAGENAME eq Windsurf.exe"';
    } else if (platform === 'darwin') {
      command = 'pgrep -fi "Windsurf.app/Contents/MacOS/Windsurf" || pgrep -fi "Windsurf Helper" || true';
    } else {
      command = 'pgrep -fi "windsurf" || true';
    }

    const { stdout } = await execAsync(command);

    if (platform === 'win32') {
      return stdout.includes('Windsurf.exe');
    } else {
      return stdout.trim().length > 0;
    }
  } catch (error) {
    return false;
  }
}

/**
 * 关闭 Windsurf 应用
 */
async function closeWindsurf() {
  try {
    console.log('🔄 正在关闭 Windsurf 应用...');
    
    const platform = process.platform;
    let commands = [];
    
    if (platform === 'win32') {
      // Windows: 使用 taskkill，忽略"进程不存在"错误
      commands = ['taskkill /F /T /IM Windsurf.exe 2>nul || exit 0'];
    } else if (platform === 'darwin') {
      // macOS: 使用 pkill，忽略"进程不存在"错误
      commands = [
        'pkill -9 -f "Windsurf.app/Contents/MacOS/Windsurf" 2>/dev/null || true',
        'pkill -9 -f "Windsurf Helper (Renderer)" 2>/dev/null || true',
        'pkill -9 -f "Windsurf Helper (GPU)" 2>/dev/null || true',
        'pkill -9 -f "Windsurf Helper (Plugin)" 2>/dev/null || true',
        'pkill -9 -f "Windsurf Helper" 2>/dev/null || true',
        'killall -9 Windsurf 2>/dev/null || true'
      ];
    } else {
      // Linux: 使用 pkill 和 killall，忽略"进程不存在"错误
      commands = [
        'pkill -9 -f "windsurf" 2>/dev/null || true',
        'killall -9 windsurf 2>/dev/null || true'
      ];
    }

    // 执行所有关闭命令，忽略所有错误
    for (const cmd of commands) {
      try {
        await execAsync(cmd);
      } catch (e) {
        // 完全忽略错误，因为进程可能本来就不存在
        console.log(`执行命令: ${cmd} (忽略错误)`);
      }
    }

    // 等待进程完全关闭
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 重试检测（最多5次）
    const maxRetries = 5;
    for (let i = 0; i < maxRetries; i++) {
      const isStillRunning = await checkWindsurfRunning();
      if (!isStillRunning) {
        console.log('✅ Windsurf 应用已关闭');
        return { success: true };
      }
      console.log(`等待 Windsurf 关闭... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 最后检查一次
    const isRunning = await checkWindsurfRunning();
    if (isRunning) {
      console.log('❌ 无法关闭 Windsurf 应用，请手动关闭后重试');
      throw new Error('无法关闭 Windsurf 应用，请手动关闭后重试');
    }
    
    console.log('✅ Windsurf 应用已关闭');
    return { success: true };
  } catch (error) {
    console.log(`❌ 关闭 Windsurf 失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 更新 machineid 文件
 */
async function updateMachineIdFile(machineIdPath, machineId) {
  try {
    console.log('🔄 正在更新 machineid 文件...');
    await fs.mkdir(path.dirname(machineIdPath), { recursive: true });
    await fs.writeFile(machineIdPath, machineId, 'utf-8');
    console.log(`✅ machineid 文件已更新: ${machineId}`);
    return { success: true };
  } catch (error) {
    console.log(`❌ 更新 machineid 文件失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 更新 storage.json
 */
async function updateStorageJson(storagePath, machineIds) {
  try {
    console.log('🔄 正在更新 storage.json...');
    
    await fs.mkdir(path.dirname(storagePath), { recursive: true });
    
    let storageData = {};
    try {
      const content = await fs.readFile(storagePath, 'utf-8');
      storageData = JSON.parse(content);
      console.log('✅ 已读取现有 storage.json');
    } catch (err) {
      console.log('ℹ️ 未找到现有 storage.json，将创建新文件');
    }
    
    // 根据文档更新三个 ID
    storageData['telemetry.machineId'] = machineIds.telemetryMachineId;
    storageData['telemetry.sqmId'] = machineIds.sqmId;
    storageData['telemetry.devDeviceId'] = machineIds.devDeviceId;
    
    await fs.writeFile(storagePath, JSON.stringify(storageData, null, 2));
    
    console.log('✅ storage.json 已更新');
    console.log(`  - telemetry.machineId: ${machineIds.telemetryMachineId.substring(0, 16)}...`);
    console.log(`  - telemetry.sqmId: ${machineIds.sqmId}`);
    console.log(`  - telemetry.devDeviceId: ${machineIds.devDeviceId}`);
    
    return { success: true };
  } catch (error) {
    console.log(`❌ 更新 storage.json 失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 更新 SQLite 数据库中的 serviceMachineId
 */
async function updateServiceMachineId(dbPath, serviceMachineId) {
  try {
    console.log('🔄 正在更新 state.vscdb 中的 serviceMachineId...');
    
    // 检查数据库文件是否存在
    try {
      await fs.access(dbPath);
    } catch (err) {
      console.log('ℹ️ 数据库文件不存在，跳过更新 serviceMachineId');
      return { success: true };
    }
    
    // 使用 sql.js
    const initSqlJs = require('sql.js');
    
    // 读取数据库文件
    const dbBuffer = await fs.readFile(dbPath);
    
    // 初始化 sql.js
    const SQL = await initSqlJs();
    const db = new SQL.Database(dbBuffer);
    
    try {
      // 执行更新
      db.run('INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)', 
        ['storage.serviceMachineId', serviceMachineId]);
      
      // 导出数据库
      const data = db.export();
      
      // 写回文件
      await fs.writeFile(dbPath, data);
      
      console.log(`✅ serviceMachineId 已更新: ${serviceMachineId}`);
      
      return { success: true };
    } finally {
      db.close();
    }
  } catch (error) {
    console.log(`❌ 更新 serviceMachineId 失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 清除 Windsurf 缓存
 */
async function clearWindsurfCache() {
  try {
    console.log('🔄 正在清除 Windsurf 缓存目录...');
    
    const userDataPath = getWindsurfUserDataPath();
    const cacheDirectories = [
      path.join(userDataPath, 'Cache'),
      path.join(userDataPath, 'CachedData'),
      path.join(userDataPath, 'CachedExtensions'),
      path.join(userDataPath, 'CachedExtensionVSIXs'),
      path.join(userDataPath, 'Code Cache'),
      path.join(userDataPath, 'GPUCache')
    ];
    
    for (const dir of cacheDirectories) {
      try {
        await fs.access(dir);
        await fs.rm(dir, { recursive: true, force: true });
        console.log(`✅ 已清除: ${path.basename(dir)}`);
      } catch (err) {
        // 目录不存在，跳过
      }
    }
    
    console.log('✅ Windsurf 缓存目录清除完成');
    return { success: true };
  } catch (error) {
    console.log(`⚠️ 清除 Windsurf 缓存失败（可忽略）: ${error.message}`);
    return { success: true };
  }
}

/**
 * 重置 macOS 系统标识符
 */
async function resetMacIdentifiers() {
  try {
    console.log('🔄 正在重置 macOS Windsurf 系统标识符...');
    
    const homeDir = os.homedir();
    const cacheDirectories = [
      path.join(homeDir, 'Library/Caches/com.windsurf'),
      path.join(homeDir, 'Library/Saved Application State/com.windsurf.savedState')
    ];
    
    for (const dir of cacheDirectories) {
      try {
        await fs.access(dir);
        await fs.rm(dir, { recursive: true, force: true });
        console.log(`✅ 已删除缓存目录: ${dir}`);
      } catch (err) {
        console.log(`ℹ️ 跳过不存在的目录: ${dir}`);
      }
    }
    
    console.log('✅ macOS Windsurf 系统标识符已重置');
    return { success: true };
  } catch (error) {
    console.log(`❌ 重置 macOS Windsurf 标识符失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 完整重置 Windsurf 机器ID
 */
async function fullResetWindsurf(customInstallPath = null) {
  try {
    console.log('');
    console.log('='.repeat(60));
    console.log('🔄 开始重置 Windsurf 机器ID');
    console.log('='.repeat(60));
    console.log('');
    
    // Windows 系统检测安装路径
    if (process.platform === 'win32' && !customInstallPath) {
      console.log('📋 步骤 0: 检测 Windsurf 安装路径');
      const detectedPath = await detectWindsurfInstallPath();
      if (detectedPath) {
        console.log(`✅ 已检测到安装路径: ${detectedPath}`);
      } else {
        console.log('⚠️ 未检测到安装路径，将使用默认配置路径');
      }
      console.log('');
    }
    
    // 检查并关闭应用
    const isRunning = await checkWindsurfRunning();
    if (isRunning) {
      const closeResult = await closeWindsurf();
      if (!closeResult.success) {
        throw new Error(closeResult.error);
      }
    } else {
      console.log('ℹ️ Windsurf 未运行，无需关闭');
    }
    
    console.log('');
    console.log('📋 步骤 1: 生成新的机器ID');
    const machineIds = generateMachineIds();
    console.log('✅ 已生成新的机器ID');
    console.log(`  - 主机器ID: ${machineIds.mainMachineId}`);
    console.log(`  - 遥测ID: ${machineIds.telemetryMachineId.substring(0, 16)}...`);
    console.log(`  - SQM ID: ${machineIds.sqmId}`);
    console.log(`  - 开发设备ID: ${machineIds.devDeviceId}`);
    console.log(`  - 服务ID: ${machineIds.serviceMachineId}`);
    
    console.log('');
    console.log('📋 步骤 2: 更新配置文件');
    const paths = getWindsurfPaths();
    
    // 2.1 更新 machineid 文件
    const machineIdResult = await updateMachineIdFile(paths.machineIdFile, machineIds.mainMachineId);
    if (!machineIdResult.success) {
      throw new Error('更新 machineid 文件失败');
    }
    
    // 2.2 更新 storage.json
    const storageResult = await updateStorageJson(paths.storageJson, machineIds);
    if (!storageResult.success) {
      throw new Error('更新 storage.json 失败');
    }
    
    // 2.3 更新 SQLite 数据库
    const dbResult = await updateServiceMachineId(paths.stateDb, machineIds.serviceMachineId);
    if (!dbResult.success) {
      console.log('⚠️ 更新数据库失败，但继续执行');
    }
    
    console.log('');
    console.log('📋 步骤 3: 清除 Windsurf 缓存目录');
    await clearWindsurfCache();
    
    console.log('');
    console.log('📋 步骤 4: 平台特定处理');
    const platform = process.platform;
    if (platform === 'darwin') {
      await resetMacIdentifiers();
    } else {
      console.log('ℹ️ 非 macOS 平台，跳过平台特定处理');
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ Windsurf 机器ID重置成功！');
    console.log('='.repeat(60));
    console.log('');
    console.log('💡 提示: 请重新启动 Windsurf 应用以使更改生效');
    
    return {
      success: true,
      message: 'Windsurf 机器ID重置成功',
      machineIds: machineIds
    };
  } catch (error) {
    console.log('');
    console.log('='.repeat(60));
    console.log(`❌ Windsurf 机器ID重置失败: ${error.message}`);
    console.log('='.repeat(60));
    
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  fullResetWindsurf,
  getWindsurfUserDataPath,
  getWindsurfPaths,
  checkWindsurfRunning,
  closeWindsurf,
  detectWindsurfInstallPath
};
