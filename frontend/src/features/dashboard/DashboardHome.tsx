import React, { useEffect, useState, useCallback } from 'react';
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
  Alert,
  Stack,
  Divider,
  Tooltip,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar
} from '@mui/material';
import { 
  Medication as MedicationIcon, 
  Person as PatientIcon,
  Assignment as PrescriptionIcon,
  MedicalServices as DoctorIcon,
  EventNote as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Notifications as NotificationsIcon,
  ChevronRight as ChevronRightIcon,
  Warning as WarningIcon,
  Dashboard as DashboardIcon,
  CalendarToday as CalendarTodayIcon,
  Add as AddIcon
} from '@mui/icons-material';
import apiClient from '../../app/api/apiClient';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store/store';

interface StatCard {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

interface LowStockMedication {
  id: number;
  name: string;
  stock_quantity: number;
  threshold?: number;
}

interface RecentPrescription {
  id: number;
  patient_name: string;
  doctor_name: string;
  date_issued: string;
  status: string;
}

const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState<StatCard[]>([
    {
      title: 'Medications',
      count: 0,
      icon: <MedicationIcon fontSize="large" />,
      color: '#1976d2'
    },
    {
      title: 'Patients',
      count: 0,
      icon: <PatientIcon fontSize="large" />,
      color: '#2e7d32'
    },
    {
      title: 'Prescriptions',
      count: 0,
      icon: <PrescriptionIcon fontSize="large" />,
      color: '#ed6c02'
    },
    {
      title: 'Doctors',
      count: 0,
      icon: <DoctorIcon fontSize="large" />,
      color: '#9c27b0'
    }
  ]);
  const [lowStockMeds, setLowStockMeds] = useState<LowStockMedication[]>([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState<RecentPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiCalled, setApiCalled] = useState(false);
  // Add new states for restock functionality
  const [restockDialogOpen, setRestockDialogOpen] = useState(false);
  const [restockQuantity, setRestockQuantity] = useState(0);
  const [medicationToRestock, setMedicationToRestock] = useState<LowStockMedication | null>(null);
  const [restockLoading, setRestockLoading] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  const navigate = useNavigate();
  const currentDate = new Date();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const safeApiGet = useCallback(async (url: string) => {
    try {
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching from ${url}:`, error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (apiCalled) return;
    setApiCalled(true);

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all the data we need for the dashboard
        const results = await Promise.allSettled([
          safeApiGet('/medications'),
          safeApiGet('/patients'),
          safeApiGet('/doctors'),
          safeApiGet('/prescriptions/all') // Use the correct endpoint to get all prescriptions
        ]);
        
        const medicationsData = results[0].status === 'fulfilled' ? results[0].value : null;
        const patientsData = results[1].status === 'fulfilled' ? results[1].value : null;
        const doctorsData = results[2].status === 'fulfilled' ? results[2].value : null;
        const prescriptionsData = results[3].status === 'fulfilled' ? results[3].value : null;

        // Check if we got any data at all
        if (!medicationsData && !patientsData && !doctorsData && !prescriptionsData) {
          setError('Unable to load dashboard data. Please check your connection and try again.');
          setLoading(false);
          return;
        }
        
        // Update stats counts with real data
        setStats(prevStats => [
          { ...prevStats[0], count: medicationsData?.length || 0 },
          { ...prevStats[1], count: patientsData?.length || 0 },
          { ...prevStats[2], count: prescriptionsData?.length || 0 },
          { ...prevStats[3], count: doctorsData?.length || 0 }
        ]);

        // Process low stock medications if we have medication data
        if (medicationsData && medicationsData.length > 0) {
          const STOCK_THRESHOLD = 10;
          const lowStock = medicationsData
            .filter((med: any) => med.stock_quantity <= STOCK_THRESHOLD)
            .map((med: any) => ({
              id: med.id,
              name: med.name,
              stock_quantity: med.stock_quantity,
              threshold: med.threshold || STOCK_THRESHOLD
            }))
            .slice(0, 5);
          
          setLowStockMeds(lowStock);
        }

        // Get recent prescriptions with detailed information
        try {
          const recentPrescriptionsData = await safeApiGet('/prescriptions/all?limit=5');
          
          if (recentPrescriptionsData && recentPrescriptionsData.length > 0) {
            const formattedPrescriptions = recentPrescriptionsData.map((prescription: any) => ({
              id: prescription.id,
              patient_name: prescription.patient_name || 'Unknown Patient',
              doctor_name: prescription.doctor_name || 'Unknown Doctor',
              date_issued: prescription.date_issued || 'Unknown Date',
              status: prescription.status || 'pending'
            }));
            setRecentPrescriptions(formattedPrescriptions);
          } else {
            // Clear prescriptions if the API returned empty
            setRecentPrescriptions([]);
          }
        } catch (err) {
          console.error('Error fetching recent prescriptions:', err);
          setError(prev => prev || 'Failed to fetch recent prescriptions data.');
          // Don't set mock data - leave prescriptions empty if fetch fails
          setRecentPrescriptions([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard statistics:', error);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
        
        // Clear all data on error - no mock data
        setLowStockMeds([]);
        setRecentPrescriptions([]);
      }
    };

    fetchStats();
  }, [safeApiGet, apiCalled]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  // Add new function to handle opening the restock dialog
  const handleOpenRestockDialog = (e: React.MouseEvent, medication: LowStockMedication) => {
    e.stopPropagation(); // Prevent navigation to medication page
    setMedicationToRestock(medication);
    setRestockQuantity(10); // Default quantity to add
    setRestockDialogOpen(true);
  };

  // Add function to handle closing the restock dialog
  const handleCloseRestockDialog = () => {
    setRestockDialogOpen(false);
    setMedicationToRestock(null);
    setRestockQuantity(0);
  };

  // Add function to handle restock submission
  const handleRestockSubmit = async () => {
    if (!medicationToRestock || restockQuantity <= 0) return;

    setRestockLoading(true);
    try {
      // Get the current medication details first
      const response = await apiClient.get(`/medications/${medicationToRestock.id}`);
      const currentMedication = response.data;
      
      // Calculate the new stock quantity
      const newQuantity = currentMedication.stock_quantity + restockQuantity;
      
      // Update the medication with the new stock quantity
      const updateResponse = await apiClient.patch(`/medications/${medicationToRestock.id}`, {
        stock_quantity: newQuantity
      });
      
      // Update the medication in our local state
      const updatedMeds = lowStockMeds.map(med => {
        if (med.id === medicationToRestock.id) {
          return { ...med, stock_quantity: newQuantity };
        }
        return med;
      });
      
      // Filter out medications that are no longer low stock
      const stillLowStock = updatedMeds.filter(med => 
        med.stock_quantity <= (med.threshold || 10)
      );
      
      setLowStockMeds(stillLowStock);
      
      // Show success notification
      setNotification({
        open: true,
        message: `Successfully restocked ${medicationToRestock.name}`,
        severity: 'success'
      });
      
      // Close the dialog
      handleCloseRestockDialog();
      
      // Refresh dashboard data if needed
      if (stillLowStock.length === 0) {
        setApiCalled(false); // This will trigger a data refresh in useEffect
      }
      
    } catch (error) {
      console.error('Error restocking medication:', error);
      setNotification({
        open: true,
        message: 'Failed to restock medication. Please try again.',
        severity: 'error'
      });
    } finally {
      setRestockLoading(false);
    }
  };

  // Add function to handle notification close
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Box className="dashboard-container" sx={{ p: 2 }}>
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: 'background.paper' }}>
        {/* Dashboard Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h4" className="dashboard-welcome" color="primary.dark" fontWeight="500">
              Hello, {user?.name || 'Pharmacist'}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
              <CalendarTodayIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
              {format(currentDate, 'EEEE, MMMM d, yyyy')}
            </Typography>
          </Box>
        </Stack>
        
        <Divider sx={{ mb: 3 }} />
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => {
                  setApiCalled(false);
                  setError(null);
                  window.location.reload();
                }}
              >
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight="600" color="primary">
              Pharmacy Overview
            </Typography>
            <Divider sx={{ flex: 1, ml: 2 }} />
          </Box>
          
          <Grid container spacing={3}>
            {stats.map((stat) => (
              <Grid item xs={12} sm={6} md={3} key={stat.title}>
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
                  <Box sx={{ height: 4, bgcolor: stat.color, width: '100%' }} />
                  <CardContent sx={{ p: 2.5 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography className="stat-count" variant="h4" fontWeight="500">
                          {loading ? (
                            <CircularProgress size={20} thickness={4} color="inherit" />
                          ) : (
                            stat.count
                          )}
                        </Typography>
                        <Typography className="stat-title" color="text.secondary">
                          {stat.title}
                        </Typography>
                      </Box>
                      <Box 
                        sx={{ 
                          bgcolor: `${stat.color}15`,
                          borderRadius: 2,
                          width: 52,
                          height: 52,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Box sx={{ color: stat.color }}>
                          {stat.icon}
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4, pb: 6, flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress size={50} thickness={4} />
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              Loading dashboard data...
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ borderRadius: 2, overflow: 'hidden', height: '100%', boxShadow: 2 }}>
                <Box className="table-header" sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: 'background.default' }}>
                  <PrescriptionIcon className="table-header-icon" fontSize="medium" sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight="600">
                    Recent Prescriptions
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
                            <TableCell>Patient</TableCell>
                            <TableCell>Doctor</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {recentPrescriptions.map((prescription) => (
                            <TableRow 
                              key={prescription.id} 
                              hover 
                              sx={{ cursor: 'pointer' }}
                              onClick={() => navigate(`/prescriptions/${prescription.id}`)} 
                            >
                              <TableCell>
                                <Typography variant="body2" fontWeight="500">
                                  {prescription.patient_name}
                                </Typography>
                              </TableCell>
                              <TableCell>{prescription.doctor_name}</TableCell>
                              <TableCell>{formatDate(prescription.date_issued)}</TableCell>
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
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/prescriptions', { 
                                      state: { viewPrescriptionId: prescription.id } 
                                    });
                                  }}
                                  sx={{ 
                                    fontWeight: 500,
                                    boxShadow: 1,
                                    '&:hover': { 
                                      boxShadow: 2,
                                      bgcolor: 'primary.dark' 
                                    }
                                  }}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
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
                      <Typography color="text.secondary">No recent prescriptions found</Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ mt: 2, textAlign: 'right' }}>
                    <Button
                      className="action-btn"
                      variant="text"
                      color="primary"
                      endIcon={<ChevronRightIcon />}
                      onClick={() => navigate('/prescriptions')}
                    >
                      View All Prescriptions
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ borderRadius: 2, overflow: 'hidden', height: '100%', boxShadow: 2 }}>
                <Box className="table-header" sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: 'background.default' }}>
                  <WarningIcon className="table-header-icon" fontSize="medium" sx={{ mr: 1, color: '#ed6c02' }} />
                  <Typography variant="h6" fontWeight="600">
                    Low Stock Medications
                  </Typography>
                  <Box flexGrow={1} />
                </Box>
                
                <Box sx={{ px: 2, pb: 2 }}>
                  <Divider sx={{ mb: 2 }} />
                  
                  {lowStockMeds.length > 0 ? (
                    <TableContainer className="dashboard-table">
                      <Table size="medium">
                        <TableHead>
                          <TableRow>
                            <TableCell>Medication</TableCell>
                            <TableCell align="center">Quantity</TableCell>
                            <TableCell align="center">Threshold</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {lowStockMeds.map((med) => (
                            <TableRow 
                              key={med.id} 
                              hover
                              sx={{ cursor: 'pointer' }}
                              onClick={() => navigate(`/medications/${med.id}`)} 
                            >
                              <TableCell>
                                <Typography variant="body2" fontWeight="500">
                                  {med.name}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Typography 
                                  fontWeight={med.stock_quantity <= (med.threshold || 10) * 0.5 ? "700" : "400"}
                                  color={med.stock_quantity <= (med.threshold || 10) * 0.5 ? "error" : "inherit"}
                                >
                                  {med.stock_quantity}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">{med.threshold}</TableCell>
                              <TableCell>
                                <Box 
                                  sx={{
                                    display: 'inline-block',
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 1,
                                    fontSize: '0.75rem',
                                    fontWeight: 'medium',
                                    bgcolor: med.stock_quantity <= (med.threshold || 10) * 0.5 ? 'rgba(211, 47, 47, 0.1)' : 'rgba(255, 167, 38, 0.1)',
                                    color: med.stock_quantity <= (med.threshold || 10) * 0.5 ? '#d32f2f' : '#ed6c02',
                                  }}
                                >
                                  {med.stock_quantity <= (med.threshold || 10) * 0.5 ? 'Critical' : 'Low'} 
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenRestockDialog(e, med);
                                  }}
                                >
                                  Restock
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
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
                      <Typography color="text.secondary">No low stock medications found</Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ mt: 2, textAlign: 'right' }}>
                    <Button
                      variant="text"
                      color="warning"
                      endIcon={<ChevronRightIcon />}
                      onClick={() => navigate('/medications')}
                    >
                      Manage Inventory
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
        
        
      </Paper>

      {/* Add Restock Dialog */}
      <Dialog open={restockDialogOpen} onClose={handleCloseRestockDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: 'warning.main', color: 'white' }}>
          Restock Medication
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          {medicationToRestock && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                <strong>{medicationToRestock.name}</strong>
              </Typography>
              
              <Typography variant="body2" gutterBottom color="text.secondary">
                Current Stock: {medicationToRestock.stock_quantity}
              </Typography>
              
              <TextField
                autoFocus
                margin="dense"
                label="Quantity to Add"
                type="number"
                fullWidth
                variant="outlined"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                InputProps={{
                  inputProps: { min: 1 }
                }}
                helperText={`New stock will be: ${(medicationToRestock.stock_quantity + restockQuantity)}`}
                sx={{ mt: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseRestockDialog} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleRestockSubmit} 
            variant="contained" 
            color="warning"
            disabled={!medicationToRestock || restockQuantity <= 0 || restockLoading}
          >
            {restockLoading ? <CircularProgress size={24} /> : 'Confirm Restock'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={5000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DashboardHome;