import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Card,
  CardContent,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  LocalHospital as MedicationIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Info as InfoIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import apiClient from '../../app/api/apiClient';
import { useNavigate } from 'react-router-dom';

interface Medication {
  id: number;
  name: string;
  dosage_form: string;
  strength: string;
  manufacturer: string;
  description: string;
  stock_level: number;
  category: string;
  requires_prescription: boolean;
}

const PatientMedicationsPage: React.FC = () => {
  // State for medications data
  const [medications, setMedications] = useState<Medication[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPrescription, setFilterPrescription] = useState<string>('all');
  
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
    fetchMedications();
  }, []);
  
  // Filter medications when search term or filters change
  useEffect(() => {
    if (searchTerm.trim() === '' && filterCategory === 'all' && filterPrescription === 'all') {
      setFilteredMedications(medications);
      return;
    }
    
    let filtered = [...medications];
    
    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(m => m.category === filterCategory);
    }
    
    // Filter by prescription requirement
    if (filterPrescription !== 'all') {
      const requiresPrescription = filterPrescription === 'yes';
      filtered = filtered.filter(m => m.requires_prescription === requiresPrescription);
    }
    
    // Filter by search term
    if (searchTerm.trim() !== '') {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(searchTermLower) ||
        m.manufacturer.toLowerCase().includes(searchTermLower) ||
        m.description.toLowerCase().includes(searchTermLower)
      );
    }
    
    setFilteredMedications(filtered);
  }, [searchTerm, filterCategory, filterPrescription, medications]);
  
  // Fetch medications from API
  const fetchMedications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/medications');
      console.log('Fetched medications:', response.data);
      setMedications(response.data);
      setFilteredMedications(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching medications:', err);
      setError('Failed to fetch medications. Please try again later.');
      setMedications([]);
      setFilteredMedications([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Get unique categories from medications
  const getCategories = () => {
    const categories = new Set<string>();
    medications.forEach(med => {
      if (med.category) {
        categories.add(med.category);
      }
    });
    return Array.from(categories).sort();
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
  
  // Get stock level indication color
  const getStockLevelColor = (stockLevel: number) => {
    if (stockLevel > 100) return '#4caf50'; // High stock - green
    if (stockLevel > 50) return '#ff9800'; // Medium stock - orange
    return '#f44336'; // Low stock - red
  };
  
  // Format stock level status
  const getStockLevelStatus = (stockLevel: number) => {
    if (stockLevel > 100) return 'High';
    if (stockLevel > 50) return 'Medium';
    return 'Low';
  };

  return (
    <Box sx={{ p: 0 }}>
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <MedicationIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
              Medications Database
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/doctor-dashboard')}
          >
            Back to Dashboard
          </Button>
        </Box>

        {/* Search and filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search medications by name, manufacturer, or description..."
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
              <InputLabel id="category-filter-label">Category</InputLabel>
              <Select
                labelId="category-filter-label"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                {getCategories().map((category) => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="prescription-filter-label">Prescription Required</InputLabel>
              <Select
                labelId="prescription-filter-label"
                value={filterPrescription}
                onChange={(e) => setFilterPrescription(e.target.value)}
                label="Prescription Required"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="yes">Required</MenuItem>
                <MenuItem value="no">Not Required</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
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
              Medications List
            </Typography>
            <Box flexGrow={1} />
            <Typography variant="caption" color="text.secondary">
              Showing {filteredMedications.length} of {medications.length} medications
            </Typography>
          </Box>
          
          <Box sx={{ px: 2, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer className="doctor-table">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Dosage Form</TableCell>
                    <TableCell>Strength</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Prescription Required</TableCell>
                    <TableCell>Stock Level</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <CircularProgress size={40} sx={{ color: 'primary.main' }} />
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          Loading medications...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : filteredMedications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <Typography variant="body1">
                          No medications found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMedications
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((medication) => (
                        <TableRow key={medication.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {medication.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {medication.manufacturer}
                            </Typography>
                          </TableCell>
                          <TableCell>{medication.dosage_form}</TableCell>
                          <TableCell>{medication.strength}</TableCell>
                          <TableCell>
                            <Chip 
                              label={medication.category} 
                              size="small" 
                              color="primary" 
                              variant="outlined" 
                            />
                          </TableCell>
                          <TableCell>
                            {medication.requires_prescription ? (
                              <Chip 
                                label="Required" 
                                size="small" 
                                color="warning"
                              />
                            ) : (
                              <Chip 
                                label="Not Required" 
                                size="small" 
                                color="success"
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box 
                                sx={{ 
                                  width: 12, 
                                  height: 12, 
                                  borderRadius: '50%', 
                                  bgcolor: getStockLevelColor(medication.stock_level),
                                  mr: 1
                                }} 
                              />
                              <Typography variant="body2">
                                {medication.stock_level} ({getStockLevelStatus(medication.stock_level)})
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={medication.description}>
                              <IconButton size="small" color="info">
                                <InfoIcon />
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