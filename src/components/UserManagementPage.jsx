import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  UserCheck,
  UserX,
  MoreVertical,
  Ticket,
  RefreshCw
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { 
  getAllUsers, 
  searchUsers, 
  toggleUserStatus, 
  deleteUser, 
  batchUpdateUsers, 
  batchDeleteUsers,
  getUserStatistics 
} from '../utils/userManagement';
import {
  getAllActivationCodes,
  createActivationCode,
  deleteActivationCode,
  getActivationCodeStatistics
} from '../utils/activationCodes';

const UserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [activationCodes, setActivationCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [showActivationCodes, setShowActivationCodes] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [codeStats, setCodeStats] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [usersData, codesData, userStatsData, codeStatsData] = await Promise.all([
        getAllUsers(),
        getAllActivationCodes(),
        getUserStatistics(),
        getActivationCodeStatistics()
      ]);
      
      setUsers(usersData);
      setActivationCodes(codesData);
      setUserStats(userStatsData);
      setCodeStats(codeStatsData);
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

  // 生成激活码
  const handleGenerateActivationCode = async () => {
    const description = prompt('请输入激活码描述（可选）:');
    const expiresInDays = parseInt(prompt('请输入有效期（天数，默认30天）:') || '30');
    
    if (isNaN(expiresInDays) || expiresInDays <= 0) {
      setError('有效期必须是正整数');
      return;
    }

    try {
      await createActivationCode(currentUser.username, expiresInDays, description || '');
      setSuccess('激活码生成成功');
      loadData();
    } catch (error) {
      setError('生成激活码失败: ' + error.message);
    }
  };

  // 删除激活码
  const handleDeleteActivationCode = async (code) => {
    if (!confirm(`确定要删除激活码 ${code} 吗？`)) {
      return;
    }

    try {
      await deleteActivationCode(code);
      setSuccess(`激活码 ${code} 已删除`);
      loadData();
    } catch (error) {
      setError('删除激活码失败: ' + error.message);
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '从未';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 获取状态颜色
  const getStatusColor = (enabled) => {
    return enabled !== false ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
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
          <p className="text-gray-600 dark:text-gray-400 mt-2">管理系统用户账户、权限和激活码</p>
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
                <Ticket className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">激活码</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{codeStats?.active || 0}</p>
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
                  onClick={() => setShowActivationCodes(!showActivationCodes)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-300"
                >
                  <Ticket className="w-4 h-4" />
                  {showActivationCodes ? '用户列表' : '激活码管理'}
                </button>

                <button
                  onClick={loadData}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-300"
                >
                  <RefreshCw className="w-4 h-4" />
                  刷新
                </button>
              </div>
            </div>

            {/* 批量操作 */}
            {selectedUsers.size > 0 && !showActivationCodes && (
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
        {showActivationCodes ? (
          /* 激活码管理界面将在下一个文件中实现 */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">激活码管理</h2>
                <button
                  onClick={handleGenerateActivationCode}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
                >
                  <Plus className="w-4 h-4" />
                  生成激活码
                </button>
              </div>
              
              {/* 激活码列表 */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        激活码
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        创建者
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        创建时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        过期时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        使用者
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {activationCodes.map((code) => (
                      <tr key={code.code} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm text-gray-900 dark:text-gray-100">{code.code}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            code.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                            code.status === 'used' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {code.status === 'active' ? '可用' : code.status === 'used' ? '已使用' : '已过期'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {code.createdBy}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(code.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(code.expiresAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {code.usedBy || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDeleteActivationCode(code.code)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                            {user.email && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                            )}
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
      </div>
    </div>
  );
};

export default UserManagementPage;
