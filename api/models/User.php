<?php
// 用户模型类
class User {
    private $conn;
    private $table_name = "users";

    public $id;
    public $username;
    public $email;
    public $password_hash;
    public $role;
    public $is_active;
    public $last_login;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // 获取所有用户
    public function getAll() {
        $query = "SELECT id, username, email, role, is_active, last_login, created_at, updated_at
                  FROM " . $this->table_name . "
                  WHERE is_active = 1
                  ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // 根据ID获取用户
    public function getById($id) {
        $query = "SELECT id, username, email, role, is_active, last_login, created_at, updated_at
                  FROM " . $this->table_name . "
                  WHERE id = ? AND is_active = 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // 根据用户名获取用户（包含密码，用于登录）
    public function getByUsername($username) {
        $query = "SELECT * FROM " . $this->table_name . "
                  WHERE username = ? AND is_active = 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $username);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // 根据邮箱获取用户
    public function getByEmail($email) {
        $query = "SELECT * FROM " . $this->table_name . "
                  WHERE email = ? AND is_active = 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $email);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // 创建用户
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET id = :id,
                      username = :username,
                      email = :email,
                      password_hash = :password_hash,
                      role = :role";

        $stmt = $this->conn->prepare($query);

        // 清理数据
        $this->id = $this->id ?: $this->generateUUID();
        $this->username = htmlspecialchars(strip_tags($this->username));
        $this->email = filter_var($this->email, FILTER_SANITIZE_EMAIL);
        $this->role = $this->role ?: 'user';

        // 绑定参数
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":username", $this->username);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":password_hash", $this->password_hash);
        $stmt->bindParam(":role", $this->role);

        if ($stmt->execute()) {
            return $this->id;
        }

        return false;
    }

    // 更新用户
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                  SET username = :username,
                      email = :email,
                      role = :role,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id = :id AND is_active = 1";

        $stmt = $this->conn->prepare($query);

        // 清理数据
        $this->username = htmlspecialchars(strip_tags($this->username));
        $this->email = filter_var($this->email, FILTER_SANITIZE_EMAIL);

        // 绑定参数
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":username", $this->username);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":role", $this->role);

        return $stmt->execute();
    }

    // 更新密码
    public function updatePassword($newPassword) {
        $query = "UPDATE " . $this->table_name . "
                  SET password_hash = :password_hash,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id = :id AND is_active = 1";

        $stmt = $this->conn->prepare($query);

        $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);

        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":password_hash", $passwordHash);

        return $stmt->execute();
    }

    // 更新最后登录时间
    public function updateLastLogin() {
        $query = "UPDATE " . $this->table_name . "
                  SET last_login = CURRENT_TIMESTAMP
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);

        return $stmt->execute();
    }

    // 删除用户（软删除）
    public function delete() {
        $query = "UPDATE " . $this->table_name . "
                  SET is_active = 0,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);

        return $stmt->execute();
    }

    // 验证密码
    public function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }

    // 检查用户名是否已存在
    public function usernameExists($username, $excludeId = null) {
        $query = "SELECT id FROM " . $this->table_name . "
                  WHERE username = :username AND is_active = 1";
        
        if ($excludeId) {
            $query .= " AND id != :exclude_id";
        }

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":username", $username);
        
        if ($excludeId) {
            $stmt->bindParam(":exclude_id", $excludeId);
        }
        
        $stmt->execute();
        
        return $stmt->rowCount() > 0;
    }

    // 检查邮箱是否已存在
    public function emailExists($email, $excludeId = null) {
        $query = "SELECT id FROM " . $this->table_name . "
                  WHERE email = :email AND is_active = 1";
        
        if ($excludeId) {
            $query .= " AND id != :exclude_id";
        }

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $email);
        
        if ($excludeId) {
            $stmt->bindParam(":exclude_id", $excludeId);
        }
        
        $stmt->execute();
        
        return $stmt->rowCount() > 0;
    }

    // 获取用户统计
    public function getStatistics() {
        $query = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
                    SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as users,
                    SUM(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as active_30d,
                    SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_30d
                  FROM " . $this->table_name . "
                  WHERE is_active = 1";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // 验证用户数据
    public function validate() {
        $errors = [];

        if (empty($this->username)) {
            $errors[] = "用户名不能为空";
        } elseif (strlen($this->username) < 3) {
            $errors[] = "用户名至少3个字符";
        } elseif (strlen($this->username) > 50) {
            $errors[] = "用户名不能超过50个字符";
        }

        if (!empty($this->email) && !filter_var($this->email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = "邮箱格式无效";
        }

        if (!in_array($this->role, ['admin', 'user'])) {
            $errors[] = "用户角色无效";
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

    // 搜索用户
    public function search($keyword) {
        $query = "SELECT id, username, email, role, is_active, last_login, created_at
                  FROM " . $this->table_name . "
                  WHERE is_active = 1 
                  AND (username LIKE :keyword OR email LIKE :keyword)
                  ORDER BY username";

        $stmt = $this->conn->prepare($query);
        $keyword = "%{$keyword}%";
        $stmt->bindParam(":keyword", $keyword);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
