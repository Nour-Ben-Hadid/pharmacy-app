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
  OutlinedInput,
  Divider,
  Drawer,
  Card,
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import apiClient from '../../app/api/apiClient';
import { format, parseISO } from 'date-fns';

interface Patient {
  id: number;
  ssn: string;
  name: string;
  date_of_birth: string; // ISO format date string
  contact_info: string;
  email: string;
  allergies: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

interface PatientCreate {
  ssn: string;
  name: string;
  date_of_birth: string;
  contact_info: string;
  email: string;
  allergies: string | null;
  password: string;
}

interface PatientUpdate {
  name?: string;
  date_of_birth?: string;
  contact_info?: string;
  allergies?: string | null;
  email?: string;
  password?: string;
}

const emptyPatient: PatientCreate = {
  ssn: '',
  name: '',
  date_of_birth: new Date().toISOString().split('T')[0], // Today's date as default
  contact_info: '',
  email: '',
  allergies: '',
  password: ''
};

const PatientsPage: React.FC = () => {
  // State for patients data
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // State for patient dialogs
  const [addDialogOpen, setAddDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [viewDialogOpen, setViewDialogOpen] = useState<boolean>(false);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [newPatient, setNewPatient] = useState<PatientCreate>(emptyPatient);
  const [updatedPatient, setUpdatedPatient] = useState<PatientUpdate>({});
  
  // State for search
  const [searchTerm, setSearchTerm] = useState<string>('');
  
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

  // State for drawer
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
  }, []);

  // Filter patients when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(patient => 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.ssn.includes(searchTerm) ||
        (patient.allergies && patient.allergies.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients]);

  // Fetch all patients from API
  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/patients');
      setPatients(response.data);
      setFilteredPatients(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching patients:', err);
      
      let errorMessage = 'Failed to fetch patients. Please try again later.';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Authentication error: Please login as a pharmacist to view patients.';
        } else if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handlers for patient data dialogs
  const handleViewPatient = (patient: Patient) => {
    setCurrentPatient(patient);
    setDrawerOpen(true);
  };

  // Handler for opening drawer
  const handleOpenDrawer = (patient: Patient) => {
    setCurrentPatient(patient);
    setDrawerOpen(true);
  };

  // Handler for closing drawer
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  const handleAddPatient = () => {
    setNewPatient(emptyPatient);
    setAddDialogOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setCurrentPatient(patient);
    setUpdatedPatient({});
    setEditDialogOpen(true);
  };

  const handleDeletePatient = async (ssn: string) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await apiClient.delete(`/patients/${ssn}`);
        
        setNotification({
          open: true,
          message: 'Patient deleted successfully!',
          severity: 'success'
        });
        
        // Refresh patient list
        fetchPatients();
      } catch (err: any) {
        console.error('Error deleting patient:', err);
        
        // Show more specific error message based on response
        let errorMessage = 'Failed to delete patient. Please try again.';
        
        if (err.response) {
          if (err.response.status === 401) {
            errorMessage = 'Authentication error: Please login as a pharmacist.';
          } else if (err.response.status === 403) {
            errorMessage = 'You do not have permission to delete patients.';
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

  // Handler for new patient input change
  const handleNewPatientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPatient({
      ...newPatient,
      [name]: value
    });
  };

  // Handler for patient date of birth change
  const handleNewPatientDateChange = (date: Date | null) => {
    if (date) {
      setNewPatient({
        ...newPatient,
        date_of_birth: date.toISOString().split('T')[0]
      });
    }
  };

  // Handler for updated patient input change
  const handleUpdatedPatientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUpdatedPatient({
      ...updatedPatient,
      [name]: value
    });
  };

  // Handler for updated patient date of birth change
  const handleUpdatedPatientDateChange = (date: Date | null) => {
    if (date) {
      setUpdatedPatient({
        ...updatedPatient,
        date_of_birth: date.toISOString().split('T')[0]
      });
    }
  };

  // Handler for saving new patient
  const handleSaveNewPatient = async () => {
    try {
      await apiClient.post('/patients', newPatient);
      setNotification({
        open: true,
        message: 'Patient added successfully!',
        severity: 'success'
      });
      
      // Refresh patient list
      fetchPatients();
      setAddDialogOpen(false);
    } catch (err: any) {
      console.error('Error adding patient:', err);
      
      let errorMessage = 'Failed to add patient. Please try again.';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Authentication error: Please login as a pharmacist.';
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
  };

  // Handler for saving updated patient
  const handleSaveUpdatedPatient = async () => {
    if (!currentPatient) return;
    
    try {
      await apiClient.patch(`/patients/${currentPatient.ssn}`, updatedPatient);
      setNotification({
        open: true,
        message: 'Patient updated successfully!',
        severity: 'success'
      });
      
      // Refresh patient list
      fetchPatients();
      setEditDialogOpen(false);
    } catch (err: any) {
      console.error('Error updating patient:', err);
      
      let errorMessage = 'Failed to update patient. Please try again.';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Authentication error: Please login as a pharmacist.';
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 0 }}>
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
              <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                Patients
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddPatient}
              sx={{ 
                bgcolor: 'secondary.main',
                '&:hover': { bgcolor: 'secondary.dark' }
              }}
            >
              Add Patient
            </Button>
          </Box>

          {/* Search */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search patients by name, email, SSN or allergies..."
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
          
          {/* Patients table */}
          <Paper sx={{ borderRadius: 2, overflow: 'hidden', height: '100%', boxShadow: 2 }}>
            <Box className="table-header" sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: 'background.default' }}>
              <PersonIcon className="table-header-icon" fontSize="medium" sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="600">
                Patients List
              </Typography>
              <Box flexGrow={1} />
            </Box>
            
            <Box sx={{ px: 2, pb: 2 }}>
              <Divider sx={{ mb: 2 }} />
              
              <TableContainer className="dashboard-table" sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
                <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>SSN</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date of Birth</TableCell>
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
                            Loading patients...
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : filteredPatients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <Typography variant="body1">
                            No patients found.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPatients
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((patient) => (
                          <TableRow 
                            key={patient.id} 
                            hover 
                            sx={{ cursor: 'pointer' }}
                            onClick={() => handleViewPatient(patient)}
                          >
                            <TableCell>{patient.ssn}</TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="500">
                                {patient.name}
                              </Typography>
                            </TableCell>
                            <TableCell>{patient.email}</TableCell>
                            <TableCell>{formatDate(patient.date_of_birth)}</TableCell>
                            <TableCell>
                              <Box 
                                sx={{
                                  display: 'inline-block',
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontSize: '0.75rem',
                                  fontWeight: 'medium',
                                  bgcolor: patient.is_active ? 'rgba(76, 175, 80, 0.1)' : 'rgba(211, 47, 47, 0.1)',
                                  color: patient.is_active ? '#2e7d32' : '#d32f2f',
                                }}
                              >
                                {patient.is_active ? "Active" : "Inactive"}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="info"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDrawer(patient);
                                  }}
                                >
                                  View
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditPatient(patient);
                                  }}
                                  sx={{ mx: 1 }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePatient(patient.ssn);
                                  }}
                                >
                                  Delete
                                </Button>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredPatients.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </TableContainer>
            </Box>
          </Paper>
        </Paper>

        {/* View Patient Dialog */}
        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
            Patient Details
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {currentPatient && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">SSN</Typography>
                  <Typography variant="body1">{currentPatient.ssn}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                  <Typography variant="body1">{currentPatient.name}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{currentPatient.email}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Date of Birth</Typography>
                  <Typography variant="body1">{formatDate(currentPatient.date_of_birth)}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Contact Information</Typography>
                  <Typography variant="body1">{currentPatient.contact_info}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Allergies</Typography>
                  <Typography variant="body1">{currentPatient.allergies || 'None'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={currentPatient.is_active ? "Active" : "Inactive"} 
                    color={currentPatient.is_active ? "success" : "error"}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                  <Typography variant="body1">{formatDate(currentPatient.created_at)}</Typography>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={() => setViewDialogOpen(false)} 
              variant="outlined"
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                setViewDialogOpen(false);
                if (currentPatient) handleEditPatient(currentPatient);
              }} 
              variant="contained" 
              color="primary"
            >
              Edit
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Patient Dialog */}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
            Add New Patient
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="ssn"
                  label="SSN"
                  value={newPatient.ssn}
                  onChange={handleNewPatientChange}
                  required
                  placeholder="XXX-XX-XXXX"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="name"
                  label="Full Name"
                  value={newPatient.name}
                  onChange={handleNewPatientChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Date of Birth"
                  value={new Date(newPatient.date_of_birth)}
                  onChange={handleNewPatientDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="email"
                  label="Email"
                  type="email"
                  value={newPatient.email}
                  onChange={handleNewPatientChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="contact_info"
                  label="Contact Information"
                  value={newPatient.contact_info}
                  onChange={handleNewPatientChange}
                  placeholder="Phone number, address, etc."
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="allergies"
                  label="Allergies"
                  value={newPatient.allergies || ''}
                  onChange={handleNewPatientChange}
                  multiline
                  rows={2}
                  placeholder="List any allergies or type 'None'"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  value={newPatient.password}
                  onChange={handleNewPatientChange}
                  required
                  helperText="Minimum 8 characters"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setAddDialogOpen(false)} variant="outlined">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveNewPatient} 
              variant="contained" 
              color="primary"
              disabled={
                !newPatient.ssn ||
                !newPatient.name ||
                !newPatient.email ||
                !newPatient.date_of_birth ||
                !newPatient.contact_info ||
                !newPatient.password ||
                newPatient.password.length < 8
              }
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Patient Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
            Edit Patient
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {currentPatient && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="SSN"
                    value={currentPatient.ssn}
                    InputProps={{ readOnly: true }}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="name"
                    label="Full Name"
                    value={updatedPatient.name !== undefined ? updatedPatient.name : currentPatient.name}
                    onChange={handleUpdatedPatientChange}
                    placeholder={currentPatient.name}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Date of Birth"
                    value={updatedPatient.date_of_birth ? new Date(updatedPatient.date_of_birth) : new Date(currentPatient.date_of_birth)}
                    onChange={handleUpdatedPatientDateChange}
                    slotProps={{
                      textField: {
                        fullWidth: true
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="email"
                    label="Email"
                    type="email"
                    value={updatedPatient.email !== undefined ? updatedPatient.email : currentPatient.email}
                    onChange={handleUpdatedPatientChange}
                    placeholder={currentPatient.email}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="contact_info"
                    label="Contact Information"
                    value={updatedPatient.contact_info !== undefined ? updatedPatient.contact_info : currentPatient.contact_info}
                    onChange={handleUpdatedPatientChange}
                    placeholder={currentPatient.contact_info}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="allergies"
                    label="Allergies"
                    value={updatedPatient.allergies !== undefined ? updatedPatient.allergies || '' : currentPatient.allergies || ''}
                    onChange={handleUpdatedPatientChange}
                    multiline
                    rows={2}
                    placeholder={currentPatient.allergies || 'None'}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="password"
                    label="New Password (Optional)"
                    type="password"
                    value={updatedPatient.password || ''}
                    onChange={handleUpdatedPatientChange}
                    helperText="Leave blank to keep current password"
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setEditDialogOpen(false)} variant="outlined">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveUpdatedPatient} 
              variant="contained" 
              color="primary"
              disabled={
                (updatedPatient.password !== undefined && updatedPatient.password.length > 0 && updatedPatient.password.length < 8)
              }
            >
              Update
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

        {/* Patient Details Drawer */}
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
          {currentPatient && (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Patient Details</Typography>
                <IconButton onClick={handleCloseDrawer} edge="end">
                  <CloseIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Patient Information</Typography>
                    <Typography variant="body1" fontWeight="500" mb={1}>
                      {currentPatient.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      SSN: {currentPatient.ssn}
                    </Typography>
                    
                    <Typography variant="subtitle2" color="text.secondary">Date of Birth</Typography>
                    <Typography variant="body1" fontWeight="500" mb={1}>
                      {formatDate(currentPatient.date_of_birth)}
                    </Typography>
                    
                    <Typography variant="subtitle2" color="text.secondary">Contact Information</Typography>
                    <Typography variant="body1" mb={1}>{currentPatient.contact_info}</Typography>
                    
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    <Typography variant="body1" mb={1}>{currentPatient.email}</Typography>
                    
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Chip 
                      label={currentPatient.is_active ? "Active" : "Inactive"} 
                      color={currentPatient.is_active ? "success" : "error"}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </CardContent>
                </Card>
                
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Medical Information</Typography>
                    <Typography variant="body1" fontWeight="500" mb={1}>
                      Allergies
                    </Typography>
                    <Typography variant="body2" mb={1}>
                      {currentPatient.allergies || 'No known allergies'}
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">System Information</Typography>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Created At</Typography>
                        <Typography variant="body2">{formatDate(currentPatient.created_at)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Last Updated</Typography>
                        <Typography variant="body2">{currentPatient.updated_at ? formatDate(currentPatient.updated_at) : 'Never'}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Box>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', pt: 1.5, borderTop: '1px solid rgba(0,0,0,0.12)' }}>
                <Button
                  variant="outlined"
                  onClick={handleCloseDrawer}
                >
                  Close
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    handleCloseDrawer();
                    if (currentPatient) handleEditPatient(currentPatient);
                  }}
                >
                  Edit Patient
                </Button>
              </Box>
            </Box>
          )}
        </Drawer>
      </Box>
    </LocalizationProvider>
  );
};

export default PatientsPage;