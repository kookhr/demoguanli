<?php
// 认证控制器
class AuthController {
    private $db;
    private $user;

    public function __construct() {
        global $database;
        $this->db = $database->getConnection();
        $this->user = new User($this->db);
    }

    // 用户登录
    public function login() {
        try {
            $data = getRequestData();
            
            $username = $data['username'] ?? '';
            $password = $data['password'] ?? '';

            // 验证输入
            if (empty($username) || empty($password)) {
                handleError("用户名和密码不能为空", 400);
                return;
            }

            // 获取用户信息
            $user = $this->user->getByUsername($username);
            
            if (!$user) {
                handleError("用户名或密码错误", 401);
                return;
            }

            // 验证密码
            if (!$this->user->verifyPassword($password, $user['password_hash'])) {
                handleError("用户名或密码错误", 401);
                return;
            }

            // 检查用户是否激活
            if (!$user['is_active']) {
                handleError("账户已被禁用", 401);
                return;
            }

            // 更新最后登录时间
            $this->user->id = $user['id'];
            $this->user->updateLastLogin();

            // 生成JWT令牌
            $token = $this->generateJWT($user);

            // 返回用户信息和令牌
            $response = [
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'role' => $user['role']
                ],
                'token' => $token,
                'expires_in' => JWT_EXPIRATION
            ];

            sendResponse($response, "登录成功");
        } catch (Exception $e) {
            handleError("登录失败: " . $e->getMessage());
        }
    }

    // 用户注册
    public function register() {
        try {
            $data = getRequestData();
            
            // 设置用户属性
            $this->user->id = generateUUID();
            $this->user->username = $data['username'] ?? '';
            $this->user->email = $data['email'] ?? '';
            $this->user->role = 'user'; // 新注册用户默认为普通用户
            
            $password = $data['password'] ?? '';
            $confirmPassword = $data['confirm_password'] ?? '';

            // 验证输入
            if (empty($password)) {
                handleError("密码不能为空", 400);
                return;
            }

            if (strlen($password) < 6) {
                handleError("密码至少6个字符", 400);
                return;
            }

            if ($password !== $confirmPassword) {
                handleError("两次输入的密码不一致", 400);
                return;
            }

            // 验证用户数据
            $errors = $this->user->validate();
            if (!empty($errors)) {
                handleError("数据验证失败: " . implode(", ", $errors), 400);
                return;
            }

            // 检查用户名是否已存在
            if ($this->user->usernameExists($this->user->username)) {
                handleError("用户名已存在", 400);
                return;
            }

            // 检查邮箱是否已存在
            if (!empty($this->user->email) && $this->user->emailExists($this->user->email)) {
                handleError("邮箱已存在", 400);
                return;
            }

            // 加密密码
            $this->user->password_hash = password_hash($password, PASSWORD_DEFAULT);

            // 创建用户
            $userId = $this->user->create();
            
            if ($userId) {
                $newUser = $this->user->getById($userId);
                
                // 生成JWT令牌
                $token = $this->generateJWT($newUser);

                $response = [
                    'user' => [
                        'id' => $newUser['id'],
                        'username' => $newUser['username'],
                        'email' => $newUser['email'],
                        'role' => $newUser['role']
                    ],
                    'token' => $token,
                    'expires_in' => JWT_EXPIRATION
                ];

                sendResponse($response, "注册成功");
            } else {
                handleError("注册失败");
            }
        } catch (Exception $e) {
            handleError("注册失败: " . $e->getMessage());
        }
    }

    // 用户登出
    public function logout() {
        try {
            // 在实际应用中，这里应该将JWT令牌加入黑名单
            // 或者删除服务器端的会话记录
            
            sendResponse(null, "登出成功");
        } catch (Exception $e) {
            handleError("登出失败: " . $e->getMessage());
        }
    }

    // 获取当前用户信息
    public function getCurrentUser() {
        try {
            // 从JWT令牌中获取用户ID
            $userId = $this->getUserIdFromToken();
            
            if (!$userId) {
                handleError("无效的令牌", 401);
                return;
            }

            $user = $this->user->getById($userId);
            
            if (!$user) {
                handleError("用户不存在", 404);
                return;
            }

            $response = [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'role' => $user['role'],
                'last_login' => $user['last_login'],
                'created_at' => $user['created_at']
            ];

            sendResponse($response);
        } catch (Exception $e) {
            handleError("获取用户信息失败: " . $e->getMessage());
        }
    }

    // 刷新令牌
    public function refreshToken() {
        try {
            $userId = $this->getUserIdFromToken();
            
            if (!$userId) {
                handleError("无效的令牌", 401);
                return;
            }

            $user = $this->user->getById($userId);
            
            if (!$user || !$user['is_active']) {
                handleError("用户不存在或已被禁用", 401);
                return;
            }

            // 生成新的JWT令牌
            $token = $this->generateJWT($user);

            $response = [
                'token' => $token,
                'expires_in' => JWT_EXPIRATION
            ];

            sendResponse($response, "令牌刷新成功");
        } catch (Exception $e) {
            handleError("令牌刷新失败: " . $e->getMessage());
        }
    }

    // 修改密码
    public function changePassword() {
        try {
            $data = getRequestData();
            $userId = $this->getUserIdFromToken();
            
            if (!$userId) {
                handleError("无效的令牌", 401);
                return;
            }

            $currentPassword = $data['current_password'] ?? '';
            $newPassword = $data['new_password'] ?? '';
            $confirmPassword = $data['confirm_password'] ?? '';

            // 验证输入
            if (empty($currentPassword) || empty($newPassword)) {
                handleError("当前密码和新密码不能为空", 400);
                return;
            }

            if (strlen($newPassword) < 6) {
                handleError("新密码至少6个字符", 400);
                return;
            }

            if ($newPassword !== $confirmPassword) {
                handleError("两次输入的新密码不一致", 400);
                return;
            }

            // 获取用户信息
            $user = $this->user->getByUsername($this->getUsernameFromToken());
            
            if (!$user) {
                handleError("用户不存在", 404);
                return;
            }

            // 验证当前密码
            if (!$this->user->verifyPassword($currentPassword, $user['password_hash'])) {
                handleError("当前密码错误", 400);
                return;
            }

            // 更新密码
            $this->user->id = $userId;
            
            if ($this->user->updatePassword($newPassword)) {
                sendResponse(null, "密码修改成功");
            } else {
                handleError("密码修改失败");
            }
        } catch (Exception $e) {
            handleError("修改密码失败: " . $e->getMessage());
        }
    }

    // 生成JWT令牌（简化版）
    private function generateJWT($user) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'user_id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'iat' => time(),
            'exp' => time() + JWT_EXPIRATION
        ]);

        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, JWT_SECRET, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }

    // 验证JWT令牌（简化版）
    private function verifyJWT($token) {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            return false;
        }

        $header = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[0]));
        $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1]));
        $signature = $parts[2];

        $expectedSignature = str_replace(['+', '/', '='], ['-', '_', ''], 
            base64_encode(hash_hmac('sha256', $parts[0] . "." . $parts[1], JWT_SECRET, true)));

        if ($signature !== $expectedSignature) {
            return false;
        }

        $payloadData = json_decode($payload, true);
        
        if ($payloadData['exp'] < time()) {
            return false;
        }

        return $payloadData;
    }

    // 从令牌中获取用户ID
    private function getUserIdFromToken() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        
        if (strpos($authHeader, 'Bearer ') === 0) {
            $token = substr($authHeader, 7);
            $payload = $this->verifyJWT($token);
            
            if ($payload) {
                return $payload['user_id'];
            }
        }
        
        return null;
    }

    // 从令牌中获取用户名
    private function getUsernameFromToken() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        
        if (strpos($authHeader, 'Bearer ') === 0) {
            $token = substr($authHeader, 7);
            $payload = $this->verifyJWT($token);
            
            if ($payload) {
                return $payload['username'];
            }
        }
        
        return null;
    }
}
?>
