import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'driver' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:8080/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Set default axios header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      await clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthData = async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'userData']);
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      // 데모 계정 로그인 처리
      if (email === 'driver@travelrider.com' && password === 'password123') {
        const mockUser: User = {
          id: 1,
          name: '홍배달',
          email: 'driver@travelrider.com',
          phone: '010-9876-5432',
          role: 'driver'
        };

        const mockToken = 'demo_token_' + Date.now();

        // Save to AsyncStorage
        await AsyncStorage.setItem('authToken', mockToken);
        await AsyncStorage.setItem('userData', JSON.stringify(mockUser));

        // Set axios header
        axios.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;

        setUser(mockUser);
        return true;
      }

      // 카카오 데모 계정 로그인 처리
      if (email === 'kakao@demo.com' && password === 'kakao_demo') {
        const mockUser: User = {
          id: 2,
          name: '김카카오',
          email: 'kakao@demo.com',
          phone: '010-1234-5678',
          role: 'driver'
        };

        const mockToken = 'kakao_demo_token_' + Date.now();

        // Save to AsyncStorage
        await AsyncStorage.setItem('authToken', mockToken);
        await AsyncStorage.setItem('userData', JSON.stringify(mockUser));

        // Set axios header
        axios.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;

        setUser(mockUser);
        return true;
      }

      // 실제 API 호출
      const response = await axios.post(`${API_BASE_URL}/users/login`, {
        email,
        password
      });

      if (response.data && response.data.success) {
        const { token, user: userData } = response.data.data;

        // Save to AsyncStorage
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));

        // Set axios header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        setUser(userData);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };


  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await clearAuthData();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      if (!user) return false;

      setIsLoading(true);

      const response = await axios.put(`${API_BASE_URL}/users/${user.id}`, userData);

      if (response.data && response.data.success) {
        const updatedUser = { ...user, ...userData };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;