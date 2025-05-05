import apiClient from './apiClient';
import axios from 'axios';

export enum UserType {
  PHARMACIST = 'pharmacist',
  DOCTOR = 'doctor',
  PATIENT = 'patient',
}

export interface LoginCredentials {
  username: string;
  password: string;
  userType: UserType;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  userType: UserType;
  license_number?: string;
  specialization?: string; 
  ssn?: string;
  contact_info?: string;
  allergies?: string;
  date_of_birth?: string;
}

export interface UserInfo {
  id: number;
  name: string;
  email: string;
  userType?: UserType;
  license_number?: string;
  specialization?: string;
  allergies?: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<any> {
    let endpoint = '/auth/token';
    
    // Select endpoint based on user type
    if (credentials.userType === UserType.DOCTOR) {
      endpoint = '/auth/doctor-token';
      console.log('Using doctor login endpoint:', endpoint);
    } else if (credentials.userType === UserType.PATIENT) {
      endpoint = '/auth/patient-token';
      console.log('Using patient login endpoint:', endpoint);
    } else {
      console.log('Using pharmacist login endpoint:', endpoint);
    }
    
    // Create form data to send credentials in the format expected by OAuth2PasswordRequestForm
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    try {
      console.log(`Attempting to log in as ${credentials.userType} with username: ${credentials.username}`);
      
      // Override default headers for this specific request to send form data
      const response = await axios.post(`${apiClient.defaults.baseURL}${endpoint}`, formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      console.log(`Login response for ${credentials.userType}:`, response.status, response.statusText);
      
      if (response.data.access_token) {
        console.log(`Login successful as ${credentials.userType}, storing token`);
        
        // Clear any existing tokens first to avoid conflicts
        this.logout();
        
        // Store the auth info consistently
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('userType', credentials.userType);
        
        // Add some debugging
        console.log('Token stored, length:', response.data.access_token.length);
        console.log('UserType stored:', credentials.userType);
        
        // Specific handling for patient login to ensure it works
        if (credentials.userType === UserType.PATIENT) {
          console.log('Extra validation for patient login');
          // Double-check the token was stored properly
          const storedToken = localStorage.getItem('token');
          const storedUserType = localStorage.getItem('userType');
          
          if (!storedToken || !storedUserType) {
            console.error('Failed to store patient authentication data');
            throw new Error('Failed to store authentication data');
          }
        }
      } else {
        console.error('No access token in response:', response.data);
        throw new Error('No access token received');
      }
      
      return response.data;
    } catch (error: any) {
      console.error(`Login error for ${credentials.userType}:`, error.response?.data || error.message);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      throw error;
    }
  }
  
  async register(data: RegisterData): Promise<any> {
    let endpoint = '/pharmacists/';
    
    // Select endpoint based on user type
    if (data.userType === UserType.DOCTOR) {
      endpoint = '/doctors/';
    } else if (data.userType === UserType.PATIENT) {
      endpoint = '/patients/';
    }
    
    // Remove userType from data before sending to backend
    const { userType, ...registerData } = data;
    
    const response = await apiClient.post(endpoint, registerData);
    return response.data;
  }
  
  async getCurrentUser(): Promise<UserInfo> {
    const userType = this.getUserType();
    let endpoint = '/pharmacists/me';
    
    if (userType === UserType.DOCTOR) {
      endpoint = '/doctors/me';
    } else if (userType === UserType.PATIENT) {
      endpoint = '/patients/me';
    }
    
    const response = await apiClient.get(endpoint);
    const userData = response.data;
    
    return {
      ...userData,
      userType,
    };
  }
  
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
  }
  
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
  
  getUserType(): UserType | null {
    const userType = localStorage.getItem('userType') as UserType;
    return userType || null;
  }
}

export default new AuthService();