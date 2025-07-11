<?php
/**
 * API 入口文件 - HTTPS 优化版
 */

// 错误报告设置
error_reporting(E_ALL);
ini_set('display_errors', 0); // 生产环境关闭显示错误
ini_set('log_errors', 1);
ini_set('error_log', '/tmp/serv00-php-errors.log');

// 设置响应头 - HTTPS 优化
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-API-Key');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// 处理 OPTIONS 预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 获取请求信息
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$requestPath = parse_url($requestUri, PHP_URL_PATH);

// 移除 /api 前缀
$apiPath = preg_replace('#^/api/?#', '', $requestPath);
$pathParts = explode('/', trim($apiPath, '/'));
$endpoint = $pathParts[0] ?? '';

// 加载环境变量
function loadEnv() {
    $envFile = dirname(__DIR__) . '/.env';
    $config = [];
    
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
                list($key, $value) = explode('=', $line, 2);
                $config[trim($key)] = trim($value);
            }
        }
    }
    
    return $config;
}

// 数据库连接
function getDatabase() {
    $env = loadEnv();
    
    $host = $env['DB_HOST'] ?? 'mysql14.serv00.com';
    $dbname = $env['DB_NAME'] ?? 'em9785_environment_manager';
    $username = $env['DB_USER'] ?? 'm9785_s14kook';
    $password = $env['DB_PASSWORD'] ?? '';
    
    try {
        $pdo = new PDO(
            "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
            $username,
            $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 10
            ]
        );
        return $pdo;
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        return null;
    }
}

// 路由处理
$response = [];

try {
    switch ($endpoint) {
        case 'health':
        case '':
            $response = [
                'status' => 'ok',
                'message' => 'API is running',
                'timestamp' => date('Y-m-d H:i:s'),
                'https' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
                'server_protocol' => $_SERVER['SERVER_PROTOCOL'] ?? 'HTTP/1.1'
            ];
            break;
            
        case 'environments':
            $db = getDatabase();
            if ($db) {
                if ($requestMethod === 'GET') {
                    $stmt = $db->query("SELECT * FROM environments ORDER BY created_at DESC");
                    $environments = $stmt->fetchAll();
                    $response = [
                        'status' => 'success',
                        'data' => $environments
                    ];
                } else {
                    $response = [
                        'status' => 'error',
                        'message' => 'Method not allowed'
                    ];
                    http_response_code(405);
                }
            } else {
                $response = [
                    'status' => 'error',
                    'message' => 'Database connection failed'
                ];
                http_response_code(500);
            }
            break;
            
        case 'auth':
            $subEndpoint = $pathParts[1] ?? '';
            if ($subEndpoint === 'login') {
                if ($requestMethod === 'POST') {
                    $input = json_decode(file_get_contents('php://input'), true);
                    $username = $input['username'] ?? '';
                    $password = $input['password'] ?? '';
                    
                    // 简单的认证逻辑
                    if ($username === 'admin' && $password === 'admin123') {
                        $response = [
                            'status' => 'success',
                            'message' => 'Login successful',
                            'token' => 'demo-token-' . time(),
                            'user' => [
                                'id' => 1,
                                'username' => 'admin',
                                'role' => 'admin'
                            ]
                        ];
                    } else {
                        $response = [
                            'status' => 'error',
                            'message' => 'Invalid credentials'
                        ];
                        http_response_code(401);
                    }
                } else {
                    $response = [
                        'status' => 'error',
                        'message' => 'Method not allowed'
                    ];
                    http_response_code(405);
                }
            } else {
                $response = [
                    'status' => 'error',
                    'message' => 'Auth endpoint not found'
                ];
                http_response_code(404);
            }
            break;
            
        default:
            $response = [
                'status' => 'error',
                'message' => 'Endpoint not found',
                'available_endpoints' => [
                    '/api/health' => 'Health check',
                    '/api/environments' => 'Environment management',
                    '/api/auth/login' => 'User authentication'
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
    error_log("API Error: " . $e->getMessage());
    $response = [
        'status' => 'error',
        'message' => 'Internal server error',
        'error_id' => uniqid()
    ];
    http_response_code(500);
}

// 输出响应
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
