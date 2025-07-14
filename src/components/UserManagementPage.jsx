import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Settings,
  RefreshCw,
  Key,
  Lock,
  Unlock,
  X
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import {
  getAllUsers,
  searchUsers,
  toggleUserStatus,
  deleteUser,
  batchUpdateUsers,
  batchDeleteUsers,
  getUserStatistics,
  forceReinitUserManager
} from '../utils/userManagement';
import {
  getSystemSettings,
  toggleRegistration,
  changePassword
} from '../utils/auth';

const UserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [systemSettings, setSystemSettings] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError('');

      // 如果需要强制刷新，重新初始化用户管理器
      if (forceRefresh) {
        await forceReinitUserManager();
      }

      const [usersData, userStatsData, settingsData] = await Promise.all([
        getAllUsers(),
        getUserStatistics(),
        getSystemSettings()
      ]);

      setUsers(usersData);
      setUserStats(userStatsData);
      setSystemSettings(settingsData);
    } catch (error) {
      console.error('❌ 加载用户管理数据失败:', error);
      setError('加载数据失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 搜索用户
  const handleSearch = async (query) => {
    setSearchQuery(query);
    try {
      const results = await searchUsers(query);
      setUsers(results);
    } catch (error) {
      setError('搜索失败: ' + error.message);
    }
  };

  // 切换用户状态
  const handleToggleUserStatus = async (username, enabled) => {
    try {
      await toggleUserStatus(username, enabled);
      setSuccess(`用户 ${username} 已${enabled ? '启用' : '禁用'}`);
      loadData();
    } catch (error) {
      setError('操作失败: ' + error.message);
    }
  };

  // 删除用户
  const handleDeleteUser = async (username) => {
    if (!confirm(`确定要删除用户 ${username} 吗？此操作不可恢复。`)) {
      return;
    }

    try {
      await deleteUser(username, currentUser);
      setSuccess(`用户 ${username} 已删除`);
      loadData();
    } catch (error) {
      setError('删除失败: ' + error.message);
    }
  };

  // 批量操作
  const handleBatchOperation = async (operation) => {
    if (selectedUsers.size === 0) {
      setError('请先选择要操作的用户');
      return;
    }

    const usernames = Array.from(selectedUsers);
    
    try {
      let results;
      switch (operation) {
        case 'enable':
          results = await batchUpdateUsers(usernames, { enabled: true });
          setSuccess(`已启用 ${results.filter(r => r.success).length} 个用户`);
          break;
        case 'disable':
          results = await batchUpdateUsers(usernames, { enabled: false });
          setSuccess(`已禁用 ${results.filter(r => r.success).length} 个用户`);
          break;
        case 'delete':
          if (!confirm(`确定要删除选中的 ${usernames.length} 个用户吗？此操作不可恢复。`)) {
            return;
          }
          results = await batchDeleteUsers(usernames, currentUser);
          setSuccess(`已删除 ${results.filter(r => r.success).length} 个用户`);
          break;
      }
      
      setSelectedUsers(new Set());
      loadData();
    } catch (error) {
      setError('批量操作失败: ' + error.message);
    }
  };

  // 切换注册状态
  const handleToggleRegistration = async () => {
    try {
      const newStatus = !systemSettings.registrationDisabled;
      await toggleRegistration(newStatus);
      setSuccess(`注册功能已${newStatus ? '禁用' : '启用'}`);
      loadData();
    } catch (error) {
      setError('更新注册状态失败: ' + error.message);
    }
  };

  // 修改密码
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('新密码和确认密码不匹配');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('新密码至少需要6个字符');
      return;
    }

    try {
      await changePassword(currentUser.username, passwordForm.currentPassword, passwordForm.newPassword);
      setSuccess('密码修改成功');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setError('密码修改失败: ' + error.message);
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '从未';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 获取角色颜色
  const getRoleColor = (role) => {
    return role === 'admin' ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">加载用户管理数据中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            用户管理
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">管理系统用户账户和权限设置</p>
        </div>

        {/* 统计卡片 */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">总用户数</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{userStats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
              <div className="flex items-center">
                <ShieldCheck className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">管理员</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{userStats.admins}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
              <div className="flex items-center">
                <UserCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">启用用户</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{userStats.enabled}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
              <div className="flex items-center">
                {systemSettings.registrationDisabled ? (
                  <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
                ) : (
                  <Unlock className="w-8 h-8 text-green-600 dark:text-green-400" />
                )}
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">注册状态</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {systemSettings.registrationDisabled ? '已禁用' : '已启用'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 操作栏 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 transition-colors duration-300">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* 搜索框 */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜索用户..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
                />
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300"
                >
                  <Key className="w-4 h-4" />
                  修改密码
                </button>

                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-300"
                >
                  <Settings className="w-4 h-4" />
                  {showSettings ? '用户列表' : '系统设置'}
                </button>

                <button
                  onClick={() => loadData(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-300"
                  title="强制刷新用户数据"
                >
                  <RefreshCw className="w-4 h-4" />
                  强制刷新
                </button>
              </div>
            </div>

            {/* 批量操作 */}
            {selectedUsers.size > 0 && !showSettings && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-blue-800 dark:text-blue-200">
                    已选择 {selectedUsers.size} 个用户
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBatchOperation('enable')}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      批量启用
                    </button>
                    <button
                      onClick={() => handleBatchOperation('disable')}
                      className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                    >
                      批量禁用
                    </button>
                    <button
                      onClick={() => handleBatchOperation('delete')}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      批量删除
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 错误和成功消息 */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-600 dark:text-green-400">{success}</p>
          </div>
        )}

        {/* 主要内容区域 */}
        {showSettings ? (
          /* 系统设置界面 */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-300">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">系统设置</h2>
              
              <div className="space-y-6">
                {/* 注册控制 */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">用户注册控制</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      控制是否允许新用户通过注册页面创建账户
                    </p>
                  </div>
                  <button
                    onClick={handleToggleRegistration}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      systemSettings.registrationDisabled ? 'bg-red-600' : 'bg-green-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        systemSettings.registrationDisabled ? 'translate-x-1' : 'translate-x-6'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 用户列表界面 */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-300">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === users.length && users.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(new Set(users.map(u => u.username)));
                          } else {
                            setSelectedUsers(new Set());
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      用户
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      角色
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      最后登录
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.username} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.username)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedUsers);
                            if (e.target.checked) {
                              newSelected.add(user.username);
                            } else {
                              newSelected.delete(user.username);
                            }
                            setSelectedUsers(newSelected);
                          }}
                          disabled={user.username === currentUser?.username}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {user.username}
                              {user.username === currentUser?.username && (
                                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(当前用户)</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email || '未设置邮箱'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {user.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                          {user.role === 'admin' ? '管理员' : '用户'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                          user.enabled !== false ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {user.enabled !== false ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          {user.enabled !== false ? '启用' : '禁用'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(user.lastLogin)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleUserStatus(user.username, user.enabled === false)}
                            disabled={user.username === currentUser?.username}
                            className={`${
                              user.enabled !== false ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400' : 'text-green-600 hover:text-green-900 dark:text-green-400'
                            } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={user.enabled !== false ? '禁用用户' : '启用用户'}
                          >
                            {user.enabled !== false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => handleDeleteUser(user.username)}
                            disabled={user.username === currentUser?.username}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="删除用户"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 密码修改模态框 */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">修改密码</h3>
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      当前密码
                    </label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      新密码
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      确认新密码
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleChangePassword}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    确认修改
                  </button>
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;
