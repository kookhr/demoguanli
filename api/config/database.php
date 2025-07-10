<?php
// Serv00 数据库连接配置
class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $conn;

    public function __construct() {
        // 从环境变量或配置文件读取数据库配置
        $this->host = $_ENV['DB_HOST'] ?? 'localhost';
        $this->db_name = $_ENV['DB_NAME'] ?? 'environment_manager';
        $this->username = $_ENV['DB_USER'] ?? 'root';
        $this->password = $_ENV['DB_PASSWORD'] ?? '';
    }

    // 获取数据库连接
    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ];

            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch(PDOException $exception) {
            error_log("Connection error: " . $exception->getMessage());
            throw new Exception("数据库连接失败");
        }

        return $this->conn;
    }

    // 关闭连接
    public function closeConnection() {
        $this->conn = null;
    }

    // 测试连接
    public function testConnection() {
        try {
            $conn = $this->getConnection();
            $stmt = $conn->query("SELECT 1");
            return true;
        } catch(Exception $e) {
            return false;
        }
    }

    // 获取数据库信息
    public function getDatabaseInfo() {
        try {
            $conn = $this->getConnection();
            
            $info = [];
            
            // 获取数据库版本
            $stmt = $conn->query("SELECT VERSION() as version");
            $info['version'] = $stmt->fetch()['version'];
            
            // 获取表数量
            $stmt = $conn->query("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ?");
            $stmt->execute([$this->db_name]);
            $info['tables'] = $stmt->fetch()['count'];
            
            // 获取数据库大小
            $stmt = $conn->query("
                SELECT 
                    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
                FROM information_schema.tables 
                WHERE table_schema = ?
            ");
            $stmt->execute([$this->db_name]);
            $info['size_mb'] = $stmt->fetch()['size_mb'];
            
            return $info;
        } catch(Exception $e) {
            throw new Exception("获取数据库信息失败: " . $e->getMessage());
        }
    }

    // 执行数据库初始化
    public function initializeDatabase() {
        try {
            $conn = $this->getConnection();
            
            // 读取初始化SQL文件
            $sqlFile = __DIR__ . '/../../database/init.sql';
            if (!file_exists($sqlFile)) {
                throw new Exception("初始化SQL文件不存在");
            }
            
            $sql = file_get_contents($sqlFile);
            
            // 分割SQL语句，处理多行语句
            $statements = [];
            $currentStatement = '';
            $lines = explode("\n", $sql);

            foreach ($lines as $line) {
                $line = trim($line);

                // 跳过注释和空行
                if (empty($line) || strpos($line, '--') === 0) {
                    continue;
                }

                $currentStatement .= $line . "\n";

                // 如果行以分号结尾，表示语句结束
                if (substr($line, -1) === ';') {
                    $statements[] = trim($currentStatement);
                    $currentStatement = '';
                }
            }

            // 过滤空语句
            $statements = array_filter($statements, function($stmt) {
                return !empty(trim($stmt));
            });
            
            $conn->beginTransaction();
            
            foreach ($statements as $statement) {
                if (!empty($statement)) {
                    $conn->exec($statement);
                }
            }
            
            $conn->commit();
            
            return [
                'success' => true,
                'message' => '数据库初始化成功',
                'statements_executed' => count($statements)
            ];
            
        } catch(Exception $e) {
            if (isset($conn)) {
                $conn->rollback();
            }
            throw new Exception("数据库初始化失败: " . $e->getMessage());
        }
    }

    // 备份数据库
    public function backupDatabase($backupPath = null) {
        if (!$backupPath) {
            $backupPath = __DIR__ . '/../../backups/backup_' . date('Y-m-d_H-i-s') . '.sql';
        }
        
        // 确保备份目录存在
        $backupDir = dirname($backupPath);
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }
        
        $command = sprintf(
            'mysqldump -h%s -u%s -p%s %s > %s',
            escapeshellarg($this->host),
            escapeshellarg($this->username),
            escapeshellarg($this->password),
            escapeshellarg($this->db_name),
            escapeshellarg($backupPath)
        );
        
        exec($command, $output, $returnCode);
        
        if ($returnCode === 0) {
            return [
                'success' => true,
                'backup_path' => $backupPath,
                'file_size' => filesize($backupPath)
            ];
        } else {
            throw new Exception("数据库备份失败");
        }
    }

    // 恢复数据库
    public function restoreDatabase($backupPath) {
        if (!file_exists($backupPath)) {
            throw new Exception("备份文件不存在");
        }
        
        $command = sprintf(
            'mysql -h%s -u%s -p%s %s < %s',
            escapeshellarg($this->host),
            escapeshellarg($this->username),
            escapeshellarg($this->password),
            escapeshellarg($this->db_name),
            escapeshellarg($backupPath)
        );
        
        exec($command, $output, $returnCode);
        
        if ($returnCode === 0) {
            return [
                'success' => true,
                'message' => '数据库恢复成功'
            ];
        } else {
            throw new Exception("数据库恢复失败");
        }
    }
}

// 全局数据库实例
$database = new Database();

// 导出配置常量
define('DB_HOST', $_ENV['DB_HOST'] ?? 'localhost');
define('DB_NAME', $_ENV['DB_NAME'] ?? 'environment_manager');
define('DB_USER', $_ENV['DB_USER'] ?? 'root');
define('DB_PASSWORD', $_ENV['DB_PASSWORD'] ?? '');

// CORS 配置 - 增强版
function setCorsHeaders() {
    // 允许的源
    $allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://' . $_SERVER['HTTP_HOST'],
        'http://' . $_SERVER['HTTP_HOST']
    ];

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, $allowedOrigins) || $origin === '') {
        header("Access-Control-Allow-Origin: " . ($origin ?: '*'));
    } else {
        header("Access-Control-Allow-Origin: *");
    }

    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, HEAD");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Max-Age: 86400"); // 24小时

    // 添加安全头部
    header("X-Content-Type-Options: nosniff");
    header("X-Frame-Options: SAMEORIGIN");
    header("X-XSS-Protection: 1; mode=block");

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// 错误处理
function handleError($message, $code = 500) {
    http_response_code($code);
    echo json_encode([
        'error' => true,
        'message' => $message,
        'timestamp' => date('c')
    ]);
    exit();
}

// 成功响应
function sendResponse($data, $message = null) {
    echo json_encode([
        'success' => true,
        'data' => $data,
        'message' => $message,
        'timestamp' => date('c')
    ]);
}

// JWT 配置
define('JWT_SECRET', $_ENV['JWT_SECRET'] ?? 'your-secret-key-change-in-production');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRATION', 24 * 60 * 60); // 24小时

?>
