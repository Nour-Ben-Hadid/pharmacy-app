import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
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
  Divider,
  Drawer,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  LocalPharmacy as PharmacyIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import apiClient from '../../app/api/apiClient';

interface Medication {
  id: number;
  name: string;
  description: string;
  dosage_form: string;
  strength: string;
  manufacturer: string;
  price: number;
  stock_quantity: number; // Changed from quantity_in_stock to match backend
}

const emptyMedication: Medication = {
  id: 0,
  name: '',
  description: '',
  dosage_form: '',
  strength: '',
  manufacturer: '',
  price: 0,
  stock_quantity: 0 // Changed from quantity_in_stock to match backend
};

const MedicationsPage: React.FC = () => {
  // State for medications data
  const [medications, setMedications] = useState<Medication[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // State for medication dialog
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [currentMedication, setCurrentMedication] = useState<Medication>(emptyMedication);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
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

  // Fetch medications on component mount
  useEffect(() => {
    fetchMedications();
  }, []);

  // Filter medications when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMedications(medications);
    } else {
      const searchTermLower = searchTerm.toLowerCase();
      const filtered = medications.filter(med => 
        (med.name && med.name.toLowerCase().includes(searchTermLower)) ||
        (med.description && med.description.toLowerCase().includes(searchTermLower)) ||
        (med.manufacturer && med.manufacturer.toLowerCase().includes(searchTermLower)) ||
        (med.dosage_form && med.dosage_form.toLowerCase().includes(searchTermLower)) ||
        (med.strength && med.strength.toLowerCase().includes(searchTermLower))
      );
      setFilteredMedications(filtered);
    }
  }, [searchTerm, medications]);

  // Fetch all medications from API
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

  // Handler for opening dialog
  const handleOpenDialog = (medication?: Medication) => {
    if (medication) {
      setCurrentMedication(medication);
      setIsEditing(true);
    } else {
      setCurrentMedication(emptyMedication);
      setIsEditing(false);
    }
    setDialogOpen(true);
  };

  // Handler for closing dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Handler for medication input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Convert number fields
    if (name === 'price' || name === 'stock_quantity') { // Changed from quantity_in_stock
      const numValue = name === 'price' ? parseFloat(value) : parseInt(value, 10);
      setCurrentMedication({
        ...currentMedication,
        [name]: isNaN(numValue) ? 0 : numValue
      });
    } else {
      setCurrentMedication({
        ...currentMedication,
        [name]: value
      });
    }
  };

  // Handler for saving medication (create or update)
  const handleSaveMedication = async () => {
    try {
      if (isEditing) {
        // Update existing medication - using PATCH instead of PUT to match backend
        await apiClient.patch(`/medications/${currentMedication.id}`, currentMedication);
        setNotification({
          open: true,
          message: 'Medication updated successfully!',
          severity: 'success'
        });
      } else {
        // Create new medication
        await apiClient.post('/medications', currentMedication);
        setNotification({
          open: true,
          message: 'Medication added successfully!',
          severity: 'success'
        });
      }
      
      // Refresh medication list
      fetchMedications();
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error saving medication:', err);
      // Show more specific error message based on response
      let errorMessage = 'Failed to save medication. Please try again.';
      
      // Prevent redirect on auth errors
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Authentication error: Please login again as a pharmacist.';
          // We won't redirect automatically - just show the error message
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
      // Don't close the dialog so the user doesn't lose their form data
    }
  };

  // Handler for deleting medication
  const handleDeleteMedication = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this medication?')) {
      try {
        await apiClient.delete(`/medications/${id}`);
        
        setNotification({
          open: true,
          message: 'Medication deleted successfully!',
          severity: 'success'
        });
        
        // Refresh medication list
        fetchMedications();
      } catch (err: any) {
        console.error('Error deleting medication:', err);
        
        // Show more specific error message based on response
        let errorMessage = 'Failed to delete medication. Please try again.';
        
        if (err.response) {
          if (err.response.status === 401) {
            errorMessage = 'Authentication error: Please login again as a pharmacist.';
            // We won't redirect automatically
          } else if (err.response.status === 403) {
            errorMessage = 'You do not have permission to delete medications.';
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

  // Handler for opening drawer
  const handleOpenDrawer = (medication: Medication) => {
    setCurrentMedication(medication);
    setDrawerOpen(true);
  };

  // Handler for closing drawer
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  return (
    <Box sx={{ p: 0 }}>
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PharmacyIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
              Medications
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ 
              bgcolor: 'secondary.main',
              '&:hover': { bgcolor: 'secondary.dark' }
            }}
          >
            Add Medication
          </Button>
        </Box>

        {/* Search and filters */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search medications by name, description or manufacturer..."
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
            <PharmacyIcon className="table-header-icon" fontSize="medium" sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="600">
              Medications List
            </Typography>
            <Box flexGrow={1} />
          </Box>
          
          <Box sx={{ px: 2, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer className="dashboard-table" sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
              <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Dosage Form</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Strength</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Price</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Stock</TableCell>
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
                            <Typography variant="body2" fontWeight="500">
                              {medication.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {medication.manufacturer}
                            </Typography>
                          </TableCell>
                          <TableCell>{medication.dosage_form}</TableCell>
                          <TableCell>{medication.strength}</TableCell>
                          <TableCell>{medication.price.toFixed(2)} Dt</TableCell>
                          <TableCell>
                            <Box 
                              sx={{
                                display: 'inline-block',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1,
                                fontSize: '0.75rem',
                                fontWeight: 'medium',
                                bgcolor: medication.stock_quantity > 10 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 167, 38, 0.1)',
                                color: medication.stock_quantity > 10 ? '#2e7d32' : '#ed6c02',
                              }}
                            >
                              {medication.stock_quantity}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => handleOpenDialog(medication)}
                              sx={{ mr: 1 }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleDeleteMedication(medication.id)}
                            >
                              Delete
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="info"
                              onClick={() => handleOpenDrawer(medication)}
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

      {/* Medication form dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          {isEditing ? 'Edit Medication' : 'Add New Medication'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="name"
                label="Medication Name"
                value={currentMedication.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="dosage_form"
                label="Dosage Form"
                value={currentMedication.dosage_form}
                onChange={handleInputChange}
                placeholder="e.g., Tablet, Capsule, Liquid"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="strength"
                label="Strength"
                value={currentMedication.strength}
                onChange={handleInputChange}
                placeholder="e.g., 500mg, 50mcg"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="description"
                label="Description"
                value={currentMedication.description}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="manufacturer"
                label="Manufacturer"
                value={currentMedication.manufacturer}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                name="price"
                label="Price "
                value={currentMedication.price}
                onChange={handleInputChange}
                inputProps={{ step: "0.01", min: "0" }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                name="stock_quantity" // Changed from quantity_in_stock
                label="Quantity in Stock"
                value={currentMedication.stock_quantity} // Changed from quantity_in_stock
                onChange={handleInputChange}
                inputProps={{ min: "0" }}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDialog} variant="outlined">Cancel</Button>
          <Button 
            onClick={handleSaveMedication} 
            variant="contained" 
            color="primary"
            disabled={!currentMedication.name || !currentMedication.dosage_form || !currentMedication.strength}
          >
            {isEditing ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Medication details drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            width: '100%',
            maxWidth: 400,
            bgcolor: 'background.paper',
            borderLeft: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PharmacyIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
            <Typography variant="h6" component="h2" sx={{ fontWeight: 'medium', color: 'primary.dark' }}>
              Medication Details
            </Typography>
            <Box flexGrow={1} />
            <IconButton onClick={handleCloseDrawer} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Medication details content */}
          <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="500" gutterBottom>
                  {currentMedication.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {currentMedication.description}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Dosage Form:
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  {currentMedication.dosage_form}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Strength:
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  {currentMedication.strength}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Manufacturer:
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  {currentMedication.manufacturer}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Price:
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  {currentMedication.price.toFixed(2)} Dt
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Stock Quantity:
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  {currentMedication.stock_quantity}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenDialog(currentMedication)}
            sx={{ mt: 2 }}
          >
            Edit Medication
          </Button>
        </Box>
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

export default MedicationsPage;