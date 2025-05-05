import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  List,
  ListItem,
  ListItemText,
  Divider,
  Drawer,
  Card,
  CardContent
} from '@mui/material';
import {
  Assignment as PrescriptionIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Check as CheckIcon,
  FilterList as FilterIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import apiClient from '../../app/api/apiClient';
import { format, parseISO } from 'date-fns';
import { useLocation } from 'react-router-dom';

interface PrescriptionMedication {
  id: number;
  medication_id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface Prescription {
  id: number;
  patient_ssn: string;
  doctor_license: string;
  date_issued: string; // ISO format date string
  status: string;
  medications: PrescriptionMedication[];
  patient_name?: string; // We'll fetch this separately
  doctor_name?: string; // We'll fetch this separately
}

interface FilterOptions {
  patientSsn: string;
  doctorLicense: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
}

const emptyFilterOptions: FilterOptions = {
  patientSsn: '',
  doctorLicense: '',
  status: '',
  startDate: null,
  endDate: null
};

const PrescriptionsPage: React.FC = () => {
  // Get location to check for passed prescription ID
  const location = useLocation();
  
  // State for prescriptions data
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // State for dialogs
  const [detailsDialogOpen, setDetailsDialogOpen] = useState<boolean>(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState<boolean>(false);
  
  // State for drawer
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(emptyFilterOptions);
  const [appliedFilters, setAppliedFilters] = useState<FilterOptions>(emptyFilterOptions);

  // State for notifications
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Additional state for patient and doctor lookup data
  const [patients, setPatients] = useState<{ ssn: string; name: string }[]>([]);
  const [doctors, setDoctors] = useState<{ license: string; name: string }[]>([]);

  // Fetch prescriptions on component mount
  useEffect(() => {
    fetchPrescriptions();
    fetchPatientsAndDoctors();
  }, []);
  
  // Check for prescription ID in location state and open drawer if found
  useEffect(() => {
    if (location.state && location.state.viewPrescriptionId) {
      const prescriptionId = location.state.viewPrescriptionId;
      
      // Find the prescription with the matching ID
      const foundPrescription = prescriptions.find(p => p.id === prescriptionId);
      
      if (foundPrescription) {
        // Open drawer with the selected prescription
        setSelectedPrescription(foundPrescription);
        setDrawerOpen(true);
      } else {
        // If prescription isn't in our current list, fetch it directly
        const fetchPrescriptionById = async () => {
          try {
            const response = await apiClient.get(`/prescriptions/${prescriptionId}`);
            const prescription = response.data;
            setSelectedPrescription(prescription);
            setDrawerOpen(true);
          } catch (err) {
            console.error(`Error fetching prescription ${prescriptionId}:`, err);
            setNotification({
              open: true,
              message: 'Failed to load prescription details',
              severity: 'error'
            });
          }
        };
        
        fetchPrescriptionById();
      }
    }
  }, [location.state, prescriptions]);

  // Apply search filter when search term or data changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPrescriptions(prescriptions);
    } else {
      const lowerCaseSearch = searchTerm.toLowerCase();
      const filtered = prescriptions.filter(prescription => 
        prescription.patient_name?.toLowerCase().includes(lowerCaseSearch) ||
        prescription.doctor_name?.toLowerCase().includes(lowerCaseSearch) ||
        prescription.patient_ssn.includes(searchTerm) ||
        prescription.doctor_license.includes(searchTerm)
      );
      setFilteredPrescriptions(filtered);
    }
  }, [searchTerm, prescriptions]);

  // Fetch prescriptions from API
  const fetchPrescriptions = async (filters?: FilterOptions) => {
    setLoading(true);
    try {
      // Build the query string based on filters
      let queryParams = new URLSearchParams();
      
      if (filters) {
        if (filters.patientSsn) queryParams.append('patient_ssn', filters.patientSsn);
        if (filters.doctorLicense) queryParams.append('doctor_license', filters.doctorLicense);
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.startDate) queryParams.append('start_date', filters.startDate.toISOString().split('T')[0]);
        if (filters.endDate) queryParams.append('end_date', filters.endDate.toISOString().split('T')[0]);
      }

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/prescriptions/all?${queryString}` : '/prescriptions/all';
      
      const response = await apiClient.get(endpoint);
      
      // No need to enrich with names anymore as the API now provides them
      setPrescriptions(response.data);
      setFilteredPrescriptions(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching prescriptions:', err);
      
      let errorMessage = 'Failed to fetch prescriptions. Please try again later.';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Authentication error: Please login as a pharmacist to view prescriptions.';
        } else if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch patient and doctor data for lookup
  const fetchPatientsAndDoctors = async () => {
    try {
      // Fetch patients
      const patientsResponse = await apiClient.get('/patients');
      const patientsData = patientsResponse.data.map((patient: any) => ({
        ssn: patient.ssn,
        name: patient.name
      }));
      setPatients(patientsData);
      
      // Fetch doctors
      const doctorsResponse = await apiClient.get('/doctors');
      const doctorsData = doctorsResponse.data.map((doctor: any) => ({
        license: doctor.license_number,
        name: doctor.name
      }));
      setDoctors(doctorsData);
    } catch (err) {
      console.error('Error fetching patients and doctors:', err);
    }
  };

  // Handler for viewing prescription details
  const handleViewDetails = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setDetailsDialogOpen(true);
  };

  // Handler for opening drawer
  const handleOpenDrawer = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setDrawerOpen(true);
  };

  // Handler for closing drawer
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  // Handler for fulfilling a prescription
  const handleFulfillPrescription = async (id: number) => {
    if (window.confirm('Are you sure you want to fulfill this prescription?')) {
      try {
        await apiClient.patch(`/prescriptions/${id}/fulfill`);
        
        setNotification({
          open: true,
          message: 'Prescription fulfilled successfully!',
          severity: 'success'
        });
        
        // Refresh prescription list
        fetchPrescriptions(appliedFilters);
      } catch (err: any) {
        console.error('Error fulfilling prescription:', err);
        
        let errorMessage = 'Failed to fulfill prescription. Please try again.';
        
        if (err.response) {
          if (err.response.status === 401) {
            errorMessage = 'Authentication error: Please login as a pharmacist.';
          } else if (err.response.status === 403) {
            errorMessage = 'You do not have permission to fulfill prescriptions.';
          } else if (err.response.data?.detail) {
            errorMessage = err.response.data.detail;
          }
        }
        
        setNotification({
          open: true,
          message: errorMessage,
          severity: 'error'
        });
      }
    }
  };

  // Handler for applying filters
  const handleApplyFilters = () => {
    setAppliedFilters(filterOptions);
    fetchPrescriptions(filterOptions);
    setFilterDialogOpen(false);
    setPage(0); // Reset to first page when applying filters
  };

  // Handler for clearing filters
  const handleClearFilters = () => {
    setFilterOptions(emptyFilterOptions);
    setAppliedFilters(emptyFilterOptions);
    fetchPrescriptions();
    setFilterDialogOpen(false);
    setPage(0); // Reset to first page when clearing filters
  };

  // Handlers for pagination
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handler for notification close
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Calculate if there are any active filters
  const hasActiveFilters = () => {
    return (
      appliedFilters.patientSsn !== '' ||
      appliedFilters.doctorLicense !== '' ||
      appliedFilters.status !== '' ||
      appliedFilters.startDate !== null ||
      appliedFilters.endDate !== null
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 0 }}>
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PrescriptionIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
              <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                Prescriptions
              </Typography>
            </Box>
            <Box>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setFilterDialogOpen(true)}
                sx={{ mr: 1 }}
                color={hasActiveFilters() ? "secondary" : "primary"}
              >
                {hasActiveFilters() ? "Filters Applied" : "Filter"}
              </Button>
            </Box>
          </Box>

          {/* Search */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search prescriptions by patient name, doctor name, SSN or license..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ bgcolor: 'background.paper' }}
            />
          </Box>
          
          {/* Error message */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {/* Prescriptions table */}
          <Paper sx={{ borderRadius: 2, overflow: 'hidden', height: '100%', boxShadow: 2 }}>
            <Box className="table-header" sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: 'background.default' }}>
              <PrescriptionIcon className="table-header-icon" fontSize="medium" sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="600">
                Prescriptions List
              </Typography>
              <Box flexGrow={1} />
            </Box>
            
            <Box sx={{ px: 2, pb: 2 }}>
              <Divider sx={{ mb: 2 }} />
              
              <TableContainer className="dashboard-table" sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
                <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Patient</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Doctor</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date Issued</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <CircularProgress size={40} />
                          <Typography variant="body1" sx={{ mt: 1 }}>
                            Loading prescriptions...
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : filteredPrescriptions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <Typography variant="body1">
                            No prescriptions found.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPrescriptions
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((prescription) => (
                          <TableRow 
                            key={prescription.id} 
                            hover 
                            sx={{ cursor: 'pointer' }}
                            onClick={() => handleOpenDrawer(prescription)}
                          >
                            <TableCell>{prescription.id}</TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="500">
                                {prescription.patient_name || 'Unknown'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {prescription.patient_ssn}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {prescription.doctor_name || 'Unknown'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {prescription.doctor_license}
                              </Typography>
                            </TableCell>
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
                              
                              {prescription.status === 'pending' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFulfillPrescription(prescription.id);
                                  }}
                                  sx={{ ml: 1 }}
                                >
                                  Fulfill
                                </Button>
                              )}
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDrawer(prescription);
                                }}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredPrescriptions.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </TableContainer>
            </Box>
          </Paper>
        </Paper>

        {/* Prescription Details Dialog */}
        <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
            Prescription Details
          </DialogTitle>
          <DialogContent sx={{ pt: 3, pb: 1 }}>
            {selectedPrescription && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Patient</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {selectedPrescription.patient_name || 'Unknown'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    SSN: {selectedPrescription.patient_ssn}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Doctor</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {selectedPrescription.doctor_name || 'Unknown'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    License: {selectedPrescription.doctor_license}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Date Issued</Typography>
                  <Typography variant="body1">
                    {formatDate(selectedPrescription.date_issued)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={selectedPrescription.status.charAt(0).toUpperCase() + selectedPrescription.status.slice(1)} 
                    color={selectedPrescription.status === 'pending' ? "warning" : "success"}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" color="primary" sx={{ mt: 2, mb: 1 }}>
                    Medications
                  </Typography>
                  <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'primary.light' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Medication</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Dosage</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Frequency</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Duration</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedPrescription.medications.map((med) => (
                          <TableRow key={med.id}>
                            <TableCell>{med.medication_name}</TableCell>
                            <TableCell>{med.dosage}</TableCell>
                            <TableCell>{med.frequency}</TableCell>
                            <TableCell>{med.duration}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDetailsDialogOpen(false)} variant="outlined">
              Close
            </Button>
            {selectedPrescription && selectedPrescription.status === 'pending' && (
              <Button 
                onClick={() => {
                  handleFulfillPrescription(selectedPrescription.id);
                  setDetailsDialogOpen(false);
                }} 
                variant="contained" 
                color="success"
                startIcon={<CheckIcon />}
              >
                Fulfill Prescription
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Filter Dialog */}
        <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
            Filter Prescriptions
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="patient-select-label">Patient</InputLabel>
                  <Select
                    labelId="patient-select-label"
                    value={filterOptions.patientSsn}
                    onChange={(e) => setFilterOptions({...filterOptions, patientSsn: e.target.value})}
                    input={<OutlinedInput label="Patient" />}
                  >
                    <MenuItem value="">
                      <em>All Patients</em>
                    </MenuItem>
                    {patients.map((patient) => (
                      <MenuItem key={patient.ssn} value={patient.ssn}>
                        {patient.name} ({patient.ssn})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="doctor-select-label">Doctor</InputLabel>
                  <Select
                    labelId="doctor-select-label"
                    value={filterOptions.doctorLicense}
                    onChange={(e) => setFilterOptions({...filterOptions, doctorLicense: e.target.value})}
                    input={<OutlinedInput label="Doctor" />}
                  >
                    <MenuItem value="">
                      <em>All Doctors</em>
                    </MenuItem>
                    {doctors.map((doctor) => (
                      <MenuItem key={doctor.license} value={doctor.license}>
                        {doctor.name} ({doctor.license})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="status-select-label">Status</InputLabel>
                  <Select
                    labelId="status-select-label"
                    value={filterOptions.status}
                    onChange={(e) => setFilterOptions({...filterOptions, status: e.target.value})}
                    input={<OutlinedInput label="Status" />}
                  >
                    <MenuItem value="">
                      <em>All Statuses</em>
                    </MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="fulfilled">Fulfilled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Start Date"
                  value={filterOptions.startDate}
                  onChange={(date) => setFilterOptions({...filterOptions, startDate: date})}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="End Date"
                  value={filterOptions.endDate}
                  onChange={(date) => setFilterOptions({...filterOptions, endDate: date})}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined'
                    }
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClearFilters} variant="outlined" color="error">
              Clear Filters
            </Button>
            <Button onClick={() => setFilterDialogOpen(false)} variant="outlined">
              Cancel
            </Button>
            <Button onClick={handleApplyFilters} variant="contained" color="primary">
              Apply Filters
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Notification */}
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

        {/* Prescription details drawer */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={handleCloseDrawer}
          sx={{
            '& .MuiDrawer-paper': { 
              width: { xs: '100%', sm: 'min(500px, 100%)' },
              padding: 2
            },
          }}
        >
          {selectedPrescription && (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Prescription Details</Typography>
                <IconButton onClick={handleCloseDrawer} edge="end">
                  <CloseIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Patient</Typography>
                    <Typography variant="body1" fontWeight="500" mb={1}>
                      {selectedPrescription.patient_name || 'Unknown'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      SSN: {selectedPrescription.patient_ssn}
                    </Typography>
                    
                    <Typography variant="subtitle2" color="text.secondary">Doctor</Typography>
                    <Typography variant="body1" fontWeight="500" mb={1}>
                      {selectedPrescription.doctor_name || 'Unknown'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      License: {selectedPrescription.doctor_license}
                    </Typography>
                    
                    <Typography variant="subtitle2" color="text.secondary">Date Issued</Typography>
                    <Typography variant="body1" mb={1}>{formatDate(selectedPrescription.date_issued)}</Typography>
                    
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Chip 
                      label={selectedPrescription.status.charAt(0).toUpperCase() + selectedPrescription.status.slice(1)} 
                      color={selectedPrescription.status === 'pending' ? "warning" : "success"}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </CardContent>
                </Card>
                
                <Typography variant="h6" gutterBottom>Medications</Typography>
                {selectedPrescription.medications.map((med, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 1.5 }}>
                    <CardContent sx={{ py: 1.5 }}>
                      <Typography variant="subtitle1" fontWeight="500">{med.medication_name}</Typography>
                      <Grid container spacing={1} sx={{ mt: 0.5 }}>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">Dosage</Typography>
                          <Typography variant="body2">{med.dosage}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">Frequency</Typography>
                          <Typography variant="body2">{med.frequency}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">Duration</Typography>
                          <Typography variant="body2">{med.duration}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Box>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', pt: 1.5, borderTop: '1px solid rgba(0,0,0,0.12)' }}>
                <Button
                  variant="outlined"
                  onClick={handleCloseDrawer}
                >
                  Close
                </Button>
                {selectedPrescription.status === 'pending' && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={() => {
                      handleFulfillPrescription(selectedPrescription.id);
                      handleCloseDrawer();
                    }}
                  >
                    Fulfill Prescription
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Drawer>
      </Box>
    </LocalizationProvider>
  );
};

export default PrescriptionsPage;