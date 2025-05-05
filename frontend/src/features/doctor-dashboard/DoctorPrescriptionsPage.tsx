import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
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
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
  Drawer,
  Card,
  CardContent,
  Divider,
  Tab,
  Tabs,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Description as DescriptionIcon,
  Person as PatientIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Print as PrintIcon,
  AssignmentTurnedIn as CompletedIcon,
  HourglassEmpty as PendingIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import apiClient from '../../app/api/apiClient';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface Patient {
  id: number;
  full_name: string;
  date_of_birth: string;
  gender: string;
}

interface Medication {
  id: number;
  name: string;
  dosage_form: string;
  strength: string;
}

interface PrescriptionMedication {
  medication_id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface Prescription {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_ssn?: string; // Adding SSN field
  doctor_id: number;
  doctor_name: string;
  date_issued: string;
  status: string;
  notes: string;
  medications: PrescriptionMedication[];
}

const emptyPrescription: Prescription = {
  id: 0,
  patient_id: 0,
  patient_name: '',
  patient_ssn: '',
  doctor_id: 0,
  doctor_name: '',
  date_issued: format(new Date(), 'yyyy-MM-dd'),
  status: 'pending',
  notes: '',
  medications: []
};

interface FormMedication {
  medication_id?: number | null;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

const emptyFormMedication: FormMedication = {
  medication_id: null,
  medication_name: '',
  dosage: '',
  frequency: '',
  duration: ''
};

const DoctorPrescriptionsPage: React.FC = () => {
  // State for prescriptions data
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State for dialog
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [currentPrescription, setCurrentPrescription] = useState<Prescription>(emptyPrescription);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // State for medications in form
  const [medicationsList, setMedicationsList] = useState<Medication[]>([]);
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [currentMedication, setCurrentMedication] = useState<FormMedication>(emptyFormMedication);
  
  // State for medication dialog
  const [medicationDialogOpen, setMedicationDialogOpen] = useState<boolean>(false);
  
  // State for drawer
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  
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
  
  // Fetch data on component mount
  useEffect(() => {
    fetchPrescriptions();
    fetchMedications();
    fetchPatients();
  }, []);

  // Filter prescriptions when search term or filter status changes
  useEffect(() => {
    if (searchTerm.trim() === '' && filterStatus === 'all') {
      setFilteredPrescriptions(prescriptions);
      return;
    }
    
    let filtered = [...prescriptions];
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    
    // Filter by search term
    if (searchTerm.trim() !== '') {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        (p.patient_name && p.patient_name.toLowerCase().includes(searchTermLower)) ||
        (p.patient_ssn && p.patient_ssn.toLowerCase().includes(searchTermLower)) ||
        (p.doctor_name && p.doctor_name.toLowerCase().includes(searchTermLower)) ||
        (p.notes && p.notes.toLowerCase().includes(searchTermLower))
      );
    }
    
    setFilteredPrescriptions(filtered);
  }, [searchTerm, filterStatus, prescriptions]);

  // Fetch prescriptions from API
  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      // Get prescriptions for the logged-in doctor using the correct endpoint
      const response = await apiClient.get('/prescriptions/doctor');
      
      // Process prescriptions to ensure they have patient information
      const processedPrescriptions = response.data.map((prescription: any) => {
        // If the prescription has patient_ssn but no patient_name, try to find patient info
        if (!prescription.patient_name && prescription.patient_ssn && patientsList.length > 0) {
          const patient = patientsList.find(p => p.ssn === prescription.patient_ssn);
          if (patient) {
            return {
              ...prescription,
              patient_id: patient.id,
              patient_name: patient.full_name
            };
          }
        }
        return prescription;
      });
      
      console.log('Fetched prescriptions:', processedPrescriptions);
      setPrescriptions(processedPrescriptions);
      setFilteredPrescriptions(processedPrescriptions);
      setError(null);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError('Failed to fetch prescriptions. Please try again later.');
      setPrescriptions([]);
      setFilteredPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch medications for the form
  const fetchMedications = async () => {
    try {
      const response = await apiClient.get('/medications');
      setMedicationsList(response.data);
    } catch (err) {
      console.error('Error fetching medications:', err);
      setMedicationsList([]);
      setNotification({
        open: true,
        message: 'Failed to load medications. Some features may be limited.',
        severity: 'error'
      });
    }
  };

  // Fetch patients for the form
  const fetchPatients = async () => {
    try {
      // Use the doctor-specific patient endpoint
      const response = await apiClient.get('/patients/doctor');
      setPatientsList(response.data);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setPatientsList([]);
      setNotification({
        open: true,
        message: 'Failed to load patient list. Some features may be limited.',
        severity: 'error'
      });
    }
  };

  // Handler for opening prescription dialog
  const handleOpenDialog = (prescription?: Prescription) => {
    if (prescription) {
      setCurrentPrescription(prescription);
      setIsEditing(true);
    } else {
      setCurrentPrescription({
        ...emptyPrescription,
        date_issued: format(new Date(), 'yyyy-MM-dd')
      });
      setIsEditing(false);
    }
    setDialogOpen(true);
  };

  // Handler for closing prescription dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Handler for prescription input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentPrescription({
      ...currentPrescription,
      [name]: value
    });
  };

  // Handler for patient selection
  const handlePatientChange = (_event: React.SyntheticEvent, patient: Patient | null) => {
    if (patient) {
      setCurrentPrescription({
        ...currentPrescription,
        patient_id: patient.id,
        patient_name: patient.full_name
      });
    } else {
      setCurrentPrescription({
        ...currentPrescription,
        patient_id: 0,
        patient_name: ''
      });
    }
  };

  // Handler for opening medication dialog
  const handleOpenMedicationDialog = (medication?: PrescriptionMedication) => {
    if (medication) {
      setCurrentMedication({
        medication_id: medication.medication_id,
        medication_name: medication.medication_name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        duration: medication.duration
      });
    } else {
      setCurrentMedication(emptyFormMedication);
    }
    setMedicationDialogOpen(true);
  };

  // Handler for closing medication dialog
  const handleCloseMedicationDialog = () => {
    setMedicationDialogOpen(false);
  };

  // Handler for medication input change
  const handleMedicationInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentMedication({
      ...currentMedication,
      [name]: value
    });
  };

  // Handler for medication selection in dialog
  const handleMedicationChange = (_event: React.SyntheticEvent, medication: Medication | null) => {
    if (medication) {
      setCurrentMedication({
        ...currentMedication,
        medication_id: medication.id,
        medication_name: medication.name
      });
    } else {
      setCurrentMedication({
        ...currentMedication,
        medication_id: null,
        medication_name: ''
      });
    }
  };

  // Handler for adding/updating medication in prescription
  const handleAddMedication = () => {
    if (!currentMedication.medication_id || !currentMedication.medication_name) {
      setNotification({
        open: true,
        message: 'Please select a medication',
        severity: 'error'
      });
      return;
    }
    
    const medication: PrescriptionMedication = {
      medication_id: currentMedication.medication_id,
      medication_name: currentMedication.medication_name,
      dosage: currentMedication.dosage,
      frequency: currentMedication.frequency,
      duration: currentMedication.duration
    };
    
    // Check if medication already exists in the list
    const existingIndex = currentPrescription.medications.findIndex(m => m.medication_id === medication.medication_id);
    
    if (existingIndex >= 0) {
      // Update existing medication
      const updatedMedications = [...currentPrescription.medications];
      updatedMedications[existingIndex] = medication;
      
      setCurrentPrescription({
        ...currentPrescription,
        medications: updatedMedications
      });
    } else {
      // Add new medication
      setCurrentPrescription({
        ...currentPrescription,
        medications: [...currentPrescription.medications, medication]
      });
    }
    
    // Reset form and close dialog
    setCurrentMedication(emptyFormMedication);
    handleCloseMedicationDialog();
  };

  // Handler for removing medication from prescription
  const handleRemoveMedication = (medicationId: number) => {
    const updatedMedications = currentPrescription.medications.filter(m => m.medication_id !== medicationId);
    setCurrentPrescription({
      ...currentPrescription,
      medications: updatedMedications
    });
  };

  // Handler for saving prescription (create or update)
  const handleSavePrescription = async () => {
    if (!currentPrescription.patient_ssn) {
      setNotification({
        open: true,
        message: 'Please enter a patient SSN',
        severity: 'error'
      });
      return;
    }
    
    if (currentPrescription.medications.length === 0) {
      setNotification({
        open: true,
        message: 'Please add at least one medication to the prescription',
        severity: 'error'
      });
      return;
    }
    
    try {
      // Get current doctor information from API or context 
      const doctorInfoResponse = await apiClient.get('/doctors/me');
      const doctorInfo = doctorInfoResponse.data;
      
      // Transform frontend model to backend API format
      const prescriptionData = {
        patient_ssn: currentPrescription.patient_ssn, // Use directly entered SSN
        doctor_license: doctorInfo.license_number,
        medications: currentPrescription.medications.map(med => ({
          medication_name: med.medication_name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration
        }))
      };
      
      console.log('Sending prescription data to API:', prescriptionData);
      
      if (isEditing) {
        // Update existing prescription
        await apiClient.patch(`/prescriptions/${currentPrescription.id}`, prescriptionData);
        setNotification({
          open: true,
          message: 'Prescription updated successfully!',
          severity: 'success'
        });
      } else {
        // Create new prescription
        await apiClient.post('/prescriptions', prescriptionData);
        setNotification({
          open: true,
          message: 'Prescription created successfully!',
          severity: 'success'
        });
      }
      
      // Refresh prescription list
      fetchPrescriptions();
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error saving prescription:', err);
      
      let errorMessage = 'Failed to save prescription. Please try again.';
      
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

  // Handler for deleting prescription
  const handleDeletePrescription = async (id: number, event?: React.MouseEvent) => {
    // Stop event propagation if event is provided
    if (event) {
      event.stopPropagation();
    }
    
    if (window.confirm('Are you sure you want to delete this prescription?')) {
      try {
        await apiClient.delete(`/prescriptions/${id}`);
        
        setNotification({
          open: true,
          message: 'Prescription deleted successfully!',
          severity: 'success'
        });
        
        // Refresh prescription list
        fetchPrescriptions();
      } catch (err: any) {
        console.error('Error deleting prescription:', err);
        
        let errorMessage = 'Failed to delete prescription. Please try again.';
        
        if (err.response) {
          if (err.response.status === 401) {
            errorMessage = 'Authentication error: Please login again as a doctor.';
          } else if (err.response.status === 403) {
            errorMessage = 'You do not have permission to delete prescriptions.';
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

  // Handler for opening prescription details drawer
  const handleOpenDrawer = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setDrawerOpen(true);
  };

  // Handler for closing prescription details drawer
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
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

  // Formatter for dates
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <Box sx={{ p: 0, width: '100%' }}>
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper', width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DescriptionIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
              Prescriptions Management
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
            New Prescription
          </Button>
        </Box>

        {/* Search and filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search prescriptions by patient name, SSN, doctor, or notes..."
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
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="fulfilled">Fulfilled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              
              
            </Box>
          </Grid>
        </Grid>
        
        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* Prescriptions table */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', height: '100%', boxShadow: 2 }}>
          <Box className="table-header" sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: 'background.default' }}>
            <DescriptionIcon className="table-header-icon" fontSize="medium" sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="600">
              Prescriptions List
            </Typography>
            <Box flexGrow={1} />
            <Typography variant="caption" color="text.secondary">
              Showing {filteredPrescriptions.length} of {prescriptions.length} prescriptions
            </Typography>
          </Box>
          
          <Box sx={{ px: 0, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer className="dashboard-table" sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
              <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow >
                    <TableCell sx={{ fontWeight: 'bold' }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date Issued</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Medications</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <CircularProgress size={40} sx={{ color: 'primary.main' }} />
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          Loading prescriptions...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : filteredPrescriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography variant="body1">
                          No prescriptions found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPrescriptions
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((prescription) => (
                        <TableRow key={prescription.id} hover onClick={() => handleOpenDrawer(prescription)} sx={{ cursor: 'pointer' }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {prescription.patient_name}
                              </Typography>
                              {prescription.patient_ssn && (
                                <Typography variant="caption" color="text.secondary">
                                  SSN: {prescription.patient_ssn}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>{formatDate(prescription.date_issued)}</TableCell>
                          <TableCell>
                            <Box sx={{ maxWidth: 250 }}>
                              {prescription.medications.length > 0 ? (
                                prescription.medications.map((med, index) => (
                                  <Chip
                                    key={index}
                                    label={med.medication_name}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }}
                                  />
                                )).slice(0, 3)
                              ) : (
                                <Typography variant="body2" color="text.secondary">No medications</Typography>
                              )}
                              {prescription.medications.length > 3 && (
                                <Chip 
                                  label={`+${prescription.medications.length - 3} more`} 
                                  size="small" 
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
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
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDialog(prescription);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePrescription(prescription.id);
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

      {/* Prescription form dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          {isEditing ? 'Edit Prescription' : 'Create New Prescription'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="patient_ssn"
                label="Patient SSN"
                value={currentPrescription.patient_ssn || ''}
                onChange={handleInputChange}
                placeholder="Enter patient's social security number"
                helperText="Enter the patient's SSN directly instead of selecting from dropdown"
                required
              />
            </Grid>
            
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Medications</Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenMedicationDialog()}
                >
                  Add Medication
                </Button>
              </Box>
              
              {currentPrescription.medications.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Medication</TableCell>
                        <TableCell>Dosage</TableCell>
                        <TableCell>Frequency</TableCell>
                        <TableCell>Duration</TableCell>
                        
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentPrescription.medications.map((med, index) => (
                        <TableRow key={index}>
                          <TableCell>{med.medication_name}</TableCell>
                          <TableCell>{med.dosage}</TableCell>
                          <TableCell>{med.frequency}</TableCell>
                          <TableCell>{med.duration}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenMedicationDialog(med)}
                              sx={{ color: 'primary.main', mr: 1 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveMedication(med.medication_id)}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  bgcolor: 'rgba(0,0,0,0.02)', 
                  borderRadius: 1,
                  border: '1px dashed rgba(0,0,0,0.1)'
                }}>
                  <Typography color="text.secondary">
                    No medications added yet. Click "Add Medication" to include medications in this prescription.
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDialog} variant="outlined">Cancel</Button>
          <Button 
            onClick={handleSavePrescription} 
            variant="contained" 
            color="primary"
            disabled={!currentPrescription.patient_ssn || currentPrescription.medications.length === 0}
          >
            {isEditing ? 'Update Prescription' : 'Create Prescription'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Medication dialog */}
      <Dialog open={medicationDialogOpen} onClose={handleCloseMedicationDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'secondary.main', color: 'white' }}>
          Add Medication to Prescription
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete
                options={medicationsList}
                getOptionLabel={(option) => `${option.name} (${option.strength}, ${option.dosage_form})` || ''}
                value={medicationsList.find(m => m.id === currentMedication.medication_id) || null}
                onChange={handleMedicationChange}
                renderInput={(params) => (
                  <TextField {...params} label="Medication" required />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="dosage"
                label="Dosage"
                value={currentMedication.dosage}
                onChange={handleMedicationInputChange}
                placeholder="e.g., 1 tablet, 2 capsules"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="frequency"
                label="Frequency"
                value={currentMedication.frequency}
                onChange={handleMedicationInputChange}
                placeholder="e.g., Twice daily, Every 8 hours"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="duration"
                label="Duration"
                value={currentMedication.duration}
                onChange={handleMedicationInputChange}
                placeholder="e.g., 7 days, 2 weeks, 1 month"
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseMedicationDialog} variant="outlined">Cancel</Button>
          <Button 
            onClick={handleAddMedication} 
            variant="contained" 
            color="secondary"
            disabled={!currentMedication.medication_id || !currentMedication.dosage || !currentMedication.frequency}
          >
            Add to Prescription
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Prescription details drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        sx={{
          '& .MuiDrawer-paper': { 
            width: { xs: '100%', sm: 'min(400px, 100%)' },
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
                  <Typography variant="body1" fontWeight="500" mb={1}>{selectedPrescription.patient_name}</Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Date Issued</Typography>
                  <Typography variant="body1" mb={1}>{formatDate(selectedPrescription.date_issued)}</Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Doctor</Typography>
                  <Typography variant="body1" mb={1}>{selectedPrescription.doctor_name}</Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={selectedPrescription.status.charAt(0).toUpperCase() + selectedPrescription.status.slice(1)} 
                    color={selectedPrescription.status === 'pending' ? "warning" : "success"}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                  
                  {selectedPrescription.notes && (
                    <>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                      <Typography variant="body2">{selectedPrescription.notes}</Typography>
                    </>
                  )}
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
                startIcon={<PrintIcon />}
                onClick={() => console.log('Print prescription', selectedPrescription.id)}
              >
                Print
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  handleOpenDialog(selectedPrescription);
                  handleCloseDrawer();
                }}
              >
                Edit
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>
      
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

export default DoctorPrescriptionsPage;