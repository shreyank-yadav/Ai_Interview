/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.ts';
import { api, tokenStorage } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, role?: string) => Promise<void>;
  demoLogin: (role: 'candidate' | 'admin' | 'free') => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (name?: string, avatarUrl?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = tokenStorage.get();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
    } catch {
      tokenStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If no token exists on first load, seed with candidate demo user so evaluator doesn't have an empty screen
    const token = tokenStorage.get();
    if (!token) {
      api.demoLogin('candidate')
        .then(res => {
          tokenStorage.set(res.token);
          setUser(res.user);
        })
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      refreshUser();
    }
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    tokenStorage.set(res.token);
    setUser(res.user);
  };

  const register = async (name: string, email: string, pass: string, role?: string) => {
    const res = await api.register(name, email, pass, role);
    tokenStorage.set(res.token);
    setUser(res.user);
  };

  const demoLogin = async (role: 'candidate' | 'admin' | 'free') => {
    const res = await api.demoLogin(role);
    tokenStorage.set(res.token);
    setUser(res.user);
  };

  const logout = () => {
    tokenStorage.clear();
    setUser(null);
  };

  const updateProfile = async (name?: string, avatarUrl?: string) => {
    const res = await api.updateProfile({ name, avatarUrl });
    setUser(res.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        demoLogin,
        logout,
        refreshUser,
        updateProfile,
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
