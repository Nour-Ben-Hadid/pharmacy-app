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
  Grid,
  Divider,
  useTheme,
  InputLabel,
  MenuItem,
  Select
} from '@mui/material';
import { LocalPharmacy as PharmacyIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AppDispatch, RootState } from '../../../app/store/store';
import { register, clearError, login } from '../slices/authSlice';
import { UserType } from '../../../app/api/authService';
import dayjs from 'dayjs';

const Register: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [userType, setUserType] = useState<UserType>(UserType.PHARMACIST);
  
  // User-type specific fields
  const [licenseNumber, setLicenseNumber] = useState<string>('');
  const [specialization, setSpecialization] = useState<string>('');
  const [ssn, setSsn] = useState<string>('');
  const [contactInfo, setContactInfo] = useState<string>('');
  const [allergies, setAllergies] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  
  // Validation
  const [passwordError, setPasswordError] = useState<string>('');
  const [registrationSuccess, setRegistrationSuccess] = useState<boolean>(false);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const theme = useTheme();

  const { isLoading, error, isAuthenticated, userType: loggedInUserType } = useSelector((state: RootState) => state.auth);

  // Clear any errors when component mounts or unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (loggedInUserType === UserType.DOCTOR) {
        navigate('/doctor-dashboard');
      } else if (loggedInUserType === UserType.PATIENT) {
        navigate('/patient-dashboard');
      } else {
        navigate('/dashboard'); // Pharmacist dashboard
      }
    }
  }, [isAuthenticated, navigate, loggedInUserType]);

  const validateForm = (): boolean => {
    // Check if passwords match
    if (password !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return false;
    }
    
    // Check password strength
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const registerData = {
      name,
      email,
      password,
      userType,
      license_number: userType !== UserType.PATIENT ? licenseNumber : undefined,
      specialization: userType === UserType.DOCTOR ? specialization : undefined,
      ssn: userType === UserType.PATIENT ? ssn : undefined,
      contact_info: userType === UserType.PATIENT ? contactInfo : undefined,
      allergies: userType === UserType.PATIENT ? allergies : undefined,
      date_of_birth: userType === UserType.PATIENT && dateOfBirth 
        ? dayjs(dateOfBirth).format('YYYY-MM-DD') 
        : undefined,
    };
    
    const result = await dispatch(register(registerData));
    
    if (register.fulfilled.match(result)) {
      setRegistrationSuccess(true);
      
      // Auto-login after successful registration
      await dispatch(login({ 
        username: email, 
        password, 
        userType 
      }));
      
      // The redirect will happen in the useEffect hook that watches isAuthenticated
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            py: 4,
          }}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              width: '100%', 
              borderRadius: 2,
              bgcolor: 'background.paper'
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
                Create an Account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Join Green Pharmacy Management System
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {registrationSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Registration successful! Redirecting to login...
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                <FormLabel component="legend">Register as:</FormLabel>
                <RadioGroup
                  row
                  value={userType}
                  onChange={(e) => {
                    setUserType(e.target.value as UserType);
                    // Reset user type specific fields when changing user type
                    setLicenseNumber('');
                    setSpecialization('');
                    setSsn('');
                    setContactInfo('');
                    setAllergies('');
                    setDateOfBirth(null);
                  }}
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
              
              <Grid container spacing={2}>
                {/* Common fields for all user types */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                    Basic Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    required
                    fullWidth
                    id="name"
                    label="Full Name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={!!passwordError}
                    helperText={passwordError ? passwordError : 'Minimum 8 characters'}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={!!passwordError}
                  />
                </Grid>
                
                {/* User type specific fields */}
                {(userType === UserType.PHARMACIST || userType === UserType.DOCTOR) && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mt: 2, mb: 1 }}>
                        Professional Information
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        required
                        fullWidth
                        id="licenseNumber"
                        label="License Number"
                        name="licenseNumber"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                      />
                    </Grid>
                    
                    {userType === UserType.DOCTOR && (
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel id="specialization-label">Specialization</InputLabel>
                          <Select
                            labelId="specialization-label"
                            id="specialization"
                            value={specialization}
                            label="Specialization"
                            onChange={(e) => setSpecialization(e.target.value)}
                            required
                          >
                            <MenuItem value="Cardiology">Cardiology</MenuItem>
                            <MenuItem value="Dermatology">Dermatology</MenuItem>
                            <MenuItem value="Endocrinology">Endocrinology</MenuItem>
                            <MenuItem value="Gastroenterology">Gastroenterology</MenuItem>
                            <MenuItem value="Neurology">Neurology</MenuItem>
                            <MenuItem value="Oncology">Oncology</MenuItem>
                            <MenuItem value="Pediatrics">Pediatrics</MenuItem>
                            <MenuItem value="Psychiatry">Psychiatry</MenuItem>
                            <MenuItem value="General Practice">General Practice</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                  </>
                )}
                
                {userType === UserType.PATIENT && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mt: 2, mb: 1 }}>
                        Patient Information
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        required
                        fullWidth
                        id="ssn"
                        label="Social Security Number"
                        name="ssn"
                        value={ssn}
                        onChange={(e) => setSsn(e.target.value)}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <DatePicker
                        label="Date of Birth"
                        value={dateOfBirth}
                        onChange={(newValue) => setDateOfBirth(newValue)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        required
                        fullWidth
                        id="contactInfo"
                        label="Contact Information"
                        name="contactInfo"
                        placeholder="Phone number, address, etc."
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        id="allergies"
                        label="Allergies"
                        name="allergies"
                        placeholder="Please list any known allergies or write 'None'"
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        multiline
                        rows={2}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
              
              <Box sx={{ mt: 4 }}>
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
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  ) : (
                    'Register'
                  )}
                </Button>
                
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2">
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: theme.palette.primary.main }}>
                      Login here
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </form>
          </Paper>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default Register;