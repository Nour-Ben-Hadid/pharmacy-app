import axios from 'axios';
import { UserType } from './authService';

// Creating an axios instance with a base URL and default settings
const apiClient = axios.create({
  baseURL: 'http://localhost:8000', // Default FastAPI port
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Request interceptor to add auth token based on user type
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    if (token) {
      // Add the authorization header with the token for all requests
      config.headers.Authorization = `Bearer ${token}`;
      
      // IMPORTANT: FastAPI expects Authorization header in a specific format
      // Ensure there's exactly one space after "Bearer"
      if (config.headers.Authorization && typeof config.headers.Authorization === 'string') {
        const authHeader = config.headers.Authorization;
        if (authHeader.startsWith('Bearer') && !authHeader.startsWith('Bearer ')) {
          config.headers.Authorization = `Bearer ${authHeader.substring(6)}`;
        }
      }
      
      // Add detailed logging for doctor-specific endpoints
      if (config.url?.includes('/prescriptions/doctor') || config.url?.includes('/patients/doctor')) {
        console.log('Doctor-specific endpoint detected:', config.url);
        console.log('Auth headers being sent:', {
          'Authorization': `Bearer ${token.substring(0, 15)}...`, // Just show the beginning for security
          'userType': userType
        });
      }
    } 
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling and debugging
apiClient.interceptors.response.use(
  (response) => {
    // For doctor-specific endpoints, log successful responses
    if (response.config.url?.includes('/prescriptions/doctor') || response.config.url?.includes('/patients/doctor')) {
      console.log('Successful response from doctor endpoint:', {
        status: response.status,
        dataLength: response.data?.length || 0
      });
    }
    return response;
  },
  (error) => {
    // Enhanced error logging for doctor-specific endpoints
    if (error.config?.url?.includes('/prescriptions/doctor') || error.config?.url?.includes('/patients/doctor')) {
      console.error('Error from doctor endpoint:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      
      // For 401 errors on doctor endpoints, suggest re-login
      if (error.response?.status === 401) {
        console.error('Authentication failed for doctor endpoint. Try logging out and back in as a doctor.');
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;