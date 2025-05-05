import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Medication as MedicationIcon,
  Person as PatientIcon,
  Assignment as PrescriptionIcon,
  AccountCircle,
  MedicalServices as DoctorIcon,
  Healing as TreatmentIcon,
  Receipt as PrescriptionsIcon,
  LocalPharmacy as PharmacyIcon,
} from '@mui/icons-material';
import { logout } from '../auth/slices/authSlice';
import { AppDispatch, RootState } from '../../app/store/store';
import { UserType } from '../../app/api/authService';

const drawerWidth = 240;

const DashboardLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const { user, userType } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  // Define navigation items based on user type
  const getNavigationItems = () => {
    if (userType === UserType.PHARMACIST) {
      return [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Medications', icon: <MedicationIcon />, path: '/medications' },
        { text: 'Patients', icon: <PatientIcon />, path: '/patients' },
        { text: 'Prescriptions', icon: <PrescriptionIcon />, path: '/prescriptions' },
      ];
    } else if (userType === UserType.DOCTOR) {
      return [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/doctor-dashboard' },
        { text: 'My Patients', icon: <PatientIcon />, path: '/doctor-dashboard/patients' },
        { text: 'Prescriptions', icon: <PrescriptionIcon />, path: '/doctor-dashboard/prescriptions' },
        { text: 'Medications', icon: <MedicationIcon />, path: '/doctor-dashboard/medications' },
      ];
    } else {
      // Patient navigation
      return [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/patient-dashboard' },
        { text: 'My Prescriptions', icon: <PrescriptionsIcon />, path: '/patient-dashboard/prescriptions' },
        { text: 'Medications', icon: <MedicationIcon />, path: '/patient-dashboard/medications' },
      ];
    }
  };

  const drawer = (
    <div>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 2,
          backgroundColor: 'primary.dark',
          color: 'white'
        }}
      >
        <PharmacyIcon sx={{ mr: 1 }} />
        <Typography variant="h6" noWrap component="div">
          Green Pharmacy
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ backgroundColor: 'background.paper', minHeight: '100%' }}>
        <List>
          {getNavigationItems().map((item) => {
            const isSelected = location.pathname === item.path || location.pathname === `${item.path}/`;
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton 
                  onClick={() => handleNavigate(item.path)}
                  selected={isSelected}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white'
                      }
                    },
                    '&:hover': {
                      backgroundColor: '#e8f5e9',
                    }
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      color: isSelected ? 'white' : 'primary.main'
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </div>
  );

  const getTitle = () => {
    if (userType === UserType.PHARMACIST) {
      return 'Green Pharmacy Management';
    } else if (userType === UserType.DOCTOR) {
      return 'Doctor Portal';
    } else {
      return 'Patient Portal';
    }
  };

  return (
    <Box sx={{ display: 'flex', backgroundColor: 'background.default', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'primary.dark',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <PharmacyIcon sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }} />
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {getTitle()}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button color="inherit" onClick={handleMenuOpen} sx={{ textTransform: 'none' }}>
              <Avatar 
                sx={{ 
                  mr: 1, 
                  bgcolor: 'secondary.main', 
                  width: 32, 
                  height: 32,
                  color: 'white'
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : <AccountCircle />}
              </Avatar>
              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {user?.name || 'User'}
              </Typography>
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: { 
                  mt: 1.5,
                  boxShadow: '0px 2px 10px rgba(0,0,0,0.1)',
                }
              }}
            >
              <MenuItem onClick={() => { 
                handleMenuClose(); 
                if (userType === UserType.PHARMACIST) {
                  navigate('/profile'); 
                } else if (userType === UserType.DOCTOR) {
                  navigate('/doctor-dashboard/profile');
                } else {
                  navigate('/patient-dashboard/profile');
                }
              }}>
                Profile
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
              boxShadow: '0px 2px 10px rgba(0,0,0,0.1)'
            },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
              boxShadow: '0px 2px 10px rgba(0,0,0,0.1)'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          marginTop: '64px',
          backgroundColor: 'background.default'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;