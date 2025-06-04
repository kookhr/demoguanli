import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, ProtectedRoute, useAuth } from './components/AuthProvider'
import { isAdmin } from './utils/auth'
import Navigation from './components/Navigation'
import MinimalEnvironmentList from './components/MinimalEnvironmentList'
import ConfigPage from './components/ConfigPage'
import UserManagementPage from './components/UserManagementPage'
import LoginPage from './components/LoginPage'
import './App.css'

// 最小化测试组件
const TestComponent = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-900">测试页面</h1>
      <p className="text-gray-600 mt-4">如果您能看到这个页面，说明基础 React 正常工作。</p>
    </div>
  );
};

// 管理员路由保护组件
const AdminRoute = ({ children }) => {
  const { user } = useAuth();

  if (!isAdmin(user)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// 主应用内容组件
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="App">
      <Navigation />
      <Routes>
        <Route path="/test" element={<TestComponent />} />
        <Route path="/" element={
          <ProtectedRoute>
            <MinimalEnvironmentList />
          </ProtectedRoute>
        } />
        <Route path="/config" element={
          <ProtectedRoute>
            <ConfigPage />
          </ProtectedRoute>
        } />
        <Route path="/user-management" element={
          <ProtectedRoute>
            <AdminRoute>
              <UserManagementPage />
            </AdminRoute>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App
