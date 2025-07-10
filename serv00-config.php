<?php
/**
 * Serv00 环境管理系统专用配置
 * 针对 Serv00 FreeBSD 环境优化
 */

// Serv00 环境检测
function isServ00Environment() {
    return (
        stripos(php_uname('s'), 'freebsd') !== false ||
        stripos($_SERVER['SERVER_NAME'] ?? '', 'serv00.net') !== false ||
        file_exists('/usr/local/bin/devil')
    );
}

// Serv00 专用配置
class Serv00Config {
    
    // 系统配置
    public static function getSystemConfig() {
        return [
            'environment' => 'serv00',
            'timezone' => 'Europe/Warsaw',
            'charset' => 'utf8mb4',
            'max_execution_time' => 300,
            'memory_limit' => '256M',
            'upload_max_filesize' => '50M',
            'post_max_size' => '50M'
        ];
    }
    
    // 数据库配置
    public static function getDatabaseConfig() {
        return [
            'driver' => 'mysql',
            'host' => $_ENV['DB_HOST'] ?? 'localhost',
            'port' => $_ENV['DB_PORT'] ?? 3306,
            'database' => $_ENV['DB_NAME'] ?? 'environment_manager',
            'username' => $_ENV['DB_USER'] ?? '',
            'password' => $_ENV['DB_PASSWORD'] ?? '',
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'options' => [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
                PDO::ATTR_TIMEOUT => 30,
                PDO::ATTR_PERSISTENT => false
            ]
        ];
    }
    
    // 应用配置
    public static function getAppConfig() {
        return [
            'name' => 'Serv00 环境管理系统',
            'version' => '1.0.0',
            'debug' => $_ENV['APP_DEBUG'] ?? false,
            'url' => $_ENV['APP_URL'] ?? 'https://' . ($_SERVER['HTTP_HOST'] ?? 'localhost'),
            'port' => $_ENV['APP_PORT'] ?? 3000,
            'api_prefix' => '/api',
            'frontend_path' => '/dist',
            'upload_path' => '/uploads',
            'backup_path' => '/backups'
        ];
    }
    
    // 安全配置
    public static function getSecurityConfig() {
        return [
            'jwt_secret' => $_ENV['JWT_SECRET'] ?? 'serv00-env-manager-secret-key',
            'jwt_expire' => 86400, // 24小时
            'session_lifetime' => 7200, // 2小时
            'password_min_length' => 6,
            'max_login_attempts' => 5,
            'lockout_duration' => 900, // 15分钟
            'csrf_protection' => true,
            'rate_limit' => [
                'api' => 100, // 每分钟100次
                'login' => 5   // 每分钟5次
            ]
        ];
    }
    
    // 缓存配置
    public static function getCacheConfig() {
        return [
            'driver' => 'file',
            'path' => sys_get_temp_dir() . '/serv00-cache',
            'ttl' => 3600, // 1小时
            'prefix' => 'serv00_env_',
            'enabled' => true
        ];
    }
    
    // 日志配置
    public static function getLogConfig() {
        return [
            'enabled' => true,
            'level' => $_ENV['LOG_LEVEL'] ?? 'info',
            'path' => $_ENV['LOG_PATH'] ?? sys_get_temp_dir() . '/serv00-logs',
            'max_files' => 30,
            'max_size' => '10M',
            'format' => '[%datetime%] %level_name%: %message% %context%'
        ];
    }
    
    // 邮件配置
    public static function getMailConfig() {
        return [
            'driver' => $_ENV['MAIL_DRIVER'] ?? 'smtp',
            'host' => $_ENV['MAIL_HOST'] ?? 'mail.serv00.com',
            'port' => $_ENV['MAIL_PORT'] ?? 587,
            'username' => $_ENV['MAIL_USERNAME'] ?? '',
            'password' => $_ENV['MAIL_PASSWORD'] ?? '',
            'encryption' => $_ENV['MAIL_ENCRYPTION'] ?? 'tls',
            'from' => [
                'address' => $_ENV['MAIL_FROM_ADDRESS'] ?? 'noreply@serv00.net',
                'name' => $_ENV['MAIL_FROM_NAME'] ?? 'Serv00 环境管理系统'
            ]
        ];
    }
    
    // 监控配置
    public static function getMonitoringConfig() {
        return [
            'enabled' => true,
            'check_interval' => 300, // 5分钟
            'timeout' => 30,
            'retry_attempts' => 3,
            'retry_delay' => 5,
            'user_agent' => 'Serv00-Environment-Monitor/1.0',
            'follow_redirects' => true,
            'verify_ssl' => true,
            'methods' => ['GET', 'HEAD'],
            'status_codes' => [
                'success' => [200, 201, 202, 204],
                'warning' => [301, 302, 304],
                'error' => [400, 401, 403, 404, 500, 502, 503, 504]
            ]
        ];
    }
    
    // 备份配置
    public static function getBackupConfig() {
        return [
            'enabled' => true,
            'schedule' => '0 2 * * *', // 每天凌晨2点
            'retention_days' => 30,
            'compression' => true,
            'include_uploads' => true,
            'exclude_patterns' => [
                '*.log',
                '*.tmp',
                'cache/*',
                'node_modules/*'
            ]
        ];
    }
    
    // 性能配置
    public static function getPerformanceConfig() {
        return [
            'cache_static_files' => true,
            'gzip_compression' => true,
            'minify_html' => false,
            'minify_css' => false,
            'minify_js' => false,
            'cdn_enabled' => false,
            'lazy_loading' => true,
            'image_optimization' => false
        ];
    }
    
    // 获取所有配置
    public static function getAllConfig() {
        return [
            'system' => self::getSystemConfig(),
            'database' => self::getDatabaseConfig(),
            'app' => self::getAppConfig(),
            'security' => self::getSecurityConfig(),
            'cache' => self::getCacheConfig(),
            'log' => self::getLogConfig(),
            'mail' => self::getMailConfig(),
            'monitoring' => self::getMonitoringConfig(),
            'backup' => self::getBackupConfig(),
            'performance' => self::getPerformanceConfig()
        ];
    }
    
    // 应用系统配置
    public static function applySystemConfig() {
        $config = self::getSystemConfig();
        
        // 设置时区
        date_default_timezone_set($config['timezone']);
        
        // 设置执行时间
        set_time_limit($config['max_execution_time']);
        
        // 设置内存限制
        ini_set('memory_limit', $config['memory_limit']);
        
        // 设置上传限制
        ini_set('upload_max_filesize', $config['upload_max_filesize']);
        ini_set('post_max_size', $config['post_max_size']);
        
        // 设置字符集
        ini_set('default_charset', $config['charset']);
        
        // 错误报告
        if ($_ENV['APP_DEBUG'] ?? false) {
            error_reporting(E_ALL);
            ini_set('display_errors', 1);
        } else {
            error_reporting(E_ERROR | E_WARNING | E_PARSE);
            ini_set('display_errors', 0);
        }
        
        // 日志设置
        ini_set('log_errors', 1);
        ini_set('error_log', sys_get_temp_dir() . '/serv00-php-errors.log');
    }
    
    // 验证配置
    public static function validateConfig() {
        $errors = [];
        
        // 检查数据库配置
        $dbConfig = self::getDatabaseConfig();
        if (empty($dbConfig['username'])) {
            $errors[] = '数据库用户名未配置';
        }
        if (empty($dbConfig['password'])) {
            $errors[] = '数据库密码未配置';
        }
        
        // 检查必要的目录
        $appConfig = self::getAppConfig();
        $requiredDirs = [
            sys_get_temp_dir() . '/serv00-cache',
            sys_get_temp_dir() . '/serv00-logs'
        ];
        
        foreach ($requiredDirs as $dir) {
            if (!is_dir($dir)) {
                if (!mkdir($dir, 0755, true)) {
                    $errors[] = "无法创建目录: $dir";
                }
            }
        }
        
        // 检查 PHP 扩展
        $requiredExtensions = ['pdo', 'pdo_mysql', 'json', 'curl', 'mbstring'];
        foreach ($requiredExtensions as $ext) {
            if (!extension_loaded($ext)) {
                $errors[] = "缺少 PHP 扩展: $ext";
            }
        }
        
        return $errors;
    }
    
    // 获取环境信息
    public static function getEnvironmentInfo() {
        return [
            'php_version' => PHP_VERSION,
            'os' => php_uname(),
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
            'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? '',
            'server_name' => $_SERVER['SERVER_NAME'] ?? '',
            'is_serv00' => isServ00Environment(),
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time'),
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'post_max_size' => ini_get('post_max_size'),
            'extensions' => get_loaded_extensions()
        ];
    }
}

// 自动应用配置
if (isServ00Environment()) {
    Serv00Config::applySystemConfig();
}

// 导出配置常量
foreach (Serv00Config::getAllConfig() as $section => $config) {
    foreach ($config as $key => $value) {
        if (is_scalar($value)) {
            $constantName = strtoupper($section . '_' . $key);
            if (!defined($constantName)) {
                define($constantName, $value);
            }
        }
    }
}

// 全局配置函数
function config($key = null, $default = null) {
    static $config = null;
    
    if ($config === null) {
        $config = Serv00Config::getAllConfig();
    }
    
    if ($key === null) {
        return $config;
    }
    
    $keys = explode('.', $key);
    $value = $config;
    
    foreach ($keys as $k) {
        if (!isset($value[$k])) {
            return $default;
        }
        $value = $value[$k];
    }
    
    return $value;
}

// 环境检查函数
function checkEnvironment() {
    $errors = Serv00Config::validateConfig();
    
    if (!empty($errors)) {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => '环境配置检查失败',
            'errors' => $errors
        ]);
        exit;
    }
    
    return true;
}

?>
