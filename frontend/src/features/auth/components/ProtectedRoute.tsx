import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { RootState, AppDispatch } from '../../../app/store/store';
import { fetchCurrentUser } from '../slices/authSlice';
import { CircularProgress, Box } from '@mui/material';
import { UserType } from '../../../app/api/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  userTypes?: UserType[]; // Optional array of allowed user types
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, userTypes }) => {
  const { isAuthenticated, isLoading, user, userType } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  useEffect(() => {
    // If we're authenticated but don't have user data, fetch it
    if (isAuthenticated && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [isAuthenticated, user, dispatch]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // If not authenticated at all, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific user types are required and the current user doesn't match
  if (userTypes && userTypes.length > 0 && userType && !userTypes.includes(userType)) {
    // Only redirect if we're not already at the correct dashboard
    if (userType === UserType.DOCTOR && !location.pathname.startsWith("/doctor-dashboard")) {
      return <Navigate to="/doctor-dashboard" replace />;
    } else if (userType === UserType.PATIENT && !location.pathname.startsWith("/patient-dashboard")) {
      return <Navigate to="/patient-dashboard" replace />;
    } else if (userType === UserType.PHARMACIST && 
              !location.pathname.startsWith("/dashboard") && 
              location.pathname !== "/" && 
              !location.pathname.startsWith("/medications") && 
              !location.pathname.startsWith("/patients") && 
              !location.pathname.startsWith("/prescriptions")) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // If authenticated and the user type is allowed (or no specific user type required)
  return <>{children}</>;
};

export default ProtectedRoute;