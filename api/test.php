<?php
// API测试端点 - 用于诊断nginx 403问题
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-API-Key');

// 处理预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 收集诊断信息
$diagnostics = [
    'success' => true,
    'message' => 'API测试端点工作正常',
    'timestamp' => date('Y-m-d H:i:s'),
    'server_info' => [
        'php_version' => PHP_VERSION,
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
        'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
        'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'unknown',
        'query_string' => $_SERVER['QUERY_STRING'] ?? '',
        'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ],
    'headers' => [],
    'post_data' => null
];

// 收集请求头
foreach ($_SERVER as $key => $value) {
    if (strpos($key, 'HTTP_') === 0) {
        $header = str_replace('HTTP_', '', $key);
        $header = str_replace('_', '-', $header);
        $diagnostics['headers'][$header] = $value;
    }
}

// 如果是POST请求，收集POST数据
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    if (!empty($input)) {
        $diagnostics['post_data'] = json_decode($input, true) ?? $input;
    }
}

// 测试文件权限
$diagnostics['file_permissions'] = [
    'current_file' => [
        'path' => __FILE__,
        'readable' => is_readable(__FILE__),
        'writable' => is_writable(__FILE__),
        'permissions' => substr(sprintf('%o', fileperms(__FILE__)), -4)
    ],
    'index_php' => [
        'path' => __DIR__ . '/index.php',
        'exists' => file_exists(__DIR__ . '/index.php'),
        'readable' => is_readable(__DIR__ . '/index.php'),
        'permissions' => file_exists(__DIR__ . '/index.php') ? substr(sprintf('%o', fileperms(__DIR__ . '/index.php')), -4) : 'N/A'
    ],
    'api_directory' => [
        'path' => __DIR__,
        'readable' => is_readable(__DIR__),
        'writable' => is_writable(__DIR__),
        'permissions' => substr(sprintf('%o', fileperms(__DIR__)), -4)
    ]
];

// 测试数据库连接（如果可能）
try {
    if (file_exists(__DIR__ . '/config/database.php')) {
        require_once __DIR__ . '/config/database.php';
        $diagnostics['database'] = [
            'config_file_exists' => true,
            'connection_test' => 'Database config loaded successfully'
        ];
    } else {
        $diagnostics['database'] = [
            'config_file_exists' => false,
            'connection_test' => 'Database config file not found'
        ];
    }
} catch (Exception $e) {
    $diagnostics['database'] = [
        'error' => $e->getMessage()
    ];
}

// 返回诊断信息
echo json_encode($diagnostics, JSON_PRETTY_PRINT);
?>
