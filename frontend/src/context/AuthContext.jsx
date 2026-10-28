import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchCurrentUser, loginUser, registerUser, logoutUser } from '../api/auth.js';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check current session on load
  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const res = await fetchCurrentUser();
        if (mounted && res.success && res.data?.user) {
          setUser(res.data.user);
        }
      } catch {
        // Not authenticated
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const res = await loginUser(email, password);
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      if (res.data.token) {
        api.setToken(res.data.token);
      }
    }
    return res;
  };

  const register = async (email, password, name) => {
    const res = await registerUser(email, password, name);
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      if (res.data.token) {
        api.setToken(res.data.token);
      }
    }
    return res;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      api.clearToken();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
