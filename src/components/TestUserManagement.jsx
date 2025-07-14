import React, { useState, useEffect } from 'react';
import { usersAPI } from '../utils/apiClient';
import { register } from '../utils/auth';

const TestUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: ''
  });

  // 加载用户列表
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const userList = await usersAPI.getAll();
      setUsers(userList);
      setSuccess('用户列表加载成功');
    } catch (error) {
      setError('加载用户列表失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 注册新用户
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      const emailToSubmit = formData.email.trim() || null;
      await register(formData.username, formData.password, emailToSubmit);
      
      setSuccess(`用户 ${formData.username} 注册成功！`);
      setFormData({ username: '', password: '', email: '' });
      
      // 重新加载用户列表
      setTimeout(loadUsers, 1000);
    } catch (error) {
      setError('注册失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 删除用户
  const handleDeleteUser = async (username) => {
    if (!confirm(`确定要删除用户 ${username} 吗？`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      await usersAPI.delete(username);
      setSuccess(`用户 ${username} 删除成功`);
      loadUsers();
    } catch (error) {
      setError('删除用户失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">用户管理测试页面</h1>
      
      {/* 状态消息 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* 注册表单 */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow border">
        <h2 className="text-lg font-semibold mb-4">注册新用户</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">用户名 *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">密码 *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">邮箱 (可选)</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="留空表示不设置邮箱"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '注册中...' : '注册用户'}
          </button>
        </form>
      </div>

      {/* 用户列表 */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">用户列表</h2>
            <button
              onClick={loadUsers}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? '加载中...' : '刷新'}
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {users.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无用户数据</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">用户名</th>
                    <th className="text-left py-2">邮箱</th>
                    <th className="text-left py-2">角色</th>
                    <th className="text-left py-2">状态</th>
                    <th className="text-left py-2">创建时间</th>
                    <th className="text-left py-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.username} className="border-b">
                      <td className="py-2">{user.username}</td>
                      <td className="py-2">{user.email || '未设置'}</td>
                      <td className="py-2">{user.role === 'admin' ? '管理员' : '用户'}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.enabled !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.enabled !== false ? '启用' : '禁用'}
                        </span>
                      </td>
                      <td className="py-2">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-2">
                        {user.username !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(user.username)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            删除
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestUserManagement;
