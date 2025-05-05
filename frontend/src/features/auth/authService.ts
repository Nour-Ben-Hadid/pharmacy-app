import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Enum for user types
export enum UserType {
  DOCTOR = 'DOCTOR',
  PHARMACIST = 'PHARMACIST',
  PATIENT = 'PATIENT'
}

// Interface for user information
export interface UserInfo {
  id: number;
  email: string;
  name?: string;
  userType: UserType;
  [key: string]: any;
}

// Interface for login data
export interface LoginCredentials {
  username: string;
  password: string;
  userType: UserType;
}

// Interface for registration data
export interface RegisterData {
  email: string;
  password: string;
  name: string;
  userType: UserType;
  [key: string]: any;
}

// Auth service object
const authService = {
  // Login user
  async login(credentials: LoginCredentials) {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await axios.post(`${API_URL}/auth/token`, formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.data.access_token) {
      // Store token
      localStorage.setItem('token', response.data.access_token);
      
      // Store userType explicitly
      localStorage.setItem('userType', credentials.userType);
      
      // Get user info
      const userResponse = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${response.data.access_token}`
        }
      });
      
      // Store user info and associate userType with the user data
      const userData = {
        ...userResponse.data,
        userType: credentials.userType
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      
      return {
        ...userData,
        access_token: response.data.access_token
      };
    }
    
    return response.data;
  },

  // Register a user
  async register(data: RegisterData) {
    let endpoint = '';
    
    switch (data.userType) {
      case UserType.PATIENT:
        endpoint = '/patients/';
        break;
      case UserType.DOCTOR:
        endpoint = '/doctors/';
        break;
      case UserType.PHARMACIST:
      default:
        endpoint = '/pharmacists/';
        break;
    }
    
    const response = await axios.post(`${API_URL}${endpoint}`, data);
    return response.data;
  },

  // Logout user
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
  },

  // Get current user from local storage
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Get token from local storage
  getToken() {
    return localStorage.getItem('token') || null;
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  },
  
  // Get user role
  getUserRole() {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  },
  
  // Get user type
  getUserType(): UserType | null {
    const savedUserType = localStorage.getItem('userType');
    if (savedUserType && Object.values(UserType).includes(savedUserType as UserType)) {
      return savedUserType as UserType;
    }
    
    const user = this.getCurrentUser();
    return user?.userType || null;
  }
};

export default authService;