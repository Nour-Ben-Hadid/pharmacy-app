import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
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
  Divider,
  Drawer,
  Card,
  CardContent
} from '@mui/material';
import {
  Search as SearchIcon,
  MedicalServices as MedicationIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import apiClient from '../../app/api/apiClient';
import { format, parseISO } from 'date-fns';

interface Medication {
  id: number;
  name: string;
  description: string | null;
  dosage_form: string;
  strength: string;
  stock_quantity: number;
  price: number;
}

interface PrescriptionMedication {
  id: number;
  prescription_id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  medication?: Medication; // Optional detailed medication info
}

const PatientMedicationsPage: React.FC = () => {
  // State for medications data
  const [medications, setMedications] = useState<PrescriptionMedication[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<PrescriptionMedication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
  const [currentMedication, setCurrentMedication] = useState<PrescriptionMedication | null>(null);
  const [medicationDetails, setMedicationDetails] = useState<Medication | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // Fetch medications on component mount
  useEffect(() => {
    fetchPatientMedications();
  }, []);

  // Filter medications when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMedications(medications);
    } else {
      const filtered = medications.filter(medication => 
        medication.medication_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medication.dosage.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medication.frequency.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMedications(filtered);
    }
  }, [searchTerm, medications]);

  // Fetch all patient medications from API
  const fetchPatientMedications = async () => {
    setLoading(true);
    try {
      // This endpoint would need to be implemented in your API
      const response = await apiClient.get('/prescriptions/patient');
      
      // Extract all medications from all prescriptions
      const allMedications: PrescriptionMedication[] = [];
      response.data.forEach((prescription: any) => {
        if (prescription.medications && Array.isArray(prescription.medications)) {
          prescription.medications.forEach((med: PrescriptionMedication) => {
            // Add the prescription status to each medication
            allMedications.push({
              ...med,
              prescription_status: prescription.status
            });
          });
        }
      });
      
      setMedications(allMedications);
      setFilteredMedications(allMedications);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching medications:', err);
      
      let errorMessage = 'Failed to fetch medications. Please try again later.';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Authentication error: Please login to view your medications.';
        } else if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch medication details
  const fetchMedicationDetails = async (medication: PrescriptionMedication) => {
    setLoadingDetails(true);
    try {
      // Fetch detailed medication info by name
      const response = await apiClient.get(`/medications/by-name/${medication.medication_name}`);
      setMedicationDetails(response.data);
    } catch (err: any) {
      console.error('Error fetching medication details:', err);
      
      let errorMessage = 'Failed to fetch medication details.';
      
      if (err.response && err.response.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      
      setMedicationDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handler for opening drawer
  const handleOpenDrawer = (medication: PrescriptionMedication) => {
    setCurrentMedication(medication);
    setMedicationDetails(null); // Reset details when opening drawer
    setDrawerOpen(true);
    fetchMedicationDetails(medication); // Fetch detailed info
  };

  // Handler for closing drawer
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => {
      setCurrentMedication(null);
      setMedicationDetails(null);
    }, 300); // Clear after animation finishes
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

  return (
    <Box sx={{ p: 0 }}>
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <MedicationIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
              My Medications
            </Typography>
          </Box>
        </Box>

        {/* Search */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search medications by name, dosage, or frequency..."
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
        
        {/* Medications table */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', height: '100%', boxShadow: 2 }}>
          <Box className="table-header" sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: 'background.default' }}>
            <MedicationIcon className="table-header-icon" fontSize="medium" sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="600">
              Prescribed Medications
            </Typography>
            <Box flexGrow={1} />
          </Box>
          
          <Box sx={{ px: 2, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer className="dashboard-table" sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
              <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Medication</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Dosage</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Frequency</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <CircularProgress size={40} />
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          Loading medications...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : filteredMedications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography variant="body1">
                          No medications found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMedications
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((medication) => (
                        <TableRow 
                          key={medication.id} 
                          hover 
                          sx={{ cursor: 'pointer' }}
                          onClick={() => handleOpenDrawer(medication)}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight="500">
                              {medication.medication_name}
                            </Typography>
                          </TableCell>
                          <TableCell>{medication.dosage}</TableCell>
                          <TableCell>{medication.frequency}</TableCell>
                          <TableCell>{medication.duration}</TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              color="info"
                              endIcon={<VisibilityIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDrawer(medication);
                              }}
                            >
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  }
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredMedications.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </TableContainer>
          </Box>
        </Paper>
      </Paper>
      
      {/* Medication Details Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        variant="temporary"
        elevation={16}
        ModalProps={{
          keepMounted: true, // Better performance on mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'block' },
          '& .MuiDrawer-paper': { 
            position: 'fixed',
            width: { xs: '100%', sm: 400 },
            boxSizing: 'border-box',
            padding: 2,
            right: 0,
          },
        }}
      >
        {currentMedication && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Medication Details</Typography>
              <IconButton onClick={handleCloseDrawer} edge="end">
                <CloseIcon />
              </IconButton>
            </Box>
            
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {/* Prescription Details */}
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Prescription Information</Typography>
                  <Typography variant="body1" fontWeight="500" mb={1}>
                    {currentMedication.medication_name}
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Dosage</Typography>
                      <Typography variant="body2">{currentMedication.dosage}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Frequency</Typography>
                      <Typography variant="body2">{currentMedication.frequency}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Duration</Typography>
                      <Typography variant="body2">{currentMedication.duration}</Typography>
                    </Grid>
                    {currentMedication.prescription_status && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">Status</Typography>
                        <Chip 
                          label={currentMedication.prescription_status} 
                          color={
                            currentMedication.prescription_status === "fulfilled" 
                              ? "success" 
                              : currentMedication.prescription_status === "pending" 
                                ? "warning" 
                                : "error"
                          }
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
              
              {/* Medication Details */}
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Detailed Information</Typography>
                  
                  {loadingDetails ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                      <CircularProgress size={30} />
                    </Box>
                  ) : !medicationDetails ? (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Detailed information not available.
                    </Typography>
                  ) : (
                    <>
                      <Typography variant="body1" fontWeight="500" mb={1}>
                        {medicationDetails.name}
                      </Typography>
                      
                      {medicationDetails.description && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary">Description</Typography>
                          <Typography variant="body2">{medicationDetails.description}</Typography>
                        </Box>
                      )}
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Form</Typography>
                          <Typography variant="body2">{medicationDetails.dosage_form}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Strength</Typography>
                          <Typography variant="body2">{medicationDetails.strength}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">In Stock</Typography>
                          <Typography variant="body2">
                            {medicationDetails.stock_quantity > 0 ? 'Yes' : 'No'} 
                            ({medicationDetails.stock_quantity} units)
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Price</Typography>
                          <Typography variant="body2">${medicationDetails.price.toFixed(2)}</Typography>
                        </Grid>
                      </Grid>
                    </>
                  )}
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

export default PatientMedicationsPage;