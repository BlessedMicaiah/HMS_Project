import axios from 'axios';
import { User } from '../types/patient';

// User data for mock authentication
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
  // For Windsurf demo, use mock authentication for easier testing
  console.log('Using mock authentication for Windsurf demo');
  
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
  
  // The following code is commented out as we're using mock authentication for the Windsurf demo
  /*
  // For real backend integration, uncomment this section and define the API URLs:
  // const API_URL = process.env.REACT_APP_API_URL || 'https://hms-patient-service-i6ww.onrender.com/api';
  // const API_GATEWAY_URL = process.env.REACT_APP_API_GATEWAY_URL || 'https://hms-api-gateway.onrender.com/api';
  
  try {
    console.log('Attempting to login directly to Patient Service');
    const response = await axios.post(`${API_URL}/auth/login`, { username, password });
    
    // Store token in localStorage
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  } catch (directError) {
    console.error('Direct login failed:', directError);
    
    // If direct connection fails, try via API Gateway
    try {
      console.log('Attempting to login via API Gateway');
      const gatewayResponse = await axios.post(`${API_GATEWAY_URL}/auth/login`, { username, password });
      
      // Store token in localStorage
      localStorage.setItem('token', gatewayResponse.data.token);
      localStorage.setItem('user', JSON.stringify(gatewayResponse.data.user));
      
      return gatewayResponse.data;
    } catch (gatewayError) {
      console.error('API Gateway login failed:', gatewayError);
      throw new Error('Authentication failed. Please check your credentials and try again.');
    }
  }
  */
};

export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    // Auto-login as doctor if no user exists for demo purposes
    const defaultUser = MOCK_USERS.doctor;
    localStorage.setItem('token', defaultUser.id);
    localStorage.setItem('user', JSON.stringify(defaultUser));
    return defaultUser;
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
};
