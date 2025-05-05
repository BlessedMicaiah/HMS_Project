import axios from 'axios';
import { User } from '../types/patient';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// For development, create mock user data
const MOCK_USERS = {
  admin: {
    id: '1',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    role: 'ADMIN',
    permissions: ['read', 'write', 'delete', 'admin']
  },
  doctor: {
    id: '2',
    username: 'doctor',
    firstName: 'Doctor',
    lastName: 'Smith',
    email: 'doctor@example.com',
    role: 'DOCTOR',
    permissions: ['read', 'write', 'delete']
  }
};

// User authentication
export const login = async (username: string, password: string): Promise<{ user: User, token: string }> => {
  // For development, use mock authentication
  if (process.env.NODE_ENV === 'development') {
    // Check if username exists in mock users
    if (username in MOCK_USERS) {
      const mockUser = MOCK_USERS[username as keyof typeof MOCK_USERS];
      
      // Store user in localStorage
      localStorage.setItem('token', mockUser.id);
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      return { 
        user: mockUser,
        token: mockUser.id
      };
    } else {
      throw new Error('Invalid username or password');
    }
  }
  
  // For production, use actual API
  try {
    console.log('Attempting to login via API Gateway');
    // First try with API Gateway
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { username, password });
      console.log('API Gateway login successful');
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    } catch (gatewayError) {
      console.error('API Gateway login failed:', gatewayError);
      
      // If API Gateway fails, try direct connection
      console.log('Attempting direct connection to Patient Service');
      const directResponse = await axios.post('https://hms-patient-service-i6ww.onrender.com/api/auth/login', { 
        username, 
        password 
      });
      console.log('Direct connection login successful');
      // Store token in localStorage
      localStorage.setItem('token', directResponse.data.token);
      localStorage.setItem('user', JSON.stringify(directResponse.data.user));
      return directResponse.data;
    }
  } catch (error) {
    console.error('All login attempts failed:', error);
    throw error;
  }
};

export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    // For development, auto-login as doctor if no user exists
    if (process.env.NODE_ENV === 'development') {
      const defaultUser = MOCK_USERS.doctor;
      localStorage.setItem('token', defaultUser.id);
      localStorage.setItem('user', JSON.stringify(defaultUser));
      return defaultUser;
    }
    return null;
  }
  
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
};

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const hasPermission = (permission: string): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  return user.permissions.includes(permission);
};

// Add auth header to requests
export const setupAxiosInterceptors = (): void => {
  axios.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers['X-User-ID'] = token;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  
  // Set base URL for axios
  axios.defaults.baseURL = API_URL;
};
