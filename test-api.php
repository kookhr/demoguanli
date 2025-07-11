<?php
/**
 * 简单的 API 测试文件
 * 用于诊断 502 错误
 */

// 开启错误显示用于调试
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', '/tmp/serv00-php-errors.log');

// 设置响应头
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// 处理 OPTIONS 请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 基本信息收集
$info = [
    'status' => 'ok',
    'message' => 'API 测试成功',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'server_info' => [
        'software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'protocol' => $_SERVER['SERVER_PROTOCOL'] ?? 'Unknown',
        'method' => $_SERVER['REQUEST_METHOD'] ?? 'Unknown',
        'uri' => $_SERVER['REQUEST_URI'] ?? 'Unknown',
        'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'Unknown',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
        'https' => isset($_SERVER['HTTPS']) ? $_SERVER['HTTPS'] : 'Not set',
        'host' => $_SERVER['HTTP_HOST'] ?? 'Unknown'
    ],
    'environment' => [
        'current_user' => get_current_user(),
        'working_directory' => getcwd(),
        'script_filename' => __FILE__,
        'include_path' => get_include_path()
    ],
    'php_extensions' => [
        'pdo' => extension_loaded('pdo'),
        'pdo_mysql' => extension_loaded('pdo_mysql'),
        'json' => extension_loaded('json'),
        'curl' => extension_loaded('curl'),
        'mbstring' => extension_loaded('mbstring')
    ],
    'file_permissions' => [
        'current_file_readable' => is_readable(__FILE__),
        'current_file_writable' => is_writable(__FILE__),
        'directory_writable' => is_writable(dirname(__FILE__)),
        'parent_directory_writable' => is_writable(dirname(dirname(__FILE__)))
    ]
];

// 尝试数据库连接测试
try {
    // 检查 .env 文件
    $envFile = dirname(__FILE__) . '/.env';
    if (file_exists($envFile)) {
        $info['env_file'] = [
            'exists' => true,
            'readable' => is_readable($envFile),
            'size' => filesize($envFile)
        ];
        
        // 读取数据库配置
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $dbConfig = [];
        foreach ($lines as $line) {
            if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                if (strpos($key, 'DB_') === 0) {
                    $dbConfig[$key] = $value;
                }
            }
        }
        $info['db_config'] = $dbConfig;
    } else {
        $info['env_file'] = [
            'exists' => false,
            'path' => $envFile
        ];
    }
    
    // 尝试数据库连接
    $host = $dbConfig['DB_HOST'] ?? 'mysql14.serv00.com';
    $dbname = $dbConfig['DB_NAME'] ?? 'em9785_environment_manager';
    $username = $dbConfig['DB_USER'] ?? 'm9785_s14kook';
    $password = $dbConfig['DB_PASSWORD'] ?? '';
    
    if (!empty($host) && !empty($dbname) && !empty($username)) {
        $pdo = new PDO(
            "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
            $username,
            $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 5
            ]
        );
        
        $stmt = $pdo->query("SELECT 1 as test, NOW() as current_time");
        $result = $stmt->fetch();
        
        $info['database'] = [
            'status' => 'connected',
            'test_query' => $result
        ];
    } else {
        $info['database'] = [
            'status' => 'config_missing',
            'message' => '数据库配置不完整'
        ];
    }
    
} catch (Exception $e) {
    $info['database'] = [
        'status' => 'error',
        'message' => $e->getMessage()
    ];
}

// 输出 JSON 响应
echo json_encode($info, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
