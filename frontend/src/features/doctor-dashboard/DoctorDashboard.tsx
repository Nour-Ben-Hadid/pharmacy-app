import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Card, 
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Divider,
  Stack,
  Avatar,
  Chip,
  Alert
} from '@mui/material';
import { 
  MedicalServices,
  Person as PatientIcon,
  Assignment as PrescriptionIcon,
  LocalHospital as LocalHospitalIcon,
  CalendarToday as CalendarTodayIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  ChevronRight as ChevronRightIcon,
  Notifications as NotificationsIcon,
  EventNote as EventNoteIcon
} from '@mui/icons-material';
import apiClient from '../../app/api/apiClient';
import { RootState } from '../../app/store/store';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

// Interfaces for typed data
interface Doctor {
  id: number;
  name: string;
  license_number: string;
  specialization: string;
  contact_info: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

interface Medication {
  id: number;
  prescription_id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface Prescription {
  id: number;
  patient_ssn: string;
  doctor_license: string;
  date_issued: string;
  status: string;
  medications: Medication[];
  patient_name: string;
  doctor_name: string;
}

const DoctorDashboard: React.FC = () => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Safe API call helper
  const safeApiGet = useCallback(async (url: string) => {
    try {
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching from ${url}:`, error);
      throw error;
    }
  }, []);
  
  useEffect(() => {
    const fetchDoctorDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch current doctor info
        const doctorData = await safeApiGet('/doctors/me');
        setDoctor(doctorData);
        
        // Fetch doctor prescriptions
        const prescriptionsData = await safeApiGet('/prescriptions/doctor');
        setPrescriptions(prescriptionsData);
        
      } catch (error) {
        console.error('Error fetching doctor dashboard data:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setDoctor(null);
        setPrescriptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorDashboardData();
  }, [safeApiGet]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!doctor) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Unable to load doctor information
      </Alert>
    );
  }

  const pendingPrescriptions = prescriptions.filter(p => p.status === 'pending');
  const recentPrescriptions = [...prescriptions].sort((a, b) => 
    new Date(b.date_issued).getTime() - new Date(a.date_issued).getTime()
  );

  // Calculating days since last prescription
  const lastPrescriptionDate = recentPrescriptions[0]?.date_issued;
  const daysSinceLastPrescription = lastPrescriptionDate ? 
    Math.floor((new Date().getTime() - new Date(lastPrescriptionDate).getTime()) / (1000 * 3600 * 24)) : 
    0;

  return (
    <Box className="dashboard-container" sx={{ p: 2 }}>
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: 'background.paper' }}>
        {/* Dashboard Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h4" className="dashboard-welcome" color="primary.dark" fontWeight="500">
              Hello, Dr. {doctor.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
              <CalendarTodayIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </Typography>
          </Box>
        </Stack>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Doctor Information and Stats */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight="600" color="primary">
              Doctor Information
            </Typography>
            <Divider sx={{ flex: 1, ml: 2 }} />
          </Box>
          <Grid container spacing={3}>
            {/* Doctor Information Card */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Name</Typography>
                      <Typography variant="body1">Dr. {doctor.name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">License Number</Typography>
                      <Typography variant="body1">{doctor.license_number}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Specialization</Typography>
                      <Typography variant="body1">{doctor.specialization}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary">Contact Info</Typography>
                      <Typography variant="body1">{doctor.contact_info}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Practice Statistics */}
            <Grid item xs={12} md={6}>
              <Grid container spacing={3}>
                {/* Pending Prescriptions */}
                <Grid item xs={6}>
                  <Paper
                    elevation={2}
                    className="stat-card"
                    sx={{ 
                      borderRadius: 2, 
                      overflow: 'hidden',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                  >
                    <Box sx={{ height: 4, bgcolor: '#ffa726', width: '100%' }} />
                    <CardContent sx={{ p: 2.5 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography className="stat-count" variant="h4" fontWeight="500">
                            {pendingPrescriptions.length}
                          </Typography>
                          <Typography className="stat-title" color="text.secondary">
                            Pending Prescriptions
                          </Typography>
                        </Box>
                        <Box 
                          sx={{ 
                            bgcolor: 'rgba(255, 167, 38, 0.15)',
                            borderRadius: 2,
                            width: 52,
                            height: 52,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Box sx={{ color: '#ffa726' }}>
                            <PrescriptionIcon fontSize="large" />
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Paper>
                </Grid>

                {/* Total Prescriptions */}
                <Grid item xs={6}>
                  <Paper
                    elevation={2}
                    className="stat-card"
                    sx={{ 
                      borderRadius: 2, 
                      overflow: 'hidden',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                  >
                    <Box sx={{ height: 4, bgcolor: '#4caf50', width: '100%' }} />
                    <CardContent sx={{ p: 2.5 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography className="stat-count" variant="h4" fontWeight="500">
                            {prescriptions.length}
                          </Typography>
                          <Typography className="stat-title" color="text.secondary">
                            Total Prescriptions
                          </Typography>
                        </Box>
                        <Box 
                          sx={{ 
                            bgcolor: 'rgba(76, 175, 80, 0.15)',
                            borderRadius: 2,
                            width: 52,
                            height: 52,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Box sx={{ color: '#4caf50' }}>
                            <MedicalServices fontSize="large" />
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Paper>
                </Grid>

                {/* Days Since Last Prescription */}
                <Grid item xs={6}>
                  <Paper
                    elevation={2}
                    className="stat-card"
                    sx={{ 
                      borderRadius: 2, 
                      overflow: 'hidden',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                  >
                    <Box sx={{ height: 4, bgcolor: '#2196f3', width: '100%' }} />
                    <CardContent sx={{ p: 2.5 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography className="stat-count" variant="h4" fontWeight="500">
                            {daysSinceLastPrescription}
                          </Typography>
                          <Typography className="stat-title" color="text.secondary">
                            Days Since Last Prescription
                          </Typography>
                        </Box>
                        <Box 
                          sx={{ 
                            bgcolor: 'rgba(33, 150, 243, 0.15)',
                            borderRadius: 2,
                            width: 52,
                            height: 52,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Box sx={{ color: '#2196f3' }}>
                            <CalendarTodayIcon fontSize="large" />
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>

        {/* Recent Prescriptions */}
        <Box>
          <Paper sx={{ borderRadius: 2, overflow: 'hidden', height: '100%', boxShadow: 2, mt: 4 }}>
            <Box className="table-header" sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: 'background.default' }}>
              <EventNoteIcon className="table-header-icon" fontSize="medium" sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="600">
                Your Recent Prescriptions
              </Typography>
              <Box flexGrow={1} />
            </Box>
            
            <Box sx={{ px: 2, pb: 2 }}>
              <Divider sx={{ mb: 2 }} />
              
              {recentPrescriptions.length > 0 ? (
                <TableContainer className="dashboard-table">
                  <Table size="medium">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Patient</TableCell>
                        <TableCell>Medications</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentPrescriptions.slice(0, 5).map((prescription) => (
                        <TableRow 
                          key={prescription.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/doctor-dashboard/prescriptions/${prescription.id}`)}
                        >
                          <TableCell>{format(new Date(prescription.date_issued), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{prescription.patient_name}</TableCell>
                          <TableCell>
                            {prescription.medications.slice(0, 2).map((med, index) => (
                              <Chip 
                                key={index}
                                label={med.medication_name}
                                size="small"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                            {prescription.medications.length > 2 && (
                              <Chip 
                                label={`+${prescription.medications.length - 2} more`}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Box 
                              sx={{
                                display: 'inline-block',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1,
                                fontSize: '0.75rem',
                                fontWeight: 'medium',
                                bgcolor: prescription.status === 'pending' ? 'rgba(255, 167, 38, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                                color: prescription.status === 'pending' ? '#ed6c02' : '#2e7d32',
                              }}
                            >
                              {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            
                          </TableCell>
                        </TableRow>
                      ))}
                      {recentPrescriptions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">No prescriptions found</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ 
                  py: 4, 
                  textAlign: 'center', 
                  bgcolor: 'rgba(0,0,0,0.02)', 
                  borderRadius: 2,
                  border: '1px dashed rgba(0,0,0,0.1)'
                }}>
                  <Typography color="text.secondary">No prescriptions found</Typography>
                </Box>
              )}
              
              <Box sx={{ mt: 2, textAlign: 'right' }}>
                <Button
                  variant="text"
                  color="primary"
                  endIcon={<ChevronRightIcon />}
                  onClick={() => navigate('/doctor-dashboard/prescriptions')}
                >
                  View All Prescriptions
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>

      </Paper>
    </Box>
  );
};

export default DoctorDashboard;