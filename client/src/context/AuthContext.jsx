import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check URL query tokens (if redirected from external source)
    const urlAuth = authService.handleUrlAuthTokens();
    if (urlAuth && urlAuth.user) {
      setUser(urlAuth.user);
      setLoading(false);
      return;
    }

    // 2. Check local storage session
    const current = authService.getCurrentUser();
    if (current && authService.isAuthenticated()) {
      setUser(current);
      // Verify session with backend asynchronously
      authService.verifySession().then((valid) => {
        if (!valid) {
          setUser(null);
        }
      });
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const result = await authService.login(credentials);
    setUser(result.user);
    return result;
  };

  const register = async (userData) => {
    const result = await authService.register(userData);
    setUser(result.user);
    return result;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    try {
      localStorage.setItem('up_auth_user', JSON.stringify(updatedUser));
    } catch (e) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
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
