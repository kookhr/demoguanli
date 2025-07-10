<?php
// 专用的配置导入端点 - 绕过nginx 403问题
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-API-Key');

// 处理预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 错误处理函数
function handleError($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $message,
        'timestamp' => date('Y-m-d H:i:s'),
        'endpoint' => 'import.php'
    ]);
    exit();
}

// 记录访问日志
error_log("Direct Import Access: " . $_SERVER['REQUEST_METHOD'] . " from " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));

// 只处理POST请求
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    handleError('只支持POST请求', 405);
}

// 获取请求数据
$input = file_get_contents('php://input');
if (empty($input)) {
    handleError('请求体为空');
}

$data = json_decode($input, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    handleError('无效的JSON数据: ' . json_last_error_msg());
}

// 验证数据结构
if (!isset($data['environments']) || !is_array($data['environments'])) {
    handleError('缺少environments数组');
}

if (empty($data['environments'])) {
    handleError('environments数组不能为空');
}

// 加载数据库配置
try {
    require_once __DIR__ . '/config/database.php';
} catch (Exception $e) {
    handleError('数据库配置加载失败: ' . $e->getMessage(), 500);
}

// 简化的数据库操作
function importEnvironments($environments) {
    try {
        $pdo = getDatabaseConnection();
        
        $stmt = $pdo->prepare("
            INSERT INTO environments (id, name, url, description, version, network_type, environment_type, tags, group_id, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE 
            name = VALUES(name), 
            url = VALUES(url), 
            description = VALUES(description),
            version = VALUES(version),
            network_type = VALUES(network_type),
            environment_type = VALUES(environment_type),
            tags = VALUES(tags),
            group_id = VALUES(group_id),
            updated_at = NOW()
        ");
        
        $imported = 0;
        foreach ($environments as $env) {
            // 生成ID（如果没有）
            $id = $env['id'] ?? 'env_' . time() . '_' . mt_rand(1000, 9999);
            
            // 验证必需字段
            if (empty($env['name']) || empty($env['url'])) {
                continue;
            }
            
            $tags = is_array($env['tags'] ?? []) ? json_encode($env['tags']) : '[]';
            
            $stmt->execute([
                $id,
                $env['name'],
                $env['url'],
                $env['description'] ?? '',
                $env['version'] ?? '',
                $env['network_type'] ?? 'external',
                $env['environment_type'] ?? 'development',
                $tags,
                $env['group_id'] ?? null
            ]);
            
            $imported++;
        }
        
        return $imported;
    } catch (Exception $e) {
        throw new Exception('数据库操作失败: ' . $e->getMessage());
    }
}

// 执行导入
try {
    $imported = importEnvironments($data['environments']);
    
    // 返回成功响应
    echo json_encode([
        'success' => true,
        'message' => '配置导入成功',
        'imported_count' => $imported,
        'total_count' => count($data['environments']),
        'timestamp' => date('Y-m-d H:i:s'),
        'endpoint' => 'import.php'
    ]);
    
} catch (Exception $e) {
    error_log("Import error: " . $e->getMessage());
    handleError($e->getMessage(), 500);
}
?>
