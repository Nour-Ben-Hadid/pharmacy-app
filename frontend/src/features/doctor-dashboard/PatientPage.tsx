import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Grid,
  Typography,
  Paper,
  Button,
  Tabs,
  Tab,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  Stack,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  MedicalServices as MedicalIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  EventNote as EventIcon,
  Assignment as AssignmentOutlinedIcon,
  Add as AddIcon,
  MedicalInformation as MedicalInfoIcon,
  NoteAdd as NoteAddIcon,
  History as HistoryIcon,
  Bloodtype as BloodtypeIcon,
  NotificationImportant as AllergiesIcon,
  Close as CloseIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import apiClient from '../../app/api/apiClient';
import { format, differenceInYears } from 'date-fns';

// Interface definitions
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

interface Prescription {
  id: number;
  patient_id: number;
  patient_name: string;
  doctor_id: number;
  doctor_name: string;
  date_issued: string;
  status: string;
  notes?: string;
  medications: PrescriptionMedication[];
}

interface PrescriptionMedication {
  medication_id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface MedicalRecord {
  id: number;
  patient_id: number;
  date: string;
  diagnosis: string;
  treatment: string;
  doctor_name: string;
  notes?: string;
}

interface AppointmentRecord {
  id: number;
  patient_id: number;
  patient_name: string;
  doctor_id: number;
  doctor_name: string;
  date_time: string;
  status: string;
  type: string;
  notes?: string;
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
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const PatientPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  // State variables
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  
  // Medical record dialog state
  const [recordDialogOpen, setRecordDialogOpen] = useState<boolean>(false);
  const [currentRecord, setCurrentRecord] = useState<MedicalRecord>({
    id: 0,
    patient_id: Number(id) || 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    diagnosis: '',
    treatment: '',
    doctor_name: '', // Will be filled from current user
    notes: ''
  });
  const [isEditingRecord, setIsEditingRecord] = useState<boolean>(false);
  
  // Appointment dialog state
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState<boolean>(false);
  const [currentAppointment, setCurrentAppointment] = useState<AppointmentRecord>({
    id: 0,
    patient_id: Number(id) || 0,
    patient_name: '',
    doctor_id: 0,
    doctor_name: '',
    date_time: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    status: 'scheduled',
    type: 'check-up',
    notes: ''
  });
  const [isEditingAppointment, setIsEditingAppointment] = useState<boolean>(false);
  
  // Patient edit dialog state
  const [patientDialogOpen, setPatientDialogOpen] = useState<boolean>(false);
  const [editablePatient, setEditablePatient] = useState<Patient | null>(null);
  
  // Notification state
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Tab change handler
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Fetch patient data
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching patient with ID:', id);
        const response = await apiClient.get(`/patients/${id}`);
        console.log('Patient data received:', response.data);
        setPatient(response.data);
        setEditablePatient(response.data);
      } catch (err) {
        console.error('Error fetching patient:', err);
        setError('Failed to fetch patient data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [id]);

  // Fetch prescriptions
  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (!id) return;
      
      try {
        const response = await apiClient.get(`/prescriptions/patient/${id}`);
        setPrescriptions(response.data);
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
        
        // Mock data for development
        const mockPrescriptions = [
          {
            id: 1,
            patient_id: Number(id),
            patient_name: 'John Smith',
            doctor_id: 1,
            doctor_name: 'Dr. Michael Johnson',
            date_issued: '2025-04-28',
            status: 'fulfilled',
            notes: 'Take medication after meals.',
            medications: [
              {
                medication_id: 1,
                medication_name: 'Amoxicillin',
                dosage: '500mg',
                frequency: 'Three times daily',
                duration: '7 days'
              }
            ]
          },
          {
            id: 2,
            patient_id: Number(id),
            patient_name: 'John Smith',
            doctor_id: 1,
            doctor_name: 'Dr. Michael Johnson',
            date_issued: '2025-03-15',
            status: 'fulfilled',
            notes: 'Patient allergic to penicillin.',
            medications: [
              {
                medication_id: 2,
                medication_name: 'Atorvastatin',
                dosage: '20mg',
                frequency: 'Once daily',
                duration: '30 days'
              }
            ]
          }
        ];
        
        setPrescriptions(mockPrescriptions);
      }
    };

    fetchPrescriptions();
  }, [id]);

  // Fetch medical records
  useEffect(() => {
    const fetchMedicalRecords = async () => {
      if (!id) return;
      
      try {
        const response = await apiClient.get(`/medical-records/patient/${id}`);
        setMedicalRecords(response.data);
      } catch (err) {
        console.error('Error fetching medical records:', err);
        
        // Mock data for development
        const mockRecords = [
          {
            id: 1,
            patient_id: Number(id),
            date: '2025-04-28',
            diagnosis: 'Hypertension',
            treatment: 'Prescribed Lisinopril 10mg daily',
            doctor_name: 'Dr. Michael Johnson',
            notes: 'Blood pressure: 150/90. Follow up in 2 weeks.'
          },
          {
            id: 2,
            patient_id: Number(id),
            date: '2025-03-15',
            diagnosis: 'Upper respiratory infection',
            treatment: 'Prescribed Amoxicillin 500mg, rest, fluids',
            doctor_name: 'Dr. Michael Johnson',
            notes: 'Fever, sore throat, cough. Temperature: 100.4°F.'
          },
          {
            id: 3,
            patient_id: Number(id),
            date: '2025-01-10',
            diagnosis: 'Annual physical examination',
            treatment: 'No treatment needed. All vitals normal.',
            doctor_name: 'Dr. Michael Johnson',
            notes: 'Heart rate: 72, BP: 120/80, Weight: 180lbs'
          }
        ];
        
        setMedicalRecords(mockRecords);
      }
    };

    fetchMedicalRecords();
  }, [id]);
  
  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!id) return;
      
      try {
        const response = await apiClient.get(`/appointments/patient/${id}`);
        setAppointments(response.data);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        
        // Mock data for development
        const mockAppointments = [
          {
            id: 1,
            patient_id: Number(id),
            patient_name: 'John Smith',
            doctor_id: 1,
            doctor_name: 'Dr. Michael Johnson',
            date_time: '2025-05-15T10:30:00',
            status: 'scheduled',
            type: 'follow-up',
            notes: 'Follow up on hypertension treatment'
          },
          {
            id: 2,
            patient_id: Number(id),
            patient_name: 'John Smith',
            doctor_id: 1,
            doctor_name: 'Dr. Michael Johnson',
            date_time: '2025-04-28T09:00:00',
            status: 'completed',
            type: 'check-up',
            notes: 'Regular check-up appointment'
          }
        ];
        
        setAppointments(mockAppointments);
      }
    };

    fetchAppointments();
  }, [id]);

  // Handler for updating patient data
  const handleUpdatePatient = async () => {
    if (!editablePatient) return;
    
    try {
      await apiClient.patch(`/patients/${editablePatient.id}`, editablePatient);
      
      setNotification({
        open: true,
        message: 'Patient information updated successfully',
        severity: 'success'
      });
      
      setPatient(editablePatient);
      setPatientDialogOpen(false);
    } catch (err) {
      console.error('Error updating patient:', err);
      
      setNotification({
        open: true,
        message: 'Failed to update patient information',
        severity: 'error'
      });
    }
  };
  
  // Handler for patient input changes
  const handlePatientInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editablePatient) return;
    
    const { name, value } = e.target;
    setEditablePatient({
      ...editablePatient,
      [name]: value
    });
  };
  
  // Handler for gender selection change
  const handleGenderChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    if (!editablePatient) return;
    
    setEditablePatient({
      ...editablePatient,
      gender: e.target.value as string
    });
  };
  
  // Handler for opening medical record form
  const handleOpenRecordDialog = (record?: MedicalRecord) => {
    if (record) {
      setCurrentRecord(record);
      setIsEditingRecord(true);
    } else {
      setCurrentRecord({
        id: 0,
        patient_id: Number(id) || 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        diagnosis: '',
        treatment: '',
        doctor_name: 'Dr. Michael Johnson', // This should be the current logged-in doctor's name
        notes: ''
      });
      setIsEditingRecord(false);
    }
    setRecordDialogOpen(true);
  };
  
  // Handler for closing medical record form
  const handleCloseRecordDialog = () => {
    setRecordDialogOpen(false);
  };
  
  // Handler for record input changes
  const handleRecordInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentRecord({
      ...currentRecord,
      [name]: value
    });
  };
  
  // Handler for saving medical record
  const handleSaveRecord = async () => {
    if (!currentRecord.diagnosis || !currentRecord.treatment) {
      setNotification({
        open: true,
        message: 'Please fill out diagnosis and treatment fields',
        severity: 'error'
      });
      return;
    }
    
    try {
      if (isEditingRecord) {
        await apiClient.patch(`/medical-records/${currentRecord.id}`, currentRecord);
        
        // Update record in state
        setMedicalRecords(prev => 
          prev.map(record => 
            record.id === currentRecord.id ? currentRecord : record
          )
        );
        
        setNotification({
          open: true,
          message: 'Medical record updated successfully',
          severity: 'success'
        });
      } else {
        const response = await apiClient.post('/medical-records', currentRecord);
        
        // Add new record to state
        setMedicalRecords(prev => [...prev, response.data]);
        
        setNotification({
          open: true,
          message: 'Medical record added successfully',
          severity: 'success'
        });
        
        // For demo, just add the current record
        setMedicalRecords(prev => [
          ...prev,
          { ...currentRecord, id: Math.max(0, ...prev.map(r => r.id)) + 1 }
        ]);
      }
      
      handleCloseRecordDialog();
    } catch (err) {
      console.error('Error saving medical record:', err);
      
      setNotification({
        open: true,
        message: 'Failed to save medical record',
        severity: 'error'
      });
    }
  };
  
  // Handler for deleting a medical record
  const handleDeleteRecord = async (recordId: number) => {
    if (!window.confirm('Are you sure you want to delete this medical record?')) {
      return;
    }
    
    try {
      await apiClient.delete(`/medical-records/${recordId}`);
      
      // Remove record from state
      setMedicalRecords(prev => prev.filter(record => record.id !== recordId));
      
      setNotification({
        open: true,
        message: 'Medical record deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error deleting medical record:', err);
      
      setNotification({
        open: true,
        message: 'Failed to delete medical record',
        severity: 'error'
      });
    }
  };
  
  // Handler for opening appointment form
  const handleOpenAppointmentDialog = (appointment?: AppointmentRecord) => {
    if (appointment) {
      setCurrentAppointment(appointment);
      setIsEditingAppointment(true);
    } else {
      setCurrentAppointment({
        id: 0,
        patient_id: Number(id) || 0,
        patient_name: patient?.full_name || '',
        doctor_id: 1, // This should be the current logged-in doctor's ID
        doctor_name: 'Dr. Michael Johnson', // This should be the current logged-in doctor's name
        date_time: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
        status: 'scheduled',
        type: 'check-up',
        notes: ''
      });
      setIsEditingAppointment(false);
    }
    setAppointmentDialogOpen(true);
  };
  
  // Handler for closing appointment form
  const handleCloseAppointmentDialog = () => {
    setAppointmentDialogOpen(false);
  };
  
  // Handler for appointment input changes
  const handleAppointmentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentAppointment({
      ...currentAppointment,
      [name]: value
    });
  };
  
  // Handler for appointment type/status changes
  const handleAppointmentSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    if (!e.target.name) return;
    
    setCurrentAppointment({
      ...currentAppointment,
      [e.target.name]: e.target.value
    });
  };
  
  // Handler for saving appointment
  const handleSaveAppointment = async () => {
    try {
      if (isEditingAppointment) {
        await apiClient.patch(`/appointments/${currentAppointment.id}`, currentAppointment);
        
        // Update appointment in state
        setAppointments(prev => 
          prev.map(appointment => 
            appointment.id === currentAppointment.id ? currentAppointment : appointment
          )
        );
        
        setNotification({
          open: true,
          message: 'Appointment updated successfully',
          severity: 'success'
        });
      } else {
        const response = await apiClient.post('/appointments', currentAppointment);
        
        // Add new appointment to state
        setAppointments(prev => [...prev, response.data]);
        
        setNotification({
          open: true,
          message: 'Appointment scheduled successfully',
          severity: 'success'
        });
        
        // For demo, just add the current appointment
        setAppointments(prev => [
          ...prev,
          { ...currentAppointment, id: Math.max(0, ...prev.map(a => a.id)) + 1 }
        ]);
      }
      
      handleCloseAppointmentDialog();
    } catch (err) {
      console.error('Error saving appointment:', err);
      
      setNotification({
        open: true,
        message: 'Failed to save appointment',
        severity: 'error'
      });
    }
  };
  
  // Handler for deleting an appointment
  const handleDeleteAppointment = async (appointmentId: number) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }
    
    try {
      await apiClient.delete(`/appointments/${appointmentId}`);
      
      // Remove appointment from state
      setAppointments(prev => prev.filter(appointment => appointment.id !== appointmentId));
      
      setNotification({
        open: true,
        message: 'Appointment cancelled successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error deleting appointment:', err);
      
      setNotification({
        open: true,
        message: 'Failed to cancel appointment',
        severity: 'error'
      });
    }
  };

  // Handler for creating prescription
  const handleCreatePrescription = () => {
    if (!patient) return;
    
    navigate(`/doctor-dashboard/prescriptions/new`, { 
      state: { 
        patientId: patient.id,
        patientName: patient.full_name
      }
    });
  };

  // Helper function to calculate age
  const calculateAge = (dateOfBirth: string) => {
    try {
      return differenceInYears(new Date(), new Date(dateOfBirth));
    } catch {
      return 'N/A';
    }
  };
  
  // Helper for formatting dates
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'N/A';
    }
  };
  
  // Helper for formatting date and time
  const formatDateTime = (dateTimeString: string) => {
    try {
      return format(new Date(dateTimeString), 'MMM dd, yyyy h:mm a');
    } catch {
      return 'N/A';
    }
  };
  
  // Helper for notification close
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }
  
  if (error || !patient) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 3 }}>
          {error || 'Patient not found'}
        </Alert>
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button 
            variant="contained" 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/doctor-dashboard/patients')}
          >
            Back to Patients
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Back navigation */}
      <Box sx={{ mb: 3 }}>
        <Button 
          variant="text" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/doctor-dashboard/patients')}
        >
          Back to Patients
        </Button>
      </Box>
      
      {/* Patient header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container alignItems="center" spacing={3}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: patient.gender.toLowerCase() === 'male' 
                    ? theme.palette.primary.main 
                    : theme.palette.secondary.main,
                  mr: 3,
                  fontSize: 36
                }}
              >
                {patient.full_name.charAt(0)}
              </Avatar>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h4" component="h1" sx={{ fontWeight: 500 }}>
                    {patient.full_name}
                  </Typography>
                  <Tooltip title="Edit Patient">
                    <IconButton 
                      sx={{ ml: 2 }}
                      onClick={() => setPatientDialogOpen(true)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="subtitle1" color="text.secondary">
                  Patient ID: {patient.id}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Chip 
                    label={`${calculateAge(patient.date_of_birth)} years old`} 
                    size="small" 
                    sx={{ mr: 1 }} 
                  />
                  <Chip 
                    label={patient.gender} 
                    size="small" 
                    sx={{ mr: 1 }} 
                    color={patient.gender.toLowerCase() === 'male' ? 'primary' : 'secondary'}
                  />
                  {patient.blood_type && (
                    <Chip 
                      icon={<BloodtypeIcon />} 
                      label={`Blood Type: ${patient.blood_type}`} 
                      size="small" 
                      color="error" 
                      variant="outlined" 
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AssignmentOutlinedIcon />}
                onClick={handleCreatePrescription}
              >
                New Prescription
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<NoteAddIcon />}
                onClick={() => handleOpenRecordDialog()}
              >
                Add Record
              </Button>
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <Divider />
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PhoneIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    {patient.contact_number || 'No phone number'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EmailIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    {patient.email || 'No email address'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EventIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    Last Visit: {patient.last_visit ? formatDate(patient.last_visit) : 'No recent visits'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Patient details tabs */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="patient tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              label="Medical Records" 
              id="patient-tab-0" 
              aria-controls="patient-tabpanel-0" 
              icon={<MedicalInfoIcon />}
              iconPosition="start"
            />
            <Tab 
              label="Prescriptions" 
              id="patient-tab-1" 
              aria-controls="patient-tabpanel-1" 
              icon={<AssignmentIcon />}
              iconPosition="start"
            />
            <Tab 
              label="Appointments" 
              id="patient-tab-2" 
              aria-controls="patient-tabpanel-2" 
              icon={<ScheduleIcon />}
              iconPosition="start"
            />
            <Tab 
              label="Patient Info" 
              id="patient-tab-3" 
              aria-controls="patient-tabpanel-3" 
              icon={<PersonIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>
        
        {/* Medical Records Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <MedicalInfoIcon sx={{ mr: 1 }} />
              Medical Records
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => handleOpenRecordDialog()}
            >
              Add Medical Record
            </Button>
          </Box>
          
          {medicalRecords.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No medical records found for this patient.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {medicalRecords.map((record) => (
                <Card 
                  key={record.id} 
                  variant="outlined" 
                  sx={{ 
                    borderRadius: 2,
                    '&:hover': { boxShadow: 2 }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                          {record.diagnosis}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(record.date)} • {record.doctor_name}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => handleOpenRecordDialog(record)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteRecord(record.id)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Treatment
                      </Typography>
                      <Typography variant="body1">
                        {record.treatment}
                      </Typography>
                    </Box>
                    
                    {record.notes && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Notes
                        </Typography>
                        <Typography variant="body2">
                          {record.notes}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </TabPanel>
        
        {/* Prescriptions Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <AssignmentIcon sx={{ mr: 1 }} />
              Prescriptions
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleCreatePrescription}
            >
              New Prescription
            </Button>
          </Box>
          
          {prescriptions.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No prescriptions found for this patient.
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date Issued</TableCell>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Medications</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prescriptions.map((prescription) => (
                    <TableRow key={prescription.id}>
                      <TableCell>{formatDate(prescription.date_issued)}</TableCell>
                      <TableCell>{prescription.doctor_name}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {prescription.medications.slice(0, 2).map((med, index) => (
                            <Chip 
                              key={index} 
                              size="small" 
                              label={med.medication_name} 
                              title={`${med.dosage}, ${med.frequency}, ${med.duration}`}
                            />
                          ))}
                          {prescription.medications.length > 2 && (
                            <Chip 
                              size="small" 
                              label={`+${prescription.medications.length - 2} more`} 
                              variant="outlined" 
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)} 
                          color={prescription.status === 'fulfilled' ? 'success' : 'warning'} 
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button 
                          size="small" 
                          onClick={() => navigate(`/doctor-dashboard/prescriptions/${prescription.id}`)} 
                          variant="outlined"
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
        
        {/* Appointments Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <ScheduleIcon sx={{ mr: 1 }} />
              Appointments
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => handleOpenAppointmentDialog()}
            >
              Schedule Appointment
            </Button>
          </Box>
          
          {appointments.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No appointments found for this patient.
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>{formatDateTime(appointment.date_time)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {appointment.type}
                        </Typography>
                      </TableCell>
                      <TableCell>{appointment.doctor_name}</TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)} 
                          color={
                            appointment.status === 'completed' ? 'success' : 
                            appointment.status === 'scheduled' ? 'primary' :
                            appointment.status === 'cancelled' ? 'error' : 'default'
                          } 
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }} title={appointment.notes || ''}>
                          {appointment.notes || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleOpenAppointmentDialog(appointment)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteAppointment(appointment.id)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
        
        {/* Patient Info Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ mr: 1 }} />
              Patient Information
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<EditIcon />}
              onClick={() => setPatientDialogOpen(true)}
            >
              Edit Information
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {/* Personal Information */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <List disablePadding>
                    <ListItem disablePadding sx={{ py: 1 }}>
                      <ListItemText 
                        primary="Full Name" 
                        secondary={patient.full_name} 
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body1' }}
                      />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 1 }}>
                      <ListItemText 
                        primary="Date of Birth" 
                        secondary={formatDate(patient.date_of_birth)} 
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body1' }}
                      />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 1 }}>
                      <ListItemText 
                        primary="Age" 
                        secondary={`${calculateAge(patient.date_of_birth)} years`} 
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body1' }}
                      />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 1 }}>
                      <ListItemText 
                        primary="Gender" 
                        secondary={patient.gender} 
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body1' }}
                      />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 1 }}>
                      <ListItemText 
                        primary="Blood Type" 
                        secondary={patient.blood_type || 'Not recorded'} 
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body1' }}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Contact Information */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%', mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Contact Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <List disablePadding>
                    <ListItem disablePadding sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <PhoneIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Phone" 
                        secondary={patient.contact_number || 'No phone number provided'} 
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body1' }}
                      />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <EmailIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Email" 
                        secondary={patient.email || 'No email address provided'} 
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body1' }}
                      />
                    </ListItem>
                  </List>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Address:
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {patient.address || 'No address provided'}
                  </Typography>
                </CardContent>
              </Card>
              
              <Card variant="outlined" sx={{ height: 'calc(100% - 200px)' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <AllergiesIcon sx={{ mr: 1, color: theme.palette.error.main }} />
                    Allergies
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="body1">
                    {patient.allergies || 'No known allergies'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Medical History - Full Width */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ width: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <HistoryIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    Medical History
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="body1">
                    {patient.medical_history || 'No medical history recorded'}
                  </Typography>
                  
                  {patient.notes && (
                    <>
                      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                        Additional Notes
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="body1">
                        {patient.notes}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>
      
      {/* Medical Record Dialog */}
      <Dialog 
        open={recordDialogOpen} 
        onClose={handleCloseRecordDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: 'white' }}>
          {isEditingRecord ? 'Edit Medical Record' : 'New Medical Record'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                name="date"
                label="Date"
                InputLabelProps={{ shrink: true }}
                value={currentRecord.date}
                onChange={handleRecordInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="doctor_name"
                label="Doctor"
                value={currentRecord.doctor_name}
                onChange={handleRecordInputChange}
                required
                disabled // Assuming this is the current logged-in doctor
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="diagnosis"
                label="Diagnosis"
                value={currentRecord.diagnosis}
                onChange={handleRecordInputChange}
                required
                placeholder="Enter the diagnosis"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="treatment"
                label="Treatment"
                value={currentRecord.treatment}
                onChange={handleRecordInputChange}
                required
                multiline
                minRows={2}
                placeholder="Enter the prescribed treatment"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="notes"
                label="Notes"
                value={currentRecord.notes}
                onChange={handleRecordInputChange}
                multiline
                minRows={3}
                placeholder="Enter any additional notes"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseRecordDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveRecord} 
            variant="contained" 
            disabled={!currentRecord.diagnosis || !currentRecord.treatment}
          >
            {isEditingRecord ? 'Update Record' : 'Save Record'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Appointment Dialog */}
      <Dialog 
        open={appointmentDialogOpen} 
        onClose={handleCloseAppointmentDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: 'white' }}>
          {isEditingAppointment ? 'Edit Appointment' : 'Schedule New Appointment'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="patient_name"
                label="Patient"
                value={currentAppointment.patient_name}
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="doctor_name"
                label="Doctor"
                value={currentAppointment.doctor_name}
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="datetime-local"
                name="date_time"
                label="Date & Time"
                InputLabelProps={{ shrink: true }}
                value={currentAppointment.date_time}
                onChange={handleAppointmentInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="appointment-type-label">Type</InputLabel>
                <Select
                  labelId="appointment-type-label"
                  name="type"
                  value={currentAppointment.type}
                  onChange={handleAppointmentSelectChange as any}
                  label="Type"
                >
                  <MenuItem value="check-up">Check-up</MenuItem>
                  <MenuItem value="follow-up">Follow-up</MenuItem>
                  <MenuItem value="consultation">Consultation</MenuItem>
                  <MenuItem value="procedure">Procedure</MenuItem>
                  <MenuItem value="test">Test</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="appointment-status-label">Status</InputLabel>
                <Select
                  labelId="appointment-status-label"
                  name="status"
                  value={currentAppointment.status}
                  onChange={handleAppointmentSelectChange as any}
                  label="Status"
                >
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="no-show">No-show</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="notes"
                label="Notes"
                value={currentAppointment.notes}
                onChange={handleAppointmentInputChange}
                multiline
                minRows={2}
                placeholder="Enter any notes for this appointment"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseAppointmentDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveAppointment} 
            variant="contained" 
            disabled={!currentAppointment.date_time}
          >
            {isEditingAppointment ? 'Update Appointment' : 'Schedule Appointment'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Patient Edit Dialog */}
      <Dialog
        open={patientDialogOpen}
        onClose={() => setPatientDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Edit Patient Information</Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={() => setPatientDialogOpen(false)}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        {editablePatient && (
          <>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="full_name"
                    label="Full Name"
                    value={editablePatient.full_name}
                    onChange={handlePatientInputChange}
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
                    value={editablePatient.date_of_birth}
                    onChange={handlePatientInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="gender-label">Gender</InputLabel>
                    <Select
                      labelId="gender-label"
                      name="gender"
                      value={editablePatient.gender}
                      onChange={(e) => handleGenderChange(e as any)}
                      label="Gender"
                    >
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
                    value={editablePatient.contact_number || ''}
                    onChange={handlePatientInputChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="email"
                    label="Email Address"
                    type="email"
                    value={editablePatient.email || ''}
                    onChange={handlePatientInputChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="address"
                    label="Address"
                    value={editablePatient.address || ''}
                    onChange={handlePatientInputChange}
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
                      value={editablePatient.blood_type || ''}
                      onChange={(e) => handlePatientInputChange(e as any)}
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
                    value={editablePatient.allergies || ''}
                    onChange={handlePatientInputChange}
                    placeholder="List any allergies or 'None'"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="medical_history"
                    label="Medical History"
                    value={editablePatient.medical_history || ''}
                    onChange={handlePatientInputChange}
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
                    value={editablePatient.notes || ''}
                    onChange={handlePatientInputChange}
                    multiline
                    rows={2}
                    placeholder="Any additional notes about the patient"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setPatientDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleUpdatePatient} 
                variant="contained" 
                color="primary"
                disabled={
                  !editablePatient.full_name || 
                  !editablePatient.date_of_birth || 
                  !editablePatient.gender
                }
              >
                Save Changes
              </Button>
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
    </Container>
  );
};

export default PatientPage;