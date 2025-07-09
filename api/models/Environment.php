<?php
// 环境模型类
class Environment {
    private $conn;
    private $table_name = "environments";

    public $id;
    public $name;
    public $url;
    public $description;
    public $version;
    public $network_type;
    public $environment_type;
    public $tags;
    public $group_id;
    public $created_by;
    public $created_at;
    public $updated_at;
    public $is_active;

    public function __construct($db) {
        $this->conn = $db;
    }

    // 获取所有环境
    public function getAll() {
        $query = "SELECT 
                    e.*,
                    g.name as group_name,
                    g.color as group_color,
                    u.username as created_by_name
                  FROM " . $this->table_name . " e
                  LEFT JOIN environment_groups g ON e.group_id = g.id
                  LEFT JOIN users u ON e.created_by = u.id
                  WHERE e.is_active = 1
                  ORDER BY g.sort_order, e.name";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        $environments = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $row['tags'] = json_decode($row['tags'], true) ?? [];
            $environments[] = $row;
        }

        return $environments;
    }

    // 根据ID获取环境
    public function getById($id) {
        $query = "SELECT 
                    e.*,
                    g.name as group_name,
                    g.color as group_color,
                    u.username as created_by_name
                  FROM " . $this->table_name . " e
                  LEFT JOIN environment_groups g ON e.group_id = g.id
                  LEFT JOIN users u ON e.created_by = u.id
                  WHERE e.id = ? AND e.is_active = 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $row['tags'] = json_decode($row['tags'], true) ?? [];
            return $row;
        }

        return null;
    }

    // 创建环境
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET id = :id,
                      name = :name,
                      url = :url,
                      description = :description,
                      version = :version,
                      network_type = :network_type,
                      environment_type = :environment_type,
                      tags = :tags,
                      group_id = :group_id,
                      created_by = :created_by";

        $stmt = $this->conn->prepare($query);

        // 清理数据
        $this->id = $this->id ?: $this->generateUUID();
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->url = filter_var($this->url, FILTER_SANITIZE_URL);
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->version = htmlspecialchars(strip_tags($this->version));
        $this->tags = json_encode($this->tags ?? []);

        // 绑定参数
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":url", $this->url);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":version", $this->version);
        $stmt->bindParam(":network_type", $this->network_type);
        $stmt->bindParam(":environment_type", $this->environment_type);
        $stmt->bindParam(":tags", $this->tags);
        $stmt->bindParam(":group_id", $this->group_id);
        $stmt->bindParam(":created_by", $this->created_by);

        if ($stmt->execute()) {
            return $this->id;
        }

        return false;
    }

    // 更新环境
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                  SET name = :name,
                      url = :url,
                      description = :description,
                      version = :version,
                      network_type = :network_type,
                      environment_type = :environment_type,
                      tags = :tags,
                      group_id = :group_id,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id = :id AND is_active = 1";

        $stmt = $this->conn->prepare($query);

        // 清理数据
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->url = filter_var($this->url, FILTER_SANITIZE_URL);
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->version = htmlspecialchars(strip_tags($this->version));
        $this->tags = json_encode($this->tags ?? []);

        // 绑定参数
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":url", $this->url);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":version", $this->version);
        $stmt->bindParam(":network_type", $this->network_type);
        $stmt->bindParam(":environment_type", $this->environment_type);
        $stmt->bindParam(":tags", $this->tags);
        $stmt->bindParam(":group_id", $this->group_id);

        return $stmt->execute();
    }

    // 删除环境（软删除）
    public function delete() {
        $query = "UPDATE " . $this->table_name . "
                  SET is_active = 0,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);

        return $stmt->execute();
    }

    // 搜索环境
    public function search($keyword) {
        $query = "SELECT 
                    e.*,
                    g.name as group_name,
                    g.color as group_color
                  FROM " . $this->table_name . " e
                  LEFT JOIN environment_groups g ON e.group_id = g.id
                  WHERE e.is_active = 1 
                  AND (e.name LIKE :keyword 
                       OR e.description LIKE :keyword 
                       OR e.url LIKE :keyword
                       OR e.tags LIKE :keyword)
                  ORDER BY e.name";

        $stmt = $this->conn->prepare($query);
        $keyword = "%{$keyword}%";
        $stmt->bindParam(":keyword", $keyword);
        $stmt->execute();

        $environments = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $row['tags'] = json_decode($row['tags'], true) ?? [];
            $environments[] = $row;
        }

        return $environments;
    }

    // 按分组获取环境
    public function getByGroup($groupId) {
        $query = "SELECT * FROM " . $this->table_name . "
                  WHERE group_id = :group_id AND is_active = 1
                  ORDER BY name";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":group_id", $groupId);
        $stmt->execute();

        $environments = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $row['tags'] = json_decode($row['tags'], true) ?? [];
            $environments[] = $row;
        }

        return $environments;
    }

    // 获取环境统计
    public function getStatistics() {
        $query = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN environment_type = 'development' THEN 1 ELSE 0 END) as development,
                    SUM(CASE WHEN environment_type = 'testing' THEN 1 ELSE 0 END) as testing,
                    SUM(CASE WHEN environment_type = 'staging' THEN 1 ELSE 0 END) as staging,
                    SUM(CASE WHEN environment_type = 'production' THEN 1 ELSE 0 END) as production,
                    SUM(CASE WHEN network_type = 'internal' THEN 1 ELSE 0 END) as internal,
                    SUM(CASE WHEN network_type = 'external' THEN 1 ELSE 0 END) as external
                  FROM " . $this->table_name . "
                  WHERE is_active = 1";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // 验证环境数据
    public function validate() {
        $errors = [];

        if (empty($this->name)) {
            $errors[] = "环境名称不能为空";
        }

        if (empty($this->url)) {
            $errors[] = "环境URL不能为空";
        } elseif (!filter_var($this->url, FILTER_VALIDATE_URL)) {
            $errors[] = "环境URL格式无效";
        }

        if (!in_array($this->network_type, ['internal', 'external'])) {
            $errors[] = "网络类型无效";
        }

        if (!in_array($this->environment_type, ['development', 'testing', 'staging', 'production'])) {
            $errors[] = "环境类型无效";
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

    // 检查环境名称是否已存在
    public function nameExists($name, $excludeId = null) {
        $query = "SELECT id FROM " . $this->table_name . "
                  WHERE name = :name AND is_active = 1";
        
        if ($excludeId) {
            $query .= " AND id != :exclude_id";
        }

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":name", $name);
        
        if ($excludeId) {
            $stmt->bindParam(":exclude_id", $excludeId);
        }
        
        $stmt->execute();
        
        return $stmt->rowCount() > 0;
    }
}
?>
