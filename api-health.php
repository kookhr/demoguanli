<?php
/**
 * API 健康检查文件
 * 用于测试基本的 API 功能
 */

// 设置错误报告
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 设置响应头
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-API-Key');

// 处理 OPTIONS 预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 获取请求信息
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN';
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$requestPath = parse_url($requestUri, PHP_URL_PATH);

// 基本健康检查
function healthCheck() {
    $health = [
        'status' => 'ok',
        'timestamp' => date('Y-m-d H:i:s'),
        'server_info' => [
            'php_version' => PHP_VERSION,
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
            'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? '',
            'script_name' => $_SERVER['SCRIPT_NAME'] ?? '',
            'request_method' => $_SERVER['REQUEST_METHOD'] ?? '',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? ''
        ],
        'environment' => [
            'is_serv00' => (stripos($_SERVER['SERVER_NAME'] ?? '', 'serv00.net') !== false),
            'current_user' => get_current_user(),
            'working_directory' => getcwd()
        ]
    ];
    
    // 检查 PHP 扩展
    $requiredExtensions = ['pdo', 'pdo_mysql', 'json', 'curl', 'mbstring'];
    $extensions = [];
    
    foreach ($requiredExtensions as $ext) {
        $extensions[$ext] = extension_loaded($ext);
    }
    
    $health['php_extensions'] = $extensions;
    
    // 检查文件权限
    $health['file_permissions'] = [
        'current_file_readable' => is_readable(__FILE__),
        'current_file_writable' => is_writable(__FILE__),
        'directory_writable' => is_writable(dirname(__FILE__))
    ];
    
    return $health;
}

// 数据库连接测试
function testDatabase() {
    // 尝试加载环境变量
    $envFile = dirname(__DIR__) . '/.env';
    $dbConfig = [
        'host' => 'mysql14.serv00.com',
        'dbname' => 'em9785_environment_manager',
        'username' => 'm9785_s14kook',
        'password' => ''
    ];
    
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                
                switch ($key) {
                    case 'DB_HOST':
                        $dbConfig['host'] = $value;
                        break;
                    case 'DB_NAME':
                        $dbConfig['dbname'] = $value;
                        break;
                    case 'DB_USER':
                        $dbConfig['username'] = $value;
                        break;
                    case 'DB_PASSWORD':
                        $dbConfig['password'] = $value;
                        break;
                }
            }
        }
    }
    
    try {
        $pdo = new PDO(
            "mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']};charset=utf8mb4",
            $dbConfig['username'],
            $dbConfig['password'],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 10
            ]
        );
        
        // 测试查询
        $stmt = $pdo->query("SELECT 1 as test");
        $result = $stmt->fetch();
        
        return [
            'status' => 'connected',
            'config' => [
                'host' => $dbConfig['host'],
                'database' => $dbConfig['dbname'],
                'username' => $dbConfig['username'],
                'password_set' => !empty($dbConfig['password'])
            ],
            'test_query' => $result
        ];
        
    } catch (PDOException $e) {
        return [
            'status' => 'error',
            'message' => $e->getMessage(),
            'config' => [
                'host' => $dbConfig['host'],
                'database' => $dbConfig['dbname'],
                'username' => $dbConfig['username'],
                'password_set' => !empty($dbConfig['password'])
            ]
        ];
    }
}

// 路由处理
$response = [];

try {
    // 解析路径
    $pathParts = explode('/', trim($requestPath, '/'));
    $endpoint = end($pathParts);
    
    switch ($endpoint) {
        case 'health':
        case 'api-health.php':
        case '':
            $response = healthCheck();
            break;
            
        case 'db':
        case 'database':
            $response = [
                'endpoint' => 'database_test',
                'database' => testDatabase()
            ];
            break;
            
        case 'info':
            $response = [
                'endpoint' => 'server_info',
                'php_info' => [
                    'version' => PHP_VERSION,
                    'sapi' => PHP_SAPI,
                    'extensions' => get_loaded_extensions(),
                    'ini_settings' => [
                        'memory_limit' => ini_get('memory_limit'),
                        'max_execution_time' => ini_get('max_execution_time'),
                        'upload_max_filesize' => ini_get('upload_max_filesize'),
                        'post_max_size' => ini_get('post_max_size')
                    ]
                ],
                'server_vars' => $_SERVER
            ];
            break;
            
        default:
            $response = [
                'status' => 'error',
                'message' => 'Unknown endpoint',
                'available_endpoints' => [
                    '/health' => 'Basic health check',
                    '/db' => 'Database connection test',
                    '/info' => 'Server information'
                ],
                'request_info' => [
                    'method' => $requestMethod,
                    'uri' => $requestUri,
                    'path' => $requestPath,
                    'endpoint' => $endpoint
                ]
            ];
            http_response_code(404);
            break;
    }
    
} catch (Exception $e) {
    $response = [
        'status' => 'error',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ];
    http_response_code(500);
}

// 输出响应
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
