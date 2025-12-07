import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/config';

interface User {
  id: number;
  email: string;
  role: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load stored auth data on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      console.log('[AuthContext] Loading stored auth data...');
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      console.log('[AuthContext] Stored token exists:', !!storedToken);
      console.log('[AuthContext] Stored user exists:', !!storedUser);

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log('[AuthContext] Restoring session for user:', parsedUser.email);
        setToken(storedToken);
        setUser(parsedUser);
      } else {
        console.log('[AuthContext] No stored auth data found');
      }
    } catch (error) {
      console.error('[AuthContext] Failed to load auth data:', error);
    } finally {
      setLoading(false);
      console.log('[AuthContext] Auth initialization complete');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Login attempt for:', email);
      console.log('[AuthContext] Calling API:', `${API_BASE_URL}/auth/login`);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('[AuthContext] Response status:', response.status);
      const data = await response.json();
      console.log('[AuthContext] Response data:', data);

      if (!response.ok || data.status === 'error') {
        console.error('[AuthContext] Login error:', data.message);
        throw new Error(data.message || 'Email sau parolă incorectă');
      }

      const { token: newToken, user: newUser } = data;
      console.log('[AuthContext] Login successful, user:', newUser);

      // Store auth data
      await AsyncStorage.setItem(TOKEN_KEY, newToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
      console.log('[AuthContext] Auth state updated');
    } catch (error: any) {
      console.error('[AuthContext] Login exception:', error);
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.status === 'error') {
        throw new Error(data.message || 'Registration failed');
      }

      const { token: newToken, user: newUser } = data;

      // Store auth data
      await AsyncStorage.setItem(TOKEN_KEY, newToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      console.log('[AuthContext] Logging out...');
      console.log('[AuthContext] Current user:', user?.email);
      
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      console.log('[AuthContext] Cleared AsyncStorage');
      
      setToken(null);
      setUser(null);
      console.log('[AuthContext] Cleared state - logout complete');
    } catch (error) {
      console.error('[AuthContext] Failed to logout:', error);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
