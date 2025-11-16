<?php
/**
 * Windsurf-Tool 版本检测接口
 * 用于检查应用版本更新
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 处理预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 版本配置文件路径
$versionConfigFile = __DIR__ . '/version_config.json';

// 默认版本配置
$defaultConfig = [
    'latest_version' => '4.0.0',
    'min_supported_version' => '3.0.0',
    'force_update' => false,
    'update_message' => '发现新版本，建议更新以获得更好的体验。',
    'official_versions' => ['1.0.0', '2.0.0', '2.0.1', '3.0.0', '4.0.0'],
    'maintenance' => [
        'enabled' => false,
        'message' => '系统维护中，请稍后再试。'
    ],
    'last_updated' => date('Y-m-d H:i:s')
];

/**
 * 读取版本配置
 */
function getVersionConfig() {
    global $versionConfigFile, $defaultConfig;
    
    if (file_exists($versionConfigFile)) {
        $config = json_decode(file_get_contents($versionConfigFile), true);
        if ($config && is_array($config)) {
            return array_merge($defaultConfig, $config);
        }
    }
    
    // 如果配置文件不存在，创建默认配置
    saveVersionConfig($defaultConfig);
    return $defaultConfig;
}

/**
 * 保存版本配置
 */
function saveVersionConfig($config) {
    global $versionConfigFile;
    
    $config['last_updated'] = date('Y-m-d H:i:s');
    file_put_contents($versionConfigFile, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

/**
 * 比较版本号
 */
function compareVersions($version1, $version2) {
    return version_compare($version1, $version2);
}

/**
 * 验证版本号格式是否合法
 */
function isValidVersion($version) {
    // 版本号格式：x.y.z，每部分都是数字
    if (!preg_match('/^(\d+)\.(\d+)\.(\d+)$/', $version, $matches)) {
        return false;
    }
    
    // 防止超大版本号（每部分不超过 100）
    $major = intval($matches[1]);
    $minor = intval($matches[2]);
    $patch = intval($matches[3]);
    
    if ($major > 100 || $minor > 100 || $patch > 100) {
        return false;
    }
    
    return true;
}

/**
 * 验证是否是官方发布的版本
 */
function isOfficialVersion($version, $config) {
    // 从配置文件读取官方版本列表
    $officialVersions = $config['official_versions'] ?? [];
    
    // 如果配置文件中没有定义，使用默认列表
    if (empty($officialVersions)) {
        $officialVersions = ['1.0.0', '2.0.0', '3.0.0', '4.0.0'];
    }
    
    return in_array($version, $officialVersions, true);
}

/**
 * 获取客户端信息
 */
function getClientInfo() {
    return [
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'timestamp' => date('Y-m-d H:i:s')
    ];
}

/**
 * 记录访问日志
 */
function logAccess($currentVersion, $platform, $arch) {
    $logFile = __DIR__ . '/access.log';
    $clientInfo = getClientInfo();
    
    $logEntry = [
        'timestamp' => $clientInfo['timestamp'],
        'ip' => $clientInfo['ip'],
        'current_version' => $currentVersion,
        'platform' => $platform,
        'arch' => $arch,
        'user_agent' => $clientInfo['user_agent']
    ];
    
    file_put_contents($logFile, json_encode($logEntry) . "\n", FILE_APPEND | LOCK_EX);
}

// 主要处理逻辑
try {
    // 获取请求参数
    $currentVersion = $_GET['version'] ?? $_POST['version'] ?? '0.0.0';
    $platform = $_GET['platform'] ?? $_POST['platform'] ?? 'unknown';
    $arch = $_GET['arch'] ?? $_POST['arch'] ?? 'x64';
    
    // 获取版本配置（需要先获取，用于白名单验证）
    $config = getVersionConfig();
    
    // 1. 验证版本号格式
    if (!isValidVersion($currentVersion)) {
        // 版本号格式非法，强制要求更新
        $response = [
            'success' => true,
            'current_version' => $currentVersion,
            'latest_version' => '999.0.0',
            'has_update' => true,
            'force_update' => true,
            'is_supported' => false,
            'update_message' => '检测到版本号格式异常，请重新下载官方版本',
            'platform' => $platform,
            'arch' => $arch,
            'error_code' => 'INVALID_VERSION_FORMAT'
        ];
        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        error_log("Invalid version format: $currentVersion from IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
        exit();
    }
    
    // 2. 验证是否是官方版本（白名单）
    if (!isOfficialVersion($currentVersion, $config)) {
        // 不是官方版本，强制要求更新
        $response = [
            'success' => true,
            'current_version' => $currentVersion,
            'latest_version' => '999.0.0',
            'has_update' => true,
            'force_update' => true,
            'is_supported' => false,
            'update_message' => '检测到非官方版本，请从官方渠道下载',
            'platform' => $platform,
            'arch' => $arch,
            'error_code' => 'UNOFFICIAL_VERSION'
        ];
        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        error_log("Unofficial version detected: $currentVersion from IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
        exit();
    }
    
    // 记录访问
    logAccess($currentVersion, $platform, $arch);
    
    // 检查维护状态
    if ($config['maintenance']['enabled']) {
        $response = [
            'success' => false,
            'error' => 'MAINTENANCE',
            'message' => $config['maintenance']['message'],
            'maintenance' => $config['maintenance']
        ];
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit();
    }
    
    $latestVersion = $config['latest_version'];
    $minSupportedVersion = $config['min_supported_version'];
    
    // 比较版本
    $comparison = compareVersions($currentVersion, $latestVersion);
    $isSupported = compareVersions($currentVersion, $minSupportedVersion) >= 0;
    
    // 构建响应
    $response = [
        'success' => true,
        'current_version' => $currentVersion,
        'latest_version' => $latestVersion,
        'has_update' => $comparison < 0,
        'force_update' => $config['force_update'] || !$isSupported,
        'is_supported' => $isSupported,
        'update_message' => $config['update_message'],
        'platform' => $platform,
        'arch' => $arch
    ];
    
    // 添加服务器信息
    $response['server_info'] = [
        'timestamp' => date('Y-m-d H:i:s'),
        'timezone' => date_default_timezone_get(),
        'last_config_update' => $config['last_updated']
    ];
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    $response = [
        'success' => false,
        'error' => 'SERVER_ERROR',
        'message' => '服务器内部错误',
        'debug' => $e->getMessage()
    ];
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
}
?>
