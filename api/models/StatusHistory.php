<?php
// 状态历史模型类
class StatusHistory {
    private $conn;
    private $table_name = "status_history";

    public $id;
    public $environment_id;
    public $status;
    public $response_time;
    public $status_code;
    public $error_message;
    public $detection_method;
    public $checked_at;
    public $checked_by;

    public function __construct($db) {
        $this->conn = $db;
    }

    // 获取所有状态历史
    public function getAll($limit = 100) {
        $query = "SELECT 
                    sh.*,
                    e.name as environment_name,
                    u.username as checked_by_name
                  FROM " . $this->table_name . " sh
                  LEFT JOIN environments e ON sh.environment_id = e.id
                  LEFT JOIN users u ON sh.checked_by = u.id
                  ORDER BY sh.checked_at DESC
                  LIMIT :limit";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // 根据环境ID获取状态历史
    public function getByEnvironment($environmentId, $limit = 100) {
        $query = "SELECT 
                    sh.*,
                    u.username as checked_by_name
                  FROM " . $this->table_name . " sh
                  LEFT JOIN users u ON sh.checked_by = u.id
                  WHERE sh.environment_id = :environment_id
                  ORDER BY sh.checked_at DESC
                  LIMIT :limit";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':environment_id', $environmentId);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // 获取环境的最新状态
    public function getLatestByEnvironment($environmentId) {
        $query = "SELECT 
                    sh.*,
                    u.username as checked_by_name
                  FROM " . $this->table_name . " sh
                  LEFT JOIN users u ON sh.checked_by = u.id
                  WHERE sh.environment_id = :environment_id
                  ORDER BY sh.checked_at DESC
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':environment_id', $environmentId);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // 根据ID获取状态记录
    public function getById($id) {
        $query = "SELECT 
                    sh.*,
                    e.name as environment_name,
                    u.username as checked_by_name
                  FROM " . $this->table_name . " sh
                  LEFT JOIN environments e ON sh.environment_id = e.id
                  LEFT JOIN users u ON sh.checked_by = u.id
                  WHERE sh.id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // 创建状态记录
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET id = :id,
                      environment_id = :environment_id,
                      status = :status,
                      response_time = :response_time,
                      status_code = :status_code,
                      error_message = :error_message,
                      detection_method = :detection_method,
                      checked_by = :checked_by";

        $stmt = $this->conn->prepare($query);

        // 清理数据
        $this->id = $this->id ?: $this->generateUUID();
        $this->error_message = htmlspecialchars(strip_tags($this->error_message));
        $this->detection_method = htmlspecialchars(strip_tags($this->detection_method));

        // 绑定参数
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":environment_id", $this->environment_id);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":response_time", $this->response_time);
        $stmt->bindParam(":status_code", $this->status_code);
        $stmt->bindParam(":error_message", $this->error_message);
        $stmt->bindParam(":detection_method", $this->detection_method);
        $stmt->bindParam(":checked_by", $this->checked_by);

        if ($stmt->execute()) {
            return $this->id;
        }

        return false;
    }

    // 获取环境状态统计
    public function getEnvironmentStats($environmentId, $hours = 24) {
        $query = "SELECT 
                    COUNT(*) as total_checks,
                    SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_count,
                    SUM(CASE WHEN status = 'unreachable' THEN 1 ELSE 0 END) as unreachable_count,
                    AVG(CASE WHEN response_time IS NOT NULL THEN response_time END) as avg_response_time,
                    MIN(CASE WHEN response_time IS NOT NULL THEN response_time END) as min_response_time,
                    MAX(CASE WHEN response_time IS NOT NULL THEN response_time END) as max_response_time
                  FROM " . $this->table_name . "
                  WHERE environment_id = :environment_id
                  AND checked_at >= DATE_SUB(NOW(), INTERVAL :hours HOUR)";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':environment_id', $environmentId);
        $stmt->bindParam(':hours', $hours, PDO::PARAM_INT);
        $stmt->execute();

        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // 计算可用率
        if ($stats['total_checks'] > 0) {
            $stats['availability_rate'] = round(($stats['available_count'] / $stats['total_checks']) * 100, 2);
        } else {
            $stats['availability_rate'] = 0;
        }

        return $stats;
    }

    // 获取时间段内的状态趋势
    public function getStatusTrend($environmentId, $hours = 24, $interval = 1) {
        $query = "SELECT 
                    DATE_FORMAT(checked_at, '%Y-%m-%d %H:00:00') as time_slot,
                    COUNT(*) as total_checks,
                    SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_count,
                    AVG(CASE WHEN response_time IS NOT NULL THEN response_time END) as avg_response_time
                  FROM " . $this->table_name . "
                  WHERE environment_id = :environment_id
                  AND checked_at >= DATE_SUB(NOW(), INTERVAL :hours HOUR)
                  GROUP BY time_slot
                  ORDER BY time_slot";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':environment_id', $environmentId);
        $stmt->bindParam(':hours', $hours, PDO::PARAM_INT);
        $stmt->execute();

        $trend = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // 计算每个时间段的可用率
        foreach ($trend as &$point) {
            if ($point['total_checks'] > 0) {
                $point['availability_rate'] = round(($point['available_count'] / $point['total_checks']) * 100, 2);
            } else {
                $point['availability_rate'] = 0;
            }
        }

        return $trend;
    }

    // 获取所有环境的最新状态
    public function getAllLatestStatus() {
        $query = "SELECT 
                    e.id as environment_id,
                    e.name as environment_name,
                    sh.status,
                    sh.response_time,
                    sh.status_code,
                    sh.checked_at,
                    sh.detection_method
                  FROM environments e
                  LEFT JOIN (
                    SELECT DISTINCT environment_id,
                      FIRST_VALUE(status) OVER (PARTITION BY environment_id ORDER BY checked_at DESC) as status,
                      FIRST_VALUE(response_time) OVER (PARTITION BY environment_id ORDER BY checked_at DESC) as response_time,
                      FIRST_VALUE(status_code) OVER (PARTITION BY environment_id ORDER BY checked_at DESC) as status_code,
                      FIRST_VALUE(checked_at) OVER (PARTITION BY environment_id ORDER BY checked_at DESC) as checked_at,
                      FIRST_VALUE(detection_method) OVER (PARTITION BY environment_id ORDER BY checked_at DESC) as detection_method
                    FROM " . $this->table_name . "
                  ) sh ON e.id = sh.environment_id
                  WHERE e.is_active = 1
                  ORDER BY e.name";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // 清理旧的状态历史记录
    public function cleanOldRecords($days = 30) {
        $query = "DELETE FROM " . $this->table_name . "
                  WHERE checked_at < DATE_SUB(NOW(), INTERVAL :days DAY)";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':days', $days, PDO::PARAM_INT);
        
        return $stmt->execute();
    }

    // 获取系统状态概览
    public function getSystemOverview() {
        $query = "SELECT 
                    COUNT(DISTINCT environment_id) as total_environments,
                    COUNT(*) as total_checks,
                    SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_checks,
                    SUM(CASE WHEN status = 'unreachable' THEN 1 ELSE 0 END) as unreachable_checks,
                    AVG(CASE WHEN response_time IS NOT NULL THEN response_time END) as avg_response_time
                  FROM " . $this->table_name . "
                  WHERE checked_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        $overview = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // 计算整体可用率
        if ($overview['total_checks'] > 0) {
            $overview['overall_availability'] = round(($overview['available_checks'] / $overview['total_checks']) * 100, 2);
        } else {
            $overview['overall_availability'] = 0;
        }

        return $overview;
    }

    // 验证状态数据
    public function validate() {
        $errors = [];

        if (empty($this->environment_id)) {
            $errors[] = "环境ID不能为空";
        }

        if (!in_array($this->status, ['available', 'unreachable', 'checking'])) {
            $errors[] = "状态值无效";
        }

        if ($this->response_time !== null && (!is_numeric($this->response_time) || $this->response_time < 0)) {
            $errors[] = "响应时间必须是非负数";
        }

        if ($this->status_code !== null && (!is_numeric($this->status_code) || $this->status_code < 100 || $this->status_code > 599)) {
            $errors[] = "HTTP状态码无效";
        }

        return $errors;
    }

    // 生成UUID
    private function generateUUID() {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }

    // 批量插入状态记录
    public function batchInsert($records) {
        if (empty($records)) {
            return false;
        }

        $placeholders = [];
        $values = [];

        foreach ($records as $record) {
            $placeholders[] = "(?, ?, ?, ?, ?, ?, ?, ?)";
            $values[] = $record['id'] ?? $this->generateUUID();
            $values[] = $record['environment_id'];
            $values[] = $record['status'];
            $values[] = $record['response_time'];
            $values[] = $record['status_code'];
            $values[] = $record['error_message'];
            $values[] = $record['detection_method'];
            $values[] = $record['checked_by'];
        }

        $query = "INSERT INTO " . $this->table_name . "
                  (id, environment_id, status, response_time, status_code, error_message, detection_method, checked_by)
                  VALUES " . implode(', ', $placeholders);

        $stmt = $this->conn->prepare($query);
        
        return $stmt->execute($values);
    }
}
?>
