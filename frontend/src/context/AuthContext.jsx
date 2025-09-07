import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated on app load
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      // Verify token with backend
      authAPI.getProfile()
        .then(response => {
          setAdmin(response.data.admin);
          setIsAuthenticated(true);
        })
        .catch(error => {
          console.error('Token verification failed:', error);
          localStorage.removeItem('adminToken');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    try {
      console.log('🔐 AuthContext: Attempting login with:', credentials);
      const response = await authAPI.login(credentials);
      console.log('📡 AuthContext: API response:', response.data);
      
      const { token, admin } = response.data;
      
      localStorage.setItem('adminToken', token);
      setAdmin(admin);
      setIsAuthenticated(true);
      
      console.log('✅ AuthContext: Login successful, token saved');
      return { success: true };
    } catch (error) {
      console.error('❌ AuthContext: Login failed:', error);
      console.error('📄 Error response:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setAdmin(null);
    setIsAuthenticated(false);
  };

  const value = {
    admin,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};