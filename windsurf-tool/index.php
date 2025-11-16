<?php
/**
 * Windsurf-Tool API
 * 版本检测和更新信息API (PHP版本)
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// 处理OPTIONS请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// API配置数据
$apiData = [
    'version' => '2.0.1', // 当前最新版本
    'minVersion' => '2.0.1', // 最低支持版本
    'updateRequired' => true, // 是否需要强制更新
    'downloadUrl' => [
        'mac' => 'https://github.com/crispvibe/Windsurf-Tool/releases/download/v2.0.0/Windsurf-Tool-2.0.0-arm64.dmg',
        'macIntel' => 'https://github.com/crispvibe/Windsurf-Tool/releases/download/v2.0.0/Windsurf-Tool-2.0.0-x64.dmg',
        'windows' => 'https://github.com/crispvibe/Windsurf-Tool/releases/download/v2.0.0/Windsurf-Tool-Setup-2.0.0.exe',
        'linux' => 'https://github.com/crispvibe/Windsurf-Tool/releases/download/v2.0.0/Windsurf-Tool-2.0.0-x64.AppImage'
    ],
    'message' => [
        'title' => '发现新版本',
        'content' => "当前版本已不再支持，请下载最新版本以继续使用。\n\n新版本包含以下更新：\n• 性能优化\n• 修复已知问题\n• 新增功能",
        'buttonText' => '立即下载'
    ],
    'notice' => '为了确保最佳体验，请及时更新到最新版本。'
];

// 比较版本号
function compareVersion($version1, $version2) {
    $v1 = array_map('intval', explode('.', $version1));
    $v2 = array_map('intval', explode('.', $version2));
    
    $maxLength = max(count($v1), count($v2));
    for ($i = 0; $i < $maxLength; $i++) {
        $num1 = isset($v1[$i]) ? $v1[$i] : 0;
        $num2 = isset($v2[$i]) ? $v2[$i] : 0;
        if ($num1 > $num2) return 1;
        if ($num1 < $num2) return -1;
    }
    return 0;
}

// 根据平台获取下载地址
function getDownloadUrl($platform) {
    global $apiData;
    if ($platform === 'darwin' || $platform === 'mac') {
        return $apiData['downloadUrl']['mac'];
    } else if ($platform === 'win32' || $platform === 'windows') {
        return $apiData['downloadUrl']['windows'];
    } else {
        return $apiData['downloadUrl']['linux'];
    }
}

// 获取请求路径
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$query = parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY);
parse_str($query, $params);

// API路由
if ($path === '/api/version' || $path === '/version' || $path === '/windsurf-toolapi/index.php') {
    $clientVersion = isset($params['version']) ? $params['version'] : '0.0.0';
    $platform = isset($params['platform']) ? $params['platform'] : 'darwin';
    
    // 比较版本
    $versionCompare = compareVersion($clientVersion, $apiData['version']);
    $minVersionCompare = compareVersion($clientVersion, $apiData['minVersion']);
    
    // 判断是否需要更新
    $needsUpdate = $versionCompare < 0 || ($apiData['updateRequired'] && $minVersionCompare < 0);
    
    $response = [
        'success' => true,
        'data' => [
            'currentVersion' => $apiData['version'],
            'minVersion' => $apiData['minVersion'],
            'clientVersion' => $clientVersion,
            'needsUpdate' => $needsUpdate,
            'updateRequired' => $apiData['updateRequired'] && $minVersionCompare < 0,
            'downloadUrl' => getDownloadUrl($platform),
            'message' => $apiData['message'],
            'notice' => $apiData['notice'],
            'timestamp' => date('c')
        ]
    ];
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} else if ($path === '/api/info' || $path === '/info') {
    // 返回完整信息
    echo json_encode([
        'success' => true,
        'data' => $apiData
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} else {
    // 404
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'error' => 'Not Found'
    ], JSON_UNESCAPED_UNICODE);
}
?>

