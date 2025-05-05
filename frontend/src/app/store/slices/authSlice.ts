import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import authService from '../../../features/auth/authService';

// Types for user data
interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  [key: string]: any; // Additional fields depending on user type
}

// State type
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: AuthState = {
  user: authService.getCurrentUser(),
  token: authService.getToken(),
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false,
  error: null
};

// Async thunk for login
export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const userData = await authService.login({ username, password });
      return userData;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

// Async thunk for registering a patient
export const registerPatient = createAsyncThunk(
  'auth/registerPatient',
  async (patientData: any, { rejectWithValue }) => {
    try {
      const response = await authService.registerPatient(patientData);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

// Async thunk for registering a pharmacist
export const registerPharmacist = createAsyncThunk(
  'auth/registerPharmacist',
  async (pharmacistData: any, { rejectWithValue }) => {
    try {
      const response = await authService.registerPharmacist(pharmacistData);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

// Async thunk for registering a doctor
export const registerDoctor = createAsyncThunk(
  'auth/registerDoctor',
  async (doctorData: any, { rejectWithValue }) => {
    try {
      const response = await authService.registerDoctor(doctorData);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

// Logout action
export const logout = createAsyncThunk('auth/logout', async () => {
  authService.logout();
});

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Clear any error messages
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.token = authService.getToken();
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload as string;
      })
      
      // Register patient cases
      .addCase(registerPatient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerPatient.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerPatient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Register pharmacist cases
      .addCase(registerPharmacist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerPharmacist.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerPharmacist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Register doctor cases
      .addCase(registerDoctor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerDoctor.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerDoctor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Logout case
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

// Export actions and reducer
export const { clearError } = authSlice.actions;
export default authSlice.reducer;