<?php
// 环境控制器
class EnvironmentController {
    private $db;
    private $environment;
    private $statusHistory;

    public function __construct() {
        global $database;
        $this->db = $database->getConnection();
        $this->environment = new Environment($this->db);
        $this->statusHistory = new StatusHistory($this->db);
    }

    // 获取所有环境
    public function getEnvironments() {
        try {
            $environments = $this->environment->getAll();
            
            // 获取每个环境的最新状态
            foreach ($environments as &$env) {
                $latestStatus = $this->statusHistory->getLatestByEnvironment($env['id']);
                $env['current_status'] = $latestStatus;
            }
            
            sendResponse($environments);
        } catch (Exception $e) {
            handleError("获取环境列表失败: " . $e->getMessage());
        }
    }

    // 获取单个环境
    public function getEnvironment($id) {
        try {
            $environment = $this->environment->getById($id);
            
            if (!$environment) {
                handleError("环境不存在", 404);
                return;
            }
            
            // 获取最新状态
            $latestStatus = $this->statusHistory->getLatestByEnvironment($id);
            $environment['current_status'] = $latestStatus;
            
            // 获取状态历史
            $statusHistory = $this->statusHistory->getByEnvironment($id, 10);
            $environment['status_history'] = $statusHistory;
            
            sendResponse($environment);
        } catch (Exception $e) {
            handleError("获取环境失败: " . $e->getMessage());
        }
    }

    // 创建环境
    public function createEnvironment() {
        try {
            $data = getRequestData();
            
            // 设置环境属性
            $this->environment->id = generateUUID();
            $this->environment->name = $data['name'] ?? '';
            $this->environment->url = $data['url'] ?? '';
            $this->environment->description = $data['description'] ?? '';
            $this->environment->version = $data['version'] ?? '';
            $this->environment->network_type = $data['network_type'] ?? 'external';
            $this->environment->environment_type = $data['environment_type'] ?? 'development';
            $this->environment->tags = $data['tags'] ?? [];
            $this->environment->group_id = $data['group_id'] ?? null;
            $this->environment->created_by = $this->getCurrentUserId();

            // 验证数据
            $errors = $this->environment->validate();
            if (!empty($errors)) {
                handleError("数据验证失败: " . implode(", ", $errors), 400);
                return;
            }

            // 检查名称是否已存在
            if ($this->environment->nameExists($this->environment->name)) {
                handleError("环境名称已存在", 400);
                return;
            }

            // 创建环境
            $environmentId = $this->environment->create();
            
            if ($environmentId) {
                $newEnvironment = $this->environment->getById($environmentId);
                sendResponse($newEnvironment, "环境创建成功");
            } else {
                handleError("环境创建失败");
            }
        } catch (Exception $e) {
            handleError("创建环境失败: " . $e->getMessage());
        }
    }

    // 更新环境
    public function updateEnvironment($id) {
        try {
            $data = getRequestData();
            
            // 检查环境是否存在
            $existingEnv = $this->environment->getById($id);
            if (!$existingEnv) {
                handleError("环境不存在", 404);
                return;
            }

            // 设置环境属性
            $this->environment->id = $id;
            $this->environment->name = $data['name'] ?? $existingEnv['name'];
            $this->environment->url = $data['url'] ?? $existingEnv['url'];
            $this->environment->description = $data['description'] ?? $existingEnv['description'];
            $this->environment->version = $data['version'] ?? $existingEnv['version'];
            $this->environment->network_type = $data['network_type'] ?? $existingEnv['network_type'];
            $this->environment->environment_type = $data['environment_type'] ?? $existingEnv['environment_type'];
            $this->environment->tags = $data['tags'] ?? json_decode($existingEnv['tags'], true);
            $this->environment->group_id = $data['group_id'] ?? $existingEnv['group_id'];

            // 验证数据
            $errors = $this->environment->validate();
            if (!empty($errors)) {
                handleError("数据验证失败: " . implode(", ", $errors), 400);
                return;
            }

            // 检查名称是否已存在（排除当前环境）
            if ($this->environment->nameExists($this->environment->name, $id)) {
                handleError("环境名称已存在", 400);
                return;
            }

            // 更新环境
            if ($this->environment->update()) {
                $updatedEnvironment = $this->environment->getById($id);
                sendResponse($updatedEnvironment, "环境更新成功");
            } else {
                handleError("环境更新失败");
            }
        } catch (Exception $e) {
            handleError("更新环境失败: " . $e->getMessage());
        }
    }

    // 删除环境
    public function deleteEnvironment($id) {
        try {
            // 检查环境是否存在
            $environment = $this->environment->getById($id);
            if (!$environment) {
                handleError("环境不存在", 404);
                return;
            }

            $this->environment->id = $id;
            
            if ($this->environment->delete()) {
                sendResponse(null, "环境删除成功");
            } else {
                handleError("环境删除失败");
            }
        } catch (Exception $e) {
            handleError("删除环境失败: " . $e->getMessage());
        }
    }

    // 获取环境状态
    public function getEnvironmentStatus($id) {
        try {
            $environment = $this->environment->getById($id);
            if (!$environment) {
                handleError("环境不存在", 404);
                return;
            }

            $latestStatus = $this->statusHistory->getLatestByEnvironment($id);
            $statusHistory = $this->statusHistory->getByEnvironment($id, 24); // 最近24条记录

            sendResponse([
                'environment_id' => $id,
                'current_status' => $latestStatus,
                'history' => $statusHistory
            ]);
        } catch (Exception $e) {
            handleError("获取环境状态失败: " . $e->getMessage());
        }
    }

    // 更新环境状态
    public function updateEnvironmentStatus($id) {
        try {
            $data = getRequestData();
            
            // 检查环境是否存在
            $environment = $this->environment->getById($id);
            if (!$environment) {
                handleError("环境不存在", 404);
                return;
            }

            // 设置状态历史属性
            $this->statusHistory->id = generateUUID();
            $this->statusHistory->environment_id = $id;
            $this->statusHistory->status = $data['status'] ?? 'checking';
            $this->statusHistory->response_time = $data['response_time'] ?? null;
            $this->statusHistory->status_code = $data['status_code'] ?? null;
            $this->statusHistory->error_message = $data['error_message'] ?? null;
            $this->statusHistory->detection_method = $data['detection_method'] ?? 'manual';
            $this->statusHistory->checked_by = $this->getCurrentUserId();

            // 验证状态数据
            $errors = $this->statusHistory->validate();
            if (!empty($errors)) {
                handleError("状态数据验证失败: " . implode(", ", $errors), 400);
                return;
            }

            // 添加状态记录
            if ($this->statusHistory->create()) {
                $latestStatus = $this->statusHistory->getLatestByEnvironment($id);
                sendResponse($latestStatus, "环境状态更新成功");
            } else {
                handleError("环境状态更新失败");
            }
        } catch (Exception $e) {
            handleError("更新环境状态失败: " . $e->getMessage());
        }
    }

    // 批量更新状态
    public function batchUpdateStatus() {
        try {
            $data = getRequestData();
            $environments = $data['environments'] ?? [];
            
            if (empty($environments)) {
                handleError("没有提供环境数据", 400);
                return;
            }

            $results = [];
            $this->db->beginTransaction();

            foreach ($environments as $envData) {
                try {
                    $envId = $envData['id'] ?? null;
                    if (!$envId) continue;

                    // 添加状态记录
                    $this->statusHistory->id = generateUUID();
                    $this->statusHistory->environment_id = $envId;
                    $this->statusHistory->status = $envData['status'] ?? 'checking';
                    $this->statusHistory->response_time = $envData['response_time'] ?? null;
                    $this->statusHistory->status_code = $envData['status_code'] ?? null;
                    $this->statusHistory->error_message = $envData['error_message'] ?? null;
                    $this->statusHistory->detection_method = $envData['detection_method'] ?? 'batch';
                    $this->statusHistory->checked_by = $this->getCurrentUserId();

                    if ($this->statusHistory->create()) {
                        $results[] = ['id' => $envId, 'success' => true];
                    } else {
                        $results[] = ['id' => $envId, 'success' => false, 'error' => '状态更新失败'];
                    }
                } catch (Exception $e) {
                    $results[] = ['id' => $envId, 'success' => false, 'error' => $e->getMessage()];
                }
            }

            $this->db->commit();
            sendResponse($results, "批量状态更新完成");
        } catch (Exception $e) {
            $this->db->rollback();
            handleError("批量更新状态失败: " . $e->getMessage());
        }
    }

    // 获取状态历史
    public function getStatusHistory($envId = null) {
        try {
            $limit = $_GET['limit'] ?? 100;
            
            if ($envId) {
                $history = $this->statusHistory->getByEnvironment($envId, $limit);
            } else {
                $history = $this->statusHistory->getAll($limit);
            }
            
            sendResponse($history);
        } catch (Exception $e) {
            handleError("获取状态历史失败: " . $e->getMessage());
        }
    }

    // 添加状态记录
    public function addStatusRecord($envId) {
        try {
            $data = getRequestData();
            
            // 检查环境是否存在
            $environment = $this->environment->getById($envId);
            if (!$environment) {
                handleError("环境不存在", 404);
                return;
            }

            $this->statusHistory->id = generateUUID();
            $this->statusHistory->environment_id = $envId;
            $this->statusHistory->status = $data['status'] ?? 'checking';
            $this->statusHistory->response_time = $data['response_time'] ?? null;
            $this->statusHistory->status_code = $data['status_code'] ?? null;
            $this->statusHistory->error_message = $data['error_message'] ?? null;
            $this->statusHistory->detection_method = $data['detection_method'] ?? 'manual';
            $this->statusHistory->checked_by = $this->getCurrentUserId();

            if ($this->statusHistory->create()) {
                $newRecord = $this->statusHistory->getById($this->statusHistory->id);
                sendResponse($newRecord, "状态记录添加成功");
            } else {
                handleError("状态记录添加失败");
            }
        } catch (Exception $e) {
            handleError("添加状态记录失败: " . $e->getMessage());
        }
    }

    // 获取当前用户ID（简化版）
    private function getCurrentUserId() {
        // 这里应该从JWT或会话中获取用户ID
        // 为了简化，返回默认值
        return 'admin-001';
    }

    // 数据导出
    public function exportData() {
        try {
            $environments = $this->environment->getAll();
            
            // 为每个环境添加状态历史
            foreach ($environments as &$env) {
                $env['status_history'] = $this->statusHistory->getByEnvironment($env['id']);
            }
            
            $exportData = [
                'export_time' => date('c'),
                'version' => '1.0.0',
                'environments' => $environments
            ];
            
            header('Content-Type: application/json');
            header('Content-Disposition: attachment; filename="environments_export_' . date('Y-m-d_H-i-s') . '.json"');
            echo json_encode($exportData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            handleError("数据导出失败: " . $e->getMessage());
        }
    }

    // 数据导入
    public function importData() {
        try {
            $data = getRequestData();
            
            if (!isset($data['environments']) || !is_array($data['environments'])) {
                handleError("无效的导入数据格式", 400);
                return;
            }
            
            $results = [];
            $this->db->beginTransaction();
            
            foreach ($data['environments'] as $envData) {
                try {
                    // 设置环境属性
                    $this->environment->id = $envData['id'] ?? generateUUID();
                    $this->environment->name = $envData['name'];
                    $this->environment->url = $envData['url'];
                    $this->environment->description = $envData['description'] ?? '';
                    $this->environment->version = $envData['version'] ?? '';
                    $this->environment->network_type = $envData['network_type'] ?? 'external';
                    $this->environment->environment_type = $envData['environment_type'] ?? 'development';
                    $this->environment->tags = $envData['tags'] ?? [];
                    $this->environment->group_id = $envData['group_id'] ?? null;
                    $this->environment->created_by = $this->getCurrentUserId();
                    
                    // 检查是否已存在
                    $existing = $this->environment->getById($this->environment->id);
                    
                    if ($existing) {
                        // 更新现有环境
                        if ($this->environment->update()) {
                            $results[] = ['id' => $this->environment->id, 'action' => 'updated', 'success' => true];
                        } else {
                            $results[] = ['id' => $this->environment->id, 'action' => 'update', 'success' => false];
                        }
                    } else {
                        // 创建新环境
                        if ($this->environment->create()) {
                            $results[] = ['id' => $this->environment->id, 'action' => 'created', 'success' => true];
                        } else {
                            $results[] = ['id' => $this->environment->id, 'action' => 'create', 'success' => false];
                        }
                    }
                } catch (Exception $e) {
                    $results[] = ['id' => $envData['id'] ?? 'unknown', 'action' => 'error', 'success' => false, 'error' => $e->getMessage()];
                }
            }
            
            $this->db->commit();
            sendResponse($results, "数据导入完成");
        } catch (Exception $e) {
            $this->db->rollback();
            handleError("数据导入失败: " . $e->getMessage());
        }
    }
}
?>
