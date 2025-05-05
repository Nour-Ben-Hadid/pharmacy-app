import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import apiClient from '../../app/api/apiClient';

interface Patient {
  id: number;
  name: string;
  ssn: string;
  date_of_birth: string;
  contact_info: string;
  allergies: string | null;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

interface PatientProfileEditorProps {
  patient: Patient;
  open: boolean;
  onClose: () => void;
  onSave: (updatedPatient: Patient) => void;
}

const PatientProfileEditor: React.FC<PatientProfileEditorProps> = ({
  patient,
  open,
  onClose,
  onSave,
}) => {
  const [allergies, setAllergies] = useState<string>(patient.allergies || '');
  const [contactInfo, setContactInfo] = useState<string>(patient.contact_info || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await apiClient.patch(`/patients/${patient.ssn}`, {
        allergies: allergies.trim() || null,
        contact_info: contactInfo.trim()
      });

      if (response.data) {
        setSuccess(true);
        // Return the updated patient data
        onSave({
          ...patient,
          allergies: allergies.trim() || null,
          contact_info: contactInfo.trim(),
          updated_at: new Date().toISOString()
        });

        // Close the dialog after a short delay to show success message
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error updating patient profile:', err);
      setError(err.response?.data?.detail || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Update Your Profile</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Profile updated successfully!
            </Alert>
          )}
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Contact Information
            </Typography>
            <TextField
              fullWidth
              label="Contact Information"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              required
              disabled={loading}
              multiline
              rows={2}
              placeholder="Phone number, address, or other contact details"
              helperText="Your primary contact information for healthcare providers"
            />
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Allergies
            </Typography>
            <TextField
              fullWidth
              label="Allergies"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              disabled={loading}
              multiline
              rows={3}
              placeholder="List any known allergies or sensitivities"
              helperText="Leave blank if no known allergies"
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={onClose}
            disabled={loading}
            startIcon={<CloseIcon />}
            color="inherit"
          >
            Close
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PatientProfileEditor;