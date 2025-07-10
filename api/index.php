<?php
// Serv00 环境管理系统 API 入口文件
// 加载 .env 文件
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/models/Environment.php';
require_once __DIR__ . '/models/User.php';
require_once __DIR__ . '/models/StatusHistory.php';
require_once __DIR__ . '/controllers/EnvironmentController.php';
require_once __DIR__ . '/controllers/UserController.php';
require_once __DIR__ . '/controllers/AuthController.php';

// 设置 CORS 头
setCorsHeaders();

// 设置内容类型
header('Content-Type: application/json; charset=utf-8');

// 获取请求方法和路径
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 移除 API 前缀
$path = preg_replace('#^/api#', '', $path);
$path = trim($path, '/');

// 解析路径
$segments = explode('/', $path);
$resource = $segments[0] ?? '';
$id = $segments[1] ?? null;
$action = $segments[2] ?? null;

try {
    // 路由分发
    switch ($resource) {
        case 'health':
            handleHealthCheck();
            break;
            
        case 'environments':
            $controller = new EnvironmentController();
            handleEnvironmentRoutes($controller, $method, $id, $action);
            break;
            
        case 'users':
            $controller = new UserController();
            handleUserRoutes($controller, $method, $id, $action);
            break;
            
        case 'auth':
            $controller = new AuthController();
            handleAuthRoutes($controller, $method, $id);
            break;
            
        case 'status-history':
            $controller = new EnvironmentController();
            handleStatusHistoryRoutes($controller, $method, $id);
            break;
            
        case 'groups':
            $controller = new EnvironmentController();
            handleGroupRoutes($controller, $method, $id);
            break;
            
        case 'export':
            handleExport();
            break;
            
        case 'import':
            handleImport();
            break;
            
        default:
            handleError('API 端点不存在', 404);
    }
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    handleError($e->getMessage(), 500);
}

// 健康检查
function handleHealthCheck() {
    global $database;
    
    $health = [
        'status' => 'ok',
        'timestamp' => date('c'),
        'version' => '1.0.0',
        'database' => 'disconnected'
    ];
    
    try {
        if ($database->testConnection()) {
            $health['database'] = 'connected';
            $dbInfo = $database->getDatabaseInfo();
            $health['database_info'] = $dbInfo;
        }
    } catch (Exception $e) {
        $health['database'] = 'error: ' . $e->getMessage();
    }
    
    sendResponse($health);
}

// 环境路由处理
function handleEnvironmentRoutes($controller, $method, $id, $action) {
    global $path;
    switch ($method) {
        case 'GET':
            if ($id && $action === 'status') {
                $controller->getEnvironmentStatus($id);
            } elseif ($id) {
                $controller->getEnvironment($id);
            } else {
                $controller->getEnvironments();
            }
            break;
            
        case 'POST':
            if ($id && $action === 'status') {
                $controller->updateEnvironmentStatus($id);
            } elseif ($path === 'environments/batch-status') {
                $controller->batchUpdateStatus();
            } else {
                $controller->createEnvironment();
            }
            break;
            
        case 'PUT':
            if ($id) {
                $controller->updateEnvironment($id);
            } else {
                handleError('环境 ID 是必需的', 400);
            }
            break;
            
        case 'DELETE':
            if ($id) {
                $controller->deleteEnvironment($id);
            } else {
                handleError('环境 ID 是必需的', 400);
            }
            break;
            
        default:
            handleError('不支持的请求方法', 405);
    }
}

// 用户路由处理
function handleUserRoutes($controller, $method, $id, $action) {
    // 检查认证
    if (!checkAuth()) {
        handleError('需要认证', 401);
        return;
    }
    
    switch ($method) {
        case 'GET':
            if ($id) {
                $controller->getUser($id);
            } else {
                $controller->getUsers();
            }
            break;
            
        case 'POST':
            $controller->createUser();
            break;
            
        case 'PUT':
            if ($id) {
                $controller->updateUser($id);
            } else {
                handleError('用户 ID 是必需的', 400);
            }
            break;
            
        case 'DELETE':
            if ($id) {
                $controller->deleteUser($id);
            } else {
                handleError('用户 ID 是必需的', 400);
            }
            break;
            
        default:
            handleError('不支持的请求方法', 405);
    }
}

// 认证路由处理
function handleAuthRoutes($controller, $method, $action) {
    switch ($method) {
        case 'POST':
            if ($action === 'login') {
                $controller->login();
            } elseif ($action === 'register') {
                $controller->register();
            } elseif ($action === 'logout') {
                $controller->logout();
            } else {
                handleError('无效的认证操作', 400);
            }
            break;
            
        case 'GET':
            if ($action === 'me') {
                $controller->getCurrentUser();
            } else {
                handleError('无效的认证操作', 400);
            }
            break;
            
        default:
            handleError('不支持的请求方法', 405);
    }
}

// 状态历史路由处理
function handleStatusHistoryRoutes($controller, $method, $envId) {
    switch ($method) {
        case 'GET':
            $controller->getStatusHistory($envId);
            break;
            
        case 'POST':
            if ($envId) {
                $controller->addStatusRecord($envId);
            } else {
                handleError('环境 ID 是必需的', 400);
            }
            break;
            
        default:
            handleError('不支持的请求方法', 405);
    }
}

// 分组路由处理
function handleGroupRoutes($controller, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                $controller->getGroup($id);
            } else {
                $controller->getGroups();
            }
            break;
            
        case 'POST':
            $controller->createGroup();
            break;
            
        case 'PUT':
            if ($id) {
                $controller->updateGroup($id);
            } else {
                handleError('分组 ID 是必需的', 400);
            }
            break;
            
        case 'DELETE':
            if ($id) {
                $controller->deleteGroup($id);
            } else {
                handleError('分组 ID 是必需的', 400);
            }
            break;
            
        default:
            handleError('不支持的请求方法', 405);
    }
}

// 数据导出
function handleExport() {
    if (!checkAuth()) {
        handleError('需要认证', 401);
        return;
    }
    
    // 实现数据导出逻辑
    $controller = new EnvironmentController();
    $controller->exportData();
}

// 数据导入
function handleImport() {
    if (!checkAuth()) {
        handleError('需要认证', 401);
        return;
    }
    
    // 实现数据导入逻辑
    $controller = new EnvironmentController();
    $controller->importData();
}

// 简单的认证检查
function checkAuth() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (strpos($authHeader, 'Bearer ') === 0) {
        $token = substr($authHeader, 7);
        return validateJWT($token);
    }
    
    return false;
}

// JWT 验证（简化版）
function validateJWT($token) {
    // 这里应该实现完整的 JWT 验证
    // 为了简化，这里只做基本检查
    return !empty($token) && strlen($token) > 10;
}

// 获取请求体数据
function getRequestData() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? [];
}

// 生成 UUID
function generateUUID() {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

?>
