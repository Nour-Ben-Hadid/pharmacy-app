import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  Alert,
  useTheme
} from '@mui/material';
import { LocalPharmacy as PharmacyIcon } from '@mui/icons-material';
import { AppDispatch, RootState } from '../../../app/store/store';
import { login, clearError } from '../slices/authSlice';
import { UserType } from '../../../app/api/authService';

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [userType, setUserType] = useState<UserType>(UserType.PHARMACIST);
  const [redirecting, setRedirecting] = useState<boolean>(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const { isAuthenticated, isLoading, error, userType: loggedInUserType } = useSelector((state: RootState) => state.auth);

  // Handle redirection after successful authentication
  useEffect(() => {
    if (isAuthenticated && !redirecting) {
      setRedirecting(true);
      
      console.log('Authentication successful, redirecting user type:', loggedInUserType);
      
      // Short delay to ensure state is updated and to show success feedback
      setTimeout(() => {
        if (loggedInUserType === UserType.DOCTOR) {
          navigate('/doctor-dashboard');
        } else if (loggedInUserType === UserType.PATIENT) {
          navigate('/patient-dashboard');
        } else {
          navigate('/dashboard'); // Default to pharmacist dashboard
        }
      }, 1000);
    }
  }, [isAuthenticated, navigate, loggedInUserType, redirecting]);

  // Clear any errors when component mounts or unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`Attempting login as ${userType} with email: ${email}`);
    await dispatch(login({ username: email, password, userType }));
  };

  return (
    <Container 
      maxWidth={false} // Changed from "xs" to false to override global constraints
      disableGutters // Remove default padding
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        maxWidth: 'none',
        padding: 0,
        margin: 0,
        position: 'absolute',
        left: 0,
        top: 0
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '400px'
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            width: '100%', 
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: '0px 5px 20px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', mb: 3 }}>
            <PharmacyIcon 
              sx={{ 
                fontSize: 48, 
                color: 'primary.main',
                mb: 1
              }} 
            />
            <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
            DigiCare Pharmacy
            </Typography>
            <Typography variant="body2" color="text.secondary">
            Welcome to the future of pharmacy care
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {isAuthenticated && redirecting && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Login successful! Redirecting to your dashboard...
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
              <FormLabel component="legend">Login as:</FormLabel>
              <RadioGroup
                row
                value={userType}
                onChange={(e) => setUserType(e.target.value as UserType)}
              >
                <FormControlLabel 
                  value={UserType.PHARMACIST} 
                  control={<Radio color="primary" />} 
                  label="Pharmacist" 
                />
                <FormControlLabel 
                  value={UserType.DOCTOR} 
                  control={<Radio color="primary" />} 
                  label="Doctor" 
                />
                <FormControlLabel 
                  value={UserType.PATIENT} 
                  control={<Radio color="primary" />} 
                  label="Patient" 
                />
              </RadioGroup>
            </FormControl>
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              sx={{ mb: 2 }}
              disabled={isAuthenticated}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
              disabled={isAuthenticated}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                py: 1.5,
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
              disabled={isLoading || isAuthenticated}
            >
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : isAuthenticated ? (
                'Logged In'
              ) : (
                'Login'
              )}
            </Button>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link to="/register" style={{ color: theme.palette.primary.main }}>
                  Register here
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;