import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, ProtectedRoute, useAuth } from './components/AuthProvider'
import { isAdmin, hasPermission } from './utils/auth'
import Navigation from './components/Navigation'
import EnvironmentList from './components/EnvironmentList'
import ConfigPage from './components/ConfigPage'
import UserManagementPage from './components/UserManagementPage'
import LoginPage from './components/LoginPage'
import './App.css'



// 管理员路由保护组件
const AdminRoute = ({ children }) => {
  const { user } = useAuth();

  if (!isAdmin(user)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// 权限路由保护组件
const PermissionRoute = ({ children, permission }) => {
  const { user } = useAuth();

  if (!hasPermission(user, permission)) {
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
        <Route path="/" element={
          <ProtectedRoute>
            <EnvironmentList />
          </ProtectedRoute>
        } />
        <Route path="/config" element={
          <ProtectedRoute>
            <PermissionRoute permission="config_management">
              <ConfigPage />
            </PermissionRoute>
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
