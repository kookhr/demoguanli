import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/apiClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 检查认证状态
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (authAPI.isAuthenticated()) {
        const result = await authAPI.verifyToken();
        if (result.valid) {
          const userData = await authAPI.getCurrentUser();
          setUser(userData.user);
        }
      }
    } catch (error) {
      // Token无效，清除认证状态
      authAPI.logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setError(null);
      const result = await authAPI.login(username, password);
      setUser(result.user);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const register = async (username, password, email) => {
    try {
      setError(null);
      return await authAPI.register(username, password, email);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
