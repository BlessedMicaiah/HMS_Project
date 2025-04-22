import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/patient';
import { getCurrentUser, isAuthenticated, logout, login, setupAxiosInterceptors } from '../services/authService';

interface AuthContextType {
  currentUser: User | null;
  isLoggedIn: boolean;
  userRole: string | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up axios interceptors for authentication headers
    setupAxiosInterceptors();
    
    // Check if user is already logged in
    const user = getCurrentUser();
    if (user) {
      // Ensure user has firstName, lastName, and role for navbar
      setCurrentUser({
        ...user,
        firstName: user.firstName || 'Doctor',
        lastName: user.lastName || '',
        role: user.role || 'DOCTOR'
      });
    }
    setLoading(false);
  }, []);

  const handleLogin = async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const { user } = await login(username, password);
      // Ensure user has firstName, lastName, and role for navbar
      setCurrentUser({
        ...user,
        firstName: user.firstName || 'Doctor',
        lastName: user.lastName || '',
        role: user.role || 'DOCTOR'
      });
    } catch (err) {
      setError('Invalid username or password');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
  };

  const checkPermission = (permission: string): boolean => {
    if (!currentUser) return false;
    return currentUser.permissions.includes(permission);
  };

  const value = {
    currentUser,
    isLoggedIn: isAuthenticated(),
    userRole: currentUser?.role || null,
    loading,
    error,
    login: handleLogin,
    logout: handleLogout,
    hasPermission: checkPermission
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
