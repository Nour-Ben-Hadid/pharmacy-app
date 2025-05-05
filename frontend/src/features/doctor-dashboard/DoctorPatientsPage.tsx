import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Alert,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Avatar,
  InputAdornment,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  FilterList as FilterIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../app/api/apiClient';
import { format } from 'date-fns';

// Simple patient interface with only the essential fields
interface Patient {
  id: number;
  ssn?: string; // Added SSN field
  name: string;
  date_of_birth: string;
  email?: string;
  contact_info?: string; // Updated from contact_number to contact_info to match backend model
  allergies?: string;
}

interface FilterOptions {
  gender: string;
  hasAllergies: string;
}

const emptyFilterOptions: FilterOptions = {
  gender: '',
  hasAllergies: ''
};

const DoctorPatientsPage: React.FC = () => {
  // Basic states
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // State for dialogs and drawers
  const [filterDialogOpen, setFilterDialogOpen] = useState<boolean>(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState<boolean>(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Filter states
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(emptyFilterOptions);
  const [appliedFilters, setAppliedFilters] = useState<FilterOptions>(emptyFilterOptions);

  // Simple pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const navigate = useNavigate();

  // Fetch patients data from API
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/patients/doctor');
        console.log('API response:', response.data);
        if (response.data && Array.isArray(response.data)) {
          setPatients(response.data);
          setFilteredPatients(response.data);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError('Could not fetch patients from server. Please try again later.');
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Apply search filters
  useEffect(() => {
    let result = [...patients];
    
    // Apply search term filter
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      result = result.filter(patient => 
        (patient.name && patient.name.toLowerCase().includes(lowerCaseSearch)) ||
        (patient.email && patient.email.toLowerCase().includes(lowerCaseSearch)) ||
        (patient.ssn && patient.ssn.includes(lowerCaseSearch))
      );
    }
    
    // Apply allergies filter
    if (appliedFilters.hasAllergies) {
      if (appliedFilters.hasAllergies === 'yes') {
        result = result.filter(patient => 
          patient.allergies && patient.allergies.toLowerCase() !== 'none'
        );
      } else if (appliedFilters.hasAllergies === 'no') {
        result = result.filter(patient => 
          !patient.allergies || patient.allergies.toLowerCase() === 'none'
        );
      }
    }
    
    setFilteredPatients(result);
  }, [searchTerm, appliedFilters, patients]);

  // Pagination handlers
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // View patient details
  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setDetailsDrawerOpen(true);
  };

  // Navigate to patient detail page
  const handleOpenPatientPage = (patientId: number) => {
    navigate(`/doctor-dashboard/patients/${patientId}`);
  };

  // Helper function to calculate age - very simplified
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  // Handler for applying filters
  const handleApplyFilters = () => {
    setAppliedFilters(filterOptions);
    setFilterDialogOpen(false);
    setPage(0); // Reset to first page when applying filters
  };

  // Handler for clearing filters
  const handleClearFilters = () => {
    setFilterOptions(emptyFilterOptions);
    setAppliedFilters(emptyFilterOptions);
    setFilterDialogOpen(false);
    setPage(0); // Reset to first page when clearing filters
  };
  
  // Check if any filters are active
  const hasActiveFilters = () => {
    return appliedFilters.gender !== '' || appliedFilters.hasAllergies !== '';
  };

  return (
    <Box sx={{ p: 0 , width: '100%'}}>
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper' , width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
              My Patients
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

        {/* Search box */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search patients by name, SSN, or email..."
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
              Patient List
            </Typography>
            <Box flexGrow={1} />
            <Typography variant="caption" color="text.secondary">
              Showing {filteredPatients.length} of {patients.length} patients
            </Typography>
          </Box>
          
          <Box sx={{ px: 0, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer className="dashboard-table" sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
              <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Age </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Allergies</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <CircularProgress size={40} sx={{ color: 'primary.main' }} />
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          Loading patients...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : filteredPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
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
                        >
                          <TableCell 
                            onClick={() => handleViewPatient(patient)} 
                            sx={{ 
                              minWidth: '220px',
                              paddingY: 1.5
                            }}
                          >
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              width: '100%'
                            }}>
                              <Avatar 
                                sx={{ 
                                  width: 45,
                                  height: 45,
                                  mr: 2, 
                                  bgcolor: 'primary.main',
                                  flexShrink: 0,
                                  border: '2px solid #e0e0e0'
                                }}
                              >
                                {patient.name ? patient.name.charAt(0).toUpperCase() : '?'}
                              </Avatar>
                              <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                width: 'calc(100% - 65px)'
                              }}>
                                <Box component="span" sx={{ 
                                  fontWeight: 'bold',
                                  fontSize: '0.95rem',
                                  color: '#000000',
                                  display: 'block',
                                  mb: 0.5,
                                  whiteSpace: 'normal',
                                  wordBreak: 'break-word'
                                }}>
                                  {patient.name}
                                </Box>
                                <Box component="span" sx={{
                                  fontSize: '0.75rem',
                                  color: 'text.secondary',
                                  display: 'block'
                                }}>
                                  SSN: {patient.ssn || 'Not available'}
                                </Box>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell onClick={() => handleViewPatient(patient)}>
                            <Typography variant="body2" fontWeight="500">
                              {calculateAge(patient.date_of_birth)} years
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                               {formatDate(patient.date_of_birth)}
                            </Typography>
                          </TableCell>
                          <TableCell onClick={() => handleViewPatient(patient)}>
                            {patient.allergies && patient.allergies.toLowerCase() !== 'none' ? (
                              <Box 
                                sx={{
                                  display: 'inline-block',
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontSize: '0.75rem',
                                  fontWeight: 'medium',
                                  bgcolor: 'rgba(239, 83, 80, 0.1)',
                                  color: '#d32f2f',
                                }}
                              >
                                {patient.allergies}
                              </Box>
                            ) : (
                              <Typography variant="body2" sx={{ 
                                color: 'text.secondary',
                                fontStyle: 'italic'
                              }}>
                                None documented
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell onClick={() => handleViewPatient(patient)}>
                            <Typography variant="body2">
                              {patient.contact_info || 'No contact info'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {patient.email || 'No email'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="View Patient" arrow>
                              <IconButton 
                                size="small"
                                color="primary"
                                onClick={() => handleOpenPatientPage(patient.id)}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit" arrow>
                              <IconButton 
                                size="small"
                                color="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  alert('Edit patient functionality would go here');
                                }}
                                sx={{ ml: 1 }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
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

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Filter Patients
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>              
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="allergies-filter-label">Allergies</InputLabel>
                <Select
                  labelId="allergies-filter-label"
                  value={filterOptions.hasAllergies}
                  onChange={(e) => setFilterOptions({...filterOptions, hasAllergies: e.target.value})}
                  label="Allergies"
                >
                  <MenuItem value="">All Patients</MenuItem>
                  <MenuItem value="yes">With Allergies</MenuItem>
                  <MenuItem value="no">No Allergies</MenuItem>
                </Select>
              </FormControl>
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
      
      {/* Patient Details Drawer */}
      <Drawer
        anchor="right"
        open={detailsDrawerOpen}
        onClose={() => setDetailsDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': { 
            width: { xs: '100%', sm: 'min(400px, 100%)' },
            padding: 2
          },
        }}
      >
        {selectedPatient && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Patient Details</Typography>
              <IconButton onClick={() => setDetailsDrawerOpen(false)} edge="end">
                <CloseIcon />
              </IconButton>
            </Box>
            
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar 
                  sx={{ 
                    width: 64, 
                    height: 64, 
                    mr: 2, 
                    bgcolor: 'primary.main',
                    fontSize: '2rem'
                  }}
                >
                  {selectedPatient.name ? selectedPatient.name.charAt(0) : '?'}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {selectedPatient.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    SSN: {selectedPatient.ssn || 'Not available'}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Age</Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {calculateAge(selectedPatient.date_of_birth)} years
                  </Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Date of Birth</Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {formatDate(selectedPatient.date_of_birth)}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Allergies</Typography>
                  {selectedPatient.allergies && selectedPatient.allergies.toLowerCase() !== 'none' ? (
                    <Chip 
                      label={selectedPatient.allergies}
                      color="error"
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                      None documented
                    </Typography>
                  )}
                </CardContent>
              </Card>
              
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Contact Information</Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {selectedPatient.contact_info || 'No contact information available'}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">
                    {selectedPatient.email || 'No email available'}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', pt: 1.5, borderTop: '1px solid rgba(0,0,0,0.12)' }}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => alert('Edit patient functionality would go here')}
              >
                Edit
              </Button>
              <Button
                variant="contained"
                onClick={() => handleOpenPatientPage(selectedPatient.id)}
              >
                View Full Profile
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default DoctorPatientsPage;