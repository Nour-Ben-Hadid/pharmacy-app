import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Snackbar,
  Drawer,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  LocalPharmacy as PharmacyIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import apiClient from '../../app/api/apiClient';

// Interface for medication data
interface Medication {
  id: number;
  name: string;
  description: string | null;
  dosage_form: string;
  strength: string;
  stock_quantity: number;
  price: number;
  manufacturer?: string;
}

const PatientMedicationsPage: React.FC = () => {
  // State for medications data
  const [medications, setMedications] = useState<Medication[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);

  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State for dialogs and drawer
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState<boolean>(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState<boolean>(false);
  
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dosageFormFilter, setDosageFormFilter] = useState<string>('');
  
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

  // Fetch medications on component mount
  useEffect(() => {
    fetchMedications();
  }, []);

  // Apply filters when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMedications(medications);
    } else {
      const lowerCaseSearch = searchTerm.toLowerCase();
      const filtered = medications.filter(
        med => 
          med.name.toLowerCase().includes(lowerCaseSearch) || 
          (med.description && med.description.toLowerCase().includes(lowerCaseSearch)) ||
          med.dosage_form.toLowerCase().includes(lowerCaseSearch) ||
          med.strength.toLowerCase().includes(lowerCaseSearch)
      );
      setFilteredMedications(filtered);
    }
  }, [searchTerm, medications]);

  // Apply dosage form filter
  useEffect(() => {
    if (dosageFormFilter === '') {
      // If no filter, show all medications (but still respect search term)
      if (searchTerm.trim() === '') {
        setFilteredMedications(medications);
      } else {
        const lowerCaseSearch = searchTerm.toLowerCase();
        const filtered = medications.filter(
          med => 
            med.name.toLowerCase().includes(lowerCaseSearch) || 
            (med.description && med.description.toLowerCase().includes(lowerCaseSearch))
        );
        setFilteredMedications(filtered);
      }
    } else {
      // Apply dosage form filter (and respect search term)
      let filtered = medications.filter(med => med.dosage_form === dosageFormFilter);
      
      // Also apply search if necessary
      if (searchTerm.trim() !== '') {
        const lowerCaseSearch = searchTerm.toLowerCase();
        filtered = filtered.filter(
          med => 
            med.name.toLowerCase().includes(lowerCaseSearch) || 
            (med.description && med.description.toLowerCase().includes(lowerCaseSearch))
        );
      }
      
      setFilteredMedications(filtered);
    }
  }, [dosageFormFilter, searchTerm, medications]);

  // Fetch medications from API
  const fetchMedications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/medications');
      setMedications(response.data);
      setFilteredMedications(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching medications:', err);
      setError('Failed to fetch medications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Extract unique dosage forms for the filter
  const dosageForms = Array.from(new Set(medications.map(med => med.dosage_form)));

  // Handler for viewing medication details
  const handleViewDetails = (medication: Medication) => {
    setSelectedMedication(medication);
    setDetailsDrawerOpen(true);
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

  // Calculate if there are any active filters
  const hasActiveFilters = () => {
    return dosageFormFilter !== '';
  };

  // Handler for applying dosage form filter
  const handleDosageFormChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setDosageFormFilter(event.target.value as string);
    setPage(0); // Reset to first page when applying filters
  };

  // Handler for clearing filters
  const handleClearFilters = () => {
    setDosageFormFilter('');
    setFilterDialogOpen(false);
    setPage(0); // Reset to first page when clearing filters
  };

  return (
    <Box sx={{ p: 0, width: '100%' }}>
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper', width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PharmacyIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
              Available Medications
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
            placeholder="Search medications by name, description, dosage form, or strength..."
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
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', height: '100%', boxShadow: 2, width: '100%' }}>
          <Box className="table-header" sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: 'background.default' }}>
            <PharmacyIcon className="table-header-icon" fontSize="medium" sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="600">
              Pharmacy Inventory
            </Typography>
            <Box flexGrow={1} />
            <Typography variant="caption" color="text.secondary">
              Showing {filteredMedications.length} of {medications.length} medications
            </Typography>
          </Box>
          
          <Box sx={{ px: 0, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer className="dashboard-table" sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
              <Table size="medium" sx={{ width: '100%', tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow >
                    <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Dosage Form</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Strength</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Price</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Availability</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <CircularProgress size={40} />
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          Loading medications...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : filteredMedications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <Typography variant="body1">
                          No medications found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMedications
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((medication) => (
                        <TableRow key={medication.id} hover sx={{ cursor: 'pointer' }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {medication.name}
                            </Typography>
                            
                          </TableCell>
                          <TableCell>{medication.dosage_form}</TableCell>
                          <TableCell>{medication.strength}</TableCell>
                          <TableCell>{medication.price.toFixed(2)} Dt</TableCell>
                          <TableCell>
                            {medication.stock_quantity > 50 ? (
                              <Box 
                                sx={{
                                  display: 'inline-block',
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontSize: '0.75rem',
                                  fontWeight: 'medium',
                                  bgcolor: 'rgba(76, 175, 80, 0.1)',
                                  color: '#2e7d32',
                                }}
                              >
                                In Stock
                              </Box>
                            ) : medication.stock_quantity > 10 ? (
                              <Box 
                                sx={{
                                  display: 'inline-block',
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontSize: '0.75rem',
                                  fontWeight: 'medium',
                                  bgcolor: 'rgba(255, 167, 38, 0.1)',
                                  color: '#ed6c02',
                                }}
                              >
                                Limited Stock
                              </Box>
                            ) : (
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
                                Low Stock
                              </Box>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleViewDetails(medication)}
                            >
                              View Details
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
        open={detailsDrawerOpen}
        onClose={() => setDetailsDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: '100%', maxWidth: 450, p: 0 } }}
      >
        {selectedMedication && (
          <>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              bgcolor: 'primary.main', 
              color: 'white',
              p: 2
            }}>
              <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                Medication Details
              </Typography>
              <IconButton 
                edge="end" 
                color="inherit" 
                onClick={() => setDetailsDrawerOpen(false)}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Box sx={{ p: 3, height: '100%', overflowY: 'auto' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                {selectedMedication.name}
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Dosage Form</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 2 }}>
                    {selectedMedication.dosage_form}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Strength</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 2 }}>
                    {selectedMedication.strength}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Price</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 2 }}>
                    {selectedMedication.price.toFixed(2)} Dt
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Stock Status</Typography>
                  <Box sx={{ mb: 2 }}>
                    {selectedMedication.stock_quantity > 50 ? (
                      <Chip label="In Stock" color="success" />
                    ) : selectedMedication.stock_quantity > 10 ? (
                      <Chip label="Limited Stock" color="warning" />
                    ) : (
                      <Chip label="Low Stock" color="error" />
                    )}
                  </Box>
                </Grid>

                {selectedMedication.manufacturer && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Manufacturer</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 2 }}>
                      {selectedMedication.manufacturer}
                    </Typography>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {selectedMedication.description || "No description available for this medication."}
                  </Typography>
                </Grid>

                
              </Grid>
            </Box>
          </>
        )}
      </Drawer>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Filter Medications
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>              
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="dosage-form-select-label">Dosage Form</InputLabel>
                <Select
                  labelId="dosage-form-select-label"
                  value={dosageFormFilter}
                  onChange={(e) => setDosageFormFilter(e.target.value as string)}
                  label="Dosage Form"
                >
                  <MenuItem value="">
                    <em>All Dosage Forms</em>
                  </MenuItem>
                  {dosageForms.map((form, index) => (
                    <MenuItem key={index} value={form}>{form}</MenuItem>
                  ))}
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
            Close
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
    </Box>
  );
};

export default PatientMedicationsPage;