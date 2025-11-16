<?php
/**
 * Windsurf-Tool 版本管理接口（管理员使用）
 * 用于更新版本配置
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Token');

// 处理预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 管理员密钥（实际使用时应该使用更安全的认证方式）
$adminToken = '1';

// 版本配置文件路径
$versionConfigFile = __DIR__ . '/version_config.json';

/**
 * 验证管理员权限
 */
function verifyAdmin() {
    global $adminToken;
    
    $token = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? $_GET['token'] ?? $_POST['token'] ?? '';
    
    if ($token !== $adminToken) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'UNAUTHORIZED',
            'message' => '无效的管理员令牌'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
}

/**
 * 读取版本配置
 */
function getVersionConfig() {
    global $versionConfigFile;
    
    if (file_exists($versionConfigFile)) {
        $config = json_decode(file_get_contents($versionConfigFile), true);
        if ($config && is_array($config)) {
            return $config;
        }
    }
    
    return null;
}

/**
 * 保存版本配置
 */
function saveVersionConfig($config) {
    global $versionConfigFile;
    
    $config['last_updated'] = date('Y-m-d H:i:s');
    return file_put_contents($versionConfigFile, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

/**
 * 验证版本号格式
 */
function validateVersion($version) {
    return preg_match('/^\d+\.\d+\.\d+$/', $version);
}

// 验证管理员权限
verifyAdmin();

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            // 获取当前配置
            $config = getVersionConfig();
            if ($config) {
                echo json_encode([
                    'success' => true,
                    'config' => $config
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'CONFIG_NOT_FOUND',
                    'message' => '配置文件不存在'
                ], JSON_UNESCAPED_UNICODE);
            }
            break;
            
        case 'POST':
        case 'PUT':
            // 更新配置
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                $input = $_POST;
            }
            
            $config = getVersionConfig() ?: [];
            
            // 更新各个字段
            if (isset($input['latest_version'])) {
                if (!validateVersion($input['latest_version'])) {
                    throw new Exception('版本号格式无效');
                }
                $config['latest_version'] = $input['latest_version'];
            }
            
            if (isset($input['min_supported_version'])) {
                if (!validateVersion($input['min_supported_version'])) {
                    throw new Exception('最低支持版本号格式无效');
                }
                $config['min_supported_version'] = $input['min_supported_version'];
            }
            
            if (isset($input['force_update'])) {
                $config['force_update'] = (bool)$input['force_update'];
            }
            
            if (isset($input['update_message'])) {
                $config['update_message'] = $input['update_message'];
            }
            
            // 官方版本白名单
            if (isset($input['official_versions'])) {
                if (!is_array($input['official_versions'])) {
                    throw new Exception('官方版本列表格式无效');
                }
                // 验证每个版本号格式
                foreach ($input['official_versions'] as $version) {
                    if (!validateVersion($version)) {
                        throw new Exception("版本号格式无效: $version");
                    }
                }
                $config['official_versions'] = $input['official_versions'];
            }
            
            if (isset($input['maintenance'])) {
                $config['maintenance'] = $input['maintenance'];
            }
            
            // 保存配置
            if (saveVersionConfig($config)) {
                echo json_encode([
                    'success' => true,
                    'message' => '配置更新成功',
                    'config' => $config
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            } else {
                throw new Exception('保存配置失败');
            }
            break;
            
        case 'DELETE':
            // 重置配置（删除配置文件）
            if (file_exists($versionConfigFile)) {
                unlink($versionConfigFile);
                echo json_encode([
                    'success' => true,
                    'message' => '配置已重置'
                ], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'CONFIG_NOT_FOUND',
                    'message' => '配置文件不存在'
                ], JSON_UNESCAPED_UNICODE);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'error' => 'METHOD_NOT_ALLOWED',
                'message' => '不支持的请求方法'
            ], JSON_UNESCAPED_UNICODE);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'SERVER_ERROR',
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
