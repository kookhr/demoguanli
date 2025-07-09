<?php
// 用户控制器
class UserController {
    private $db;
    private $user;

    public function __construct() {
        global $database;
        $this->db = $database->getConnection();
        $this->user = new User($this->db);
    }

    // 获取所有用户
    public function getUsers() {
        try {
            $users = $this->user->getAll();
            sendResponse($users);
        } catch (Exception $e) {
            handleError("获取用户列表失败: " . $e->getMessage());
        }
    }

    // 获取单个用户
    public function getUser($id) {
        try {
            $user = $this->user->getById($id);
            
            if (!$user) {
                handleError("用户不存在", 404);
                return;
            }
            
            sendResponse($user);
        } catch (Exception $e) {
            handleError("获取用户失败: " . $e->getMessage());
        }
    }

    // 创建用户
    public function createUser() {
        try {
            $data = getRequestData();
            
            // 设置用户属性
            $this->user->id = generateUUID();
            $this->user->username = $data['username'] ?? '';
            $this->user->email = $data['email'] ?? '';
            $this->user->role = $data['role'] ?? 'user';
            
            // 验证数据
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

            // 设置默认密码
            $defaultPassword = $data['password'] ?? 'password123';
            $this->user->password_hash = password_hash($defaultPassword, PASSWORD_DEFAULT);

            // 创建用户
            $userId = $this->user->create();
            
            if ($userId) {
                $newUser = $this->user->getById($userId);
                sendResponse($newUser, "用户创建成功");
            } else {
                handleError("用户创建失败");
            }
        } catch (Exception $e) {
            handleError("创建用户失败: " . $e->getMessage());
        }
    }

    // 更新用户
    public function updateUser($id) {
        try {
            $data = getRequestData();
            
            // 检查用户是否存在
            $existingUser = $this->user->getById($id);
            if (!$existingUser) {
                handleError("用户不存在", 404);
                return;
            }

            // 设置用户属性
            $this->user->id = $id;
            $this->user->username = $data['username'] ?? $existingUser['username'];
            $this->user->email = $data['email'] ?? $existingUser['email'];
            $this->user->role = $data['role'] ?? $existingUser['role'];

            // 验证数据
            $errors = $this->user->validate();
            if (!empty($errors)) {
                handleError("数据验证失败: " . implode(", ", $errors), 400);
                return;
            }

            // 检查用户名是否已存在（排除当前用户）
            if ($this->user->usernameExists($this->user->username, $id)) {
                handleError("用户名已存在", 400);
                return;
            }

            // 检查邮箱是否已存在（排除当前用户）
            if (!empty($this->user->email) && $this->user->emailExists($this->user->email, $id)) {
                handleError("邮箱已存在", 400);
                return;
            }

            // 更新用户
            if ($this->user->update()) {
                $updatedUser = $this->user->getById($id);
                sendResponse($updatedUser, "用户更新成功");
            } else {
                handleError("用户更新失败");
            }
        } catch (Exception $e) {
            handleError("更新用户失败: " . $e->getMessage());
        }
    }

    // 删除用户
    public function deleteUser($id) {
        try {
            // 检查用户是否存在
            $user = $this->user->getById($id);
            if (!$user) {
                handleError("用户不存在", 404);
                return;
            }

            // 防止删除管理员账户
            if ($user['role'] === 'admin') {
                // 检查是否是最后一个管理员
                $stats = $this->user->getStatistics();
                if ($stats['admins'] <= 1) {
                    handleError("不能删除最后一个管理员账户", 400);
                    return;
                }
            }

            $this->user->id = $id;
            
            if ($this->user->delete()) {
                sendResponse(null, "用户删除成功");
            } else {
                handleError("用户删除失败");
            }
        } catch (Exception $e) {
            handleError("删除用户失败: " . $e->getMessage());
        }
    }

    // 修改密码
    public function changePassword($id) {
        try {
            $data = getRequestData();
            
            // 检查用户是否存在
            $user = $this->user->getById($id);
            if (!$user) {
                handleError("用户不存在", 404);
                return;
            }

            $newPassword = $data['new_password'] ?? '';
            $confirmPassword = $data['confirm_password'] ?? '';

            // 验证密码
            if (empty($newPassword)) {
                handleError("新密码不能为空", 400);
                return;
            }

            if (strlen($newPassword) < 6) {
                handleError("密码至少6个字符", 400);
                return;
            }

            if ($newPassword !== $confirmPassword) {
                handleError("两次输入的密码不一致", 400);
                return;
            }

            $this->user->id = $id;
            
            if ($this->user->updatePassword($newPassword)) {
                sendResponse(null, "密码修改成功");
            } else {
                handleError("密码修改失败");
            }
        } catch (Exception $e) {
            handleError("修改密码失败: " . $e->getMessage());
        }
    }

    // 搜索用户
    public function searchUsers() {
        try {
            $keyword = $_GET['q'] ?? '';
            
            if (empty($keyword)) {
                $users = $this->user->getAll();
            } else {
                $users = $this->user->search($keyword);
            }
            
            sendResponse($users);
        } catch (Exception $e) {
            handleError("搜索用户失败: " . $e->getMessage());
        }
    }

    // 获取用户统计
    public function getUserStatistics() {
        try {
            $stats = $this->user->getStatistics();
            sendResponse($stats);
        } catch (Exception $e) {
            handleError("获取用户统计失败: " . $e->getMessage());
        }
    }

    // 批量操作用户
    public function batchOperation() {
        try {
            $data = getRequestData();
            $operation = $data['operation'] ?? '';
            $userIds = $data['user_ids'] ?? [];

            if (empty($operation) || empty($userIds)) {
                handleError("操作类型和用户ID不能为空", 400);
                return;
            }

            $results = [];
            $this->db->beginTransaction();

            foreach ($userIds as $userId) {
                try {
                    switch ($operation) {
                        case 'delete':
                            $this->user->id = $userId;
                            if ($this->user->delete()) {
                                $results[] = ['id' => $userId, 'success' => true, 'action' => 'deleted'];
                            } else {
                                $results[] = ['id' => $userId, 'success' => false, 'error' => '删除失败'];
                            }
                            break;

                        case 'activate':
                            // 这里可以添加激活用户的逻辑
                            $results[] = ['id' => $userId, 'success' => true, 'action' => 'activated'];
                            break;

                        case 'deactivate':
                            // 这里可以添加停用用户的逻辑
                            $results[] = ['id' => $userId, 'success' => true, 'action' => 'deactivated'];
                            break;

                        default:
                            $results[] = ['id' => $userId, 'success' => false, 'error' => '不支持的操作'];
                    }
                } catch (Exception $e) {
                    $results[] = ['id' => $userId, 'success' => false, 'error' => $e->getMessage()];
                }
            }

            $this->db->commit();
            sendResponse($results, "批量操作完成");
        } catch (Exception $e) {
            $this->db->rollback();
            handleError("批量操作失败: " . $e->getMessage());
        }
    }

    // 获取当前用户ID（简化版）
    private function getCurrentUserId() {
        // 这里应该从JWT或会话中获取用户ID
        // 为了简化，返回默认值
        return 'admin-001';
    }

    // 检查是否有管理员权限
    private function isAdmin() {
        // 这里应该检查当前用户的角色
        // 为了简化，返回true
        return true;
    }
}
?>
