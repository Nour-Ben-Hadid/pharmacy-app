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
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Cake as BirthdayIcon,
  LocalHospital as MedicalIcon,
  Folder as FolderIcon,
  MedicalInformation as MedicalInfoIcon,
  Note as NoteIcon
} from '@mui/icons-material';
import apiClient from '../../app/api/apiClient';
import { useNavigate } from 'react-router-dom';
import { format, differenceInYears } from 'date-fns';

interface Patient {
  id: number;
  full_name: string;
  date_of_birth: string;
  gender: string;
  contact_number?: string;
  email?: string;
  address?: string;
  medical_history?: string;
  notes?: string;
  last_visit?: string;
  blood_type?: string;
  allergies?: string;
  created_at?: string;
}

interface PatientMedicalRecord {
  id: number;
  date: string;
  diagnosis: string;
  treatment: string;
  doctor_name: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`patient-tabpanel-${index}`}
      aria-labelledby={`patient-tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ pt: 2, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const emptyPatient: Patient = {
  id: 0,
  full_name: '',
  date_of_birth: '',
  gender: '',
  contact_number: '',
  email: '',
  address: '',
  medical_history: '',
  notes: '',
  blood_type: '',
  allergies: ''
};

const PatientManagementPage: React.FC = () => {
  // State for patients data
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // State for patient dialog
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [currentPatient, setCurrentPatient] = useState<Patient>(emptyPatient);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterGender, setFilterGender] = useState<string>('all');
  
  // State for patient details view
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientDetailsOpen, setPatientDetailsOpen] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Mock medical records for demo
  const [medicalRecords, setMedicalRecords] = useState<PatientMedicalRecord[]>([]);
  
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

  const navigate = useNavigate();
  
  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
  }, []);

  // Filter patients when search term or filter changes
  useEffect(() => {
    if (searchTerm.trim() === '' && filterGender === 'all') {
      setFilteredPatients(patients);
      return;
    }
    
    let filtered = [...patients];
    
    // Filter by gender
    if (filterGender !== 'all') {
      filtered = filtered.filter(p => p.gender.toLowerCase() === filterGender.toLowerCase());
    }
    
    // Filter by search term
    if (searchTerm.trim() !== '') {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        (p.full_name && p.full_name.toLowerCase().includes(searchTermLower)) ||
        (p.email && p.email.toLowerCase().includes(searchTermLower)) ||
        (p.medical_history && p.medical_history.toLowerCase().includes(searchTermLower))
      );
    }
    
    setFilteredPatients(filtered);
  }, [searchTerm, filterGender, patients]);

  // Fetch patients from API
  const fetchPatients = async () => {
    setLoading(true);
    try {
      // Get patients for the logged-in doctor
      const response = await apiClient.get('/patients/doctor');
      setPatients(response.data);
      setFilteredPatients(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to fetch patients. Please try again later.');
      setPatients([]);
      setFilteredPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch patient medical records
  const fetchPatientMedicalRecords = async (patientId: number) => {
    try {
      // This would be a real API call in production
      const response = await apiClient.get(`/medical-records/patient/${patientId}`);
      setMedicalRecords(response.data);
    } catch (err) {
      console.error('Error fetching medical records:', err);
      setMedicalRecords([]);
    }
  };

  // Handler for opening patient dialog
  const handleOpenDialog = (patient?: Patient) => {
    if (patient) {
      setCurrentPatient(patient);
      setIsEditing(true);
    } else {
      setCurrentPatient(emptyPatient);
      setIsEditing(false);
    }
    setDialogOpen(true);
  };

  // Handler for closing patient dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Handler for patient input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentPatient({
      ...currentPatient,
      [name]: value
    });
  };

  // Handler for gender selection change
  const handleGenderChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setCurrentPatient({
      ...currentPatient,
      gender: e.target.value as string
    });
  };

  // Handler for saving patient (create or update)
  const handleSavePatient = async () => {
    if (!currentPatient.full_name || !currentPatient.date_of_birth || !currentPatient.gender) {
      setNotification({
        open: true,
        message: 'Please fill in all required fields (Name, Date of Birth, Gender)',
        severity: 'error'
      });
      return;
    }
    
    try {
      if (isEditing) {
        // Update existing patient
        await apiClient.patch(`/patients/${currentPatient.id}`, currentPatient);
        setNotification({
          open: true,
          message: 'Patient updated successfully!',
          severity: 'success'
        });
      } else {
        // Create new patient
        await apiClient.post('/patients', currentPatient);
        setNotification({
          open: true,
          message: 'Patient added successfully!',
          severity: 'success'
        });
      }
      
      // Refresh patient list
      fetchPatients();
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error saving patient:', err);
      
      let errorMessage = 'Failed to save patient. Please try again.';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Authentication error: Please login again as a doctor.';
        } else if (err.response.status === 403) {
          errorMessage = 'You do not have permission to perform this action.';
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

  // Handler for deleting patient
  const handleDeletePatient = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this patient record? This action cannot be undone.')) {
      try {
        await apiClient.delete(`/patients/${id}`);
        
        setNotification({
          open: true,
          message: 'Patient deleted successfully!',
          severity: 'success'
        });
        
        // Refresh patient list
        fetchPatients();
      } catch (err: any) {
        console.error('Error deleting patient:', err);
        
        let errorMessage = 'Failed to delete patient. Please try again.';
        
        if (err.response) {
          if (err.response.status === 401) {
            errorMessage = 'Authentication error: Please login again as a doctor.';
          } else if (err.response.status === 403) {
            errorMessage = 'You do not have permission to delete patient records.';
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

  // Handler for viewing patient details
  const handleViewPatientDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientDetailsOpen(true);
    setTabValue(0);
    
    // Fetch patient medical records (in a real app)
    fetchPatientMedicalRecords(patient.id);
  };

  // Handler for closing patient details
  const handleClosePatientDetails = () => {
    setPatientDetailsOpen(false);
  };

  // Handler for tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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

  // Helper function to calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    try {
      return differenceInYears(new Date(), new Date(dateOfBirth));
    } catch {
      return 'N/A';
    }
  };

  // Formatter for dates
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'N/A';
    }
  };

  return (
    <Box sx={{ p: 0 }}>
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
              Patient Management
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ 
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' }
            }}
          >
            Add New Patient
          </Button>
        </Box>

        {/* Search and filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search patients by name, email, or medical history..."
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
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="gender-filter-label">Gender</InputLabel>
              <Select
                labelId="gender-filter-label"
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value as string)}
                label="Gender"
              >
                <MenuItem value="all">All Genders</MenuItem>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                sx={{ flex: 1 }}
              >
                More Filters
              </Button>
              <Button
                variant="outlined"
                startIcon={<SortIcon />}
                sx={{ flex: 1 }}
              >
                Sort
              </Button>
            </Box>
          </Grid>
        </Grid>
        
        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* Patients table */}
        <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'primary.light' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Patient</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Age / Gender</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Medical History</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Last Visit</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} sx={{ color: 'primary.main' }} />
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
                    <TableRow key={patient.id} hover onClick={() => handleViewPatientDetails(patient)} sx={{ cursor: 'pointer' }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              mr: 2, 
                              bgcolor: patient.gender.toLowerCase() === 'male' 
                                ? 'primary.main' 
                                : patient.gender.toLowerCase() === 'female' 
                                  ? 'secondary.main' 
                                  : 'grey.500'
                            }}
                          >
                            {patient.full_name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {patient.full_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {patient.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {calculateAge(patient.date_of_birth)} years
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {patient.gender}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <PhoneIcon fontSize="small" sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                          {patient.contact_number || 'N/A'}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                          <EmailIcon fontSize="small" sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                          {patient.email || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {patient.medical_history || 'No recorded history'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {patient.last_visit ? (
                          <Typography variant="body2">
                            {formatDate(patient.last_visit)}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No visits recorded
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit Patient">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDialog(patient);
                              }}
                              sx={{ color: 'primary.main' }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Patient">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePatient(patient.id);
                              }}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
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
      </Paper>

      {/* Patient form dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          {isEditing ? 'Edit Patient' : 'Add New Patient'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="full_name"
                label="Full Name"
                value={currentPatient.full_name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                name="date_of_birth"
                label="Date of Birth"
                InputLabelProps={{ shrink: true }}
                value={currentPatient.date_of_birth}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="gender-label">Gender</InputLabel>
                <Select
                  labelId="gender-label"
                  name="gender"
                  value={currentPatient.gender}
                  onChange={(e) => handleGenderChange(e as any)}
                  label="Gender"
                >
                  <MenuItem value="">Select Gender</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="contact_number"
                label="Contact Number"
                value={currentPatient.contact_number}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="email"
                label="Email Address"
                type="email"
                value={currentPatient.email}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="address"
                label="Address"
                value={currentPatient.address}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="blood-type-label">Blood Type</InputLabel>
                <Select
                  labelId="blood-type-label"
                  name="blood_type"
                  value={currentPatient.blood_type || ''}
                  onChange={(e) => handleInputChange(e as any)}
                  label="Blood Type"
                >
                  <MenuItem value="">Unknown</MenuItem>
                  <MenuItem value="A+">A+</MenuItem>
                  <MenuItem value="A-">A-</MenuItem>
                  <MenuItem value="B+">B+</MenuItem>
                  <MenuItem value="B-">B-</MenuItem>
                  <MenuItem value="AB+">AB+</MenuItem>
                  <MenuItem value="AB-">AB-</MenuItem>
                  <MenuItem value="O+">O+</MenuItem>
                  <MenuItem value="O-">O-</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="allergies"
                label="Allergies"
                value={currentPatient.allergies}
                onChange={handleInputChange}
                placeholder="List any allergies or 'None'"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="medical_history"
                label="Medical History"
                value={currentPatient.medical_history}
                onChange={handleInputChange}
                multiline
                rows={3}
                placeholder="Brief summary of patient's medical history"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="notes"
                label="Additional Notes"
                value={currentPatient.notes}
                onChange={handleInputChange}
                multiline
                rows={2}
                placeholder="Any additional notes about the patient"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDialog} variant="outlined">Cancel</Button>
          <Button 
            onClick={handleSavePatient} 
            variant="contained" 
            color="primary"
            disabled={!currentPatient.full_name || !currentPatient.date_of_birth || !currentPatient.gender}
          >
            {isEditing ? 'Update Patient' : 'Add Patient'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Patient details dialog */}
      <Dialog 
        open={patientDetailsOpen} 
        onClose={handleClosePatientDetails} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { height: '80vh' } }}
      >
        {selectedPatient && (
          <>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                Patient Details: {selectedPatient.full_name}
              </Box>
              <Button 
                variant="contained" 
                color="secondary" 
                size="small"
                onClick={() => {
                  handleClosePatientDetails();
                  handleOpenDialog(selectedPatient);
                }}
              >
                Edit Patient
              </Button>
            </DialogTitle>
            <Box sx={{ borderBottom, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="patient details tabs" variant="fullWidth">
                <Tab label="Profile" id="patient-tab-0" aria-controls="patient-tabpanel-0" />
                <Tab label="Medical Records" id="patient-tab-1" aria-controls="patient-tabpanel-1" />
                <Tab label="Prescriptions" id="patient-tab-2" aria-controls="patient-tabpanel-2" />
              </Tabs>
            </Box>
            <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 'calc(100% - 120px)' }}>
              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3} sx={{ height: '100%', overflow: 'auto' }}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar 
                            sx={{ 
                              width: 64, 
                              height: 64, 
                              mr: 2,
                              bgcolor: selectedPatient.gender.toLowerCase() === 'male' 
                                ? 'primary.main' 
                                : selectedPatient.gender.toLowerCase() === 'female' 
                                  ? 'secondary.main' 
                                  : 'grey.500'
                            }}
                          >
                            {selectedPatient.full_name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="h6">{selectedPatient.full_name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Patient ID: {selectedPatient.id}
                            </Typography>
                            <Chip 
                              size="small" 
                              label={`${calculateAge(selectedPatient.date_of_birth)} years, ${selectedPatient.gender}`} 
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        </Box>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Contact Information
                        </Typography>
                        
                        <List dense disablePadding>
                          <ListItem disablePadding sx={{ pb: 1 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <PhoneIcon fontSize="small" color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Phone" 
                              secondary={selectedPatient.contact_number || 'Not provided'} 
                              primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                            />
                          </ListItem>
                          <ListItem disablePadding sx={{ pb: 1 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <EmailIcon fontSize="small" color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Email" 
                              secondary={selectedPatient.email || 'Not provided'} 
                              primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                            />
                          </ListItem>
                          <ListItem disablePadding>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <MedicalIcon fontSize="small" color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Blood Type" 
                              secondary={selectedPatient.blood_type || 'Not recorded'} 
                              primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                            />
                          </ListItem>
                        </List>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Personal Information
                        </Typography>
                        
                        <List dense disablePadding>
                          <ListItem disablePadding sx={{ pb: 1 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <BirthdayIcon fontSize="small" color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Date of Birth" 
                              secondary={formatDate(selectedPatient.date_of_birth)} 
                              primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                            />
                          </ListItem>
                        </List>
                        
                        <Typography variant="subtitle2" sx={{ mt: 1 }}>Address:</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedPatient.address || 'No address provided'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <MedicalInfoIcon sx={{ mr: 1 }} />
                          Medical Information
                        </Typography>
                        
                        <Divider sx={{ mb: 2 }} />
                        
                        <Typography variant="subtitle2" gutterBottom>Allergies:</Typography>
                        <Typography variant="body2" paragraph>
                          {selectedPatient.allergies || 'No known allergies'}
                        </Typography>
                        
                        <Typography variant="subtitle2" gutterBottom>Medical History:</Typography>
                        <Typography variant="body2" paragraph>
                          {selectedPatient.medical_history || 'No medical history recorded'}
                        </Typography>
                      </CardContent>
                    </Card>
                    
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <NoteIcon sx={{ mr: 1 }} />
                          Notes
                        </Typography>
                        
                        <Divider sx={{ mb: 2 }} />
                        
                        <Typography variant="body2">
                          {selectedPatient.notes || 'No additional notes for this patient'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </TabPanel>
              
              <TabPanel value={tabValue} index={1}>
                <Box sx={{ height: '100%', overflow: 'auto' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Medical Records</Typography>
                    <Button 
                      variant="contained" 
                      size="small" 
                      startIcon={<AddIcon />}
                      onClick={() => console.log('Add new medical record')}
                    >
                      Add Record
                    </Button>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  {medicalRecords.length > 0 ? (
                    <Stack spacing={2}>
                      {medicalRecords.map((record) => (
                        <Card key={record.id} variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {record.diagnosis}
                              </Typography>
                              <Chip 
                                size="small"
                                label={formatDate(record.date)}
                              />
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              <strong>Treatment:</strong> {record.treatment}
                            </Typography>
                            
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              Attending physician: {record.doctor_name}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  ) : (
                    <Box sx={{ 
                      p: 3, 
                      textAlign: 'center', 
                      bgcolor: 'rgba(0,0,0,0.02)', 
                      borderRadius: 2,
                      border: '1px dashed rgba(0,0,0,0.1)'
                    }}>
                      <FolderIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
                      <Typography color="text.secondary">
                        No medical records found for this patient
                      </Typography>
                    </Box>
                  )}
                </Box>
              </TabPanel>
              
              <TabPanel value={tabValue} index={2}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Prescriptions</Typography>
                    <Button 
                      variant="contained" 
                      color="primary"
                      size="small" 
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/doctor-dashboard/prescriptions/new', { state: { patientId: selectedPatient.id } })}
                    >
                      New Prescription
                    </Button>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ 
                    p: 3, 
                    textAlign: 'center', 
                    bgcolor: 'rgba(0,0,0,0.02)', 
                    borderRadius: 2,
                    border: '1px dashed rgba(0,0,0,0.1)',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <PrescriptionIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
                    <Typography color="text.secondary">
                      Prescription history will be displayed here
                    </Typography>
                    <Button 
                      variant="outlined"
                      sx={{ mt: 2 }}
                      onClick={() => navigate('/doctor-dashboard/prescriptions')}
                    >
                      View All Prescriptions
                    </Button>
                  </Box>
                </Box>
              </TabPanel>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.12)' }}>
              <Button onClick={handleClosePatientDetails} variant="outlined">Close</Button>
            </DialogActions>
          </>
        )}
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
    </Box>
  );
};

export default PatientManagementPage;