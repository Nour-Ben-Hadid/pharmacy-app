import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './app/store/store';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Authentication components
import Login from './features/auth/components/Login';
import Register from './features/auth/components/Register';
import ProtectedRoute from './features/auth/components/ProtectedRoute';

// Layout and Dashboard components
import DashboardLayout from './features/dashboard/DashboardLayout';
import DashboardHome from './features/dashboard/DashboardHome';

// Feature pages
import MedicationsPage from './features/medications/MedicationsPage';
import PatientsPage from './features/patients/PatientsPage';
import PrescriptionsPage from './features/prescriptions/PrescriptionsPage';
import DoctorPrescriptionsPage from './features/doctor-dashboard/DoctorPrescriptionsPage';

// Doctor Dashboard Pages
import DoctorDashboard from './features/doctor-dashboard/DoctorDashboard';
import DoctorPatientsPage from './features/doctor-dashboard/DoctorPatientsPage';
import PatientPage from './features/doctor-dashboard/PatientPage';

// User-specific dashboards
import PatientDashboard from './features/patient-dashboard/PatientDashboard';
import PatientPrescriptionsPage from './features/patient-dashboard/PatientPrescriptionsPage';
import PatientMedicationsPage from './features/patient-dashboard/PatientMedicationsPage';

// User Type
import { UserType } from './app/api/authService';

// Create a green-themed pharmacy app
const theme = createTheme({
  palette: {
    primary: {
      // Using pharmacy green as primary color
      main: '#1b5e20', // Dark green
      light: '#4c8c4a',
      dark: '#003300',
    },
    secondary: {
      // Complementary color for accents
      main: '#4caf50', // Light green
      light: '#80e27e',
      dark: '#087f23',
    },
    background: {
      default: '#f5f8f5', // Light green-tinted background
    },
    success: {
      main: '#2e7d32', // Green for success states
    },
    error: {
      main: '#c62828', // Keep red for errors
    },
    warning: {
      main: '#f9a825', // Warm yellow for warnings
    },
    info: {
      main: '#0277bd', // Keep blue for info
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1b5e20', // Dark green app bar
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          backgroundColor: '#2e7d32', // Green buttons
          '&:hover': {
            backgroundColor: '#1b5e20',
          },
        },
      },
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Routes>
              {/* Authentication Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Pharmacist Routes */}
              <Route path="/" element={
                <ProtectedRoute userTypes={[UserType.PHARMACIST]}>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route path="dashboard" element={<DashboardHome />} />
                <Route path="medications" element={<MedicationsPage />} />
                <Route path="patients" element={<PatientsPage />} />
                <Route path="prescriptions" element={<PrescriptionsPage />} />
                <Route path="profile" element={<div>Pharmacist Profile</div>} />
                {/* Default route for pharmacist - redirect to dashboard when at root path */}
                <Route index element={<Navigate to="/dashboard" replace />} />
              </Route>
              
              {/* Doctor Routes */}
              <Route path="/doctor-dashboard" element={
                <ProtectedRoute userTypes={[UserType.DOCTOR]}>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route path="" element={<DoctorDashboard />} />
                <Route path="patients" element={<DoctorPatientsPage />} />
                <Route path="patients/:id" element={<PatientPage />} />
                <Route path="prescriptions" element={<DoctorPrescriptionsPage />} />
                <Route path="prescriptions/new" element={<div>Create New Prescription</div>} />
                <Route path="medications" element={<PatientMedicationsPage />} />
                <Route path="treatments" element={<div>Doctor's Treatments</div>} />
                <Route path="profile" element={<div>Doctor Profile</div>} />
              </Route>
              
              {/* Patient Routes */}
              <Route path="/patient-dashboard" element={
                <ProtectedRoute userTypes={[UserType.PATIENT]}>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route path="" element={<PatientDashboard />} />
                <Route path="prescriptions" element={<PatientPrescriptionsPage />} />
                <Route path="medications" element={<PatientMedicationsPage />} />
                <Route path="profile" element={<div>Patient Profile</div>} />
              </Route>
              
              {/* Redirect unauthenticated users to login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
