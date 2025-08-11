import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip,
  Grid,
  Paper,
  Fab,
  Tooltip,
  CircularProgress,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Badge,
  useTheme,
  alpha
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CameraAlt as CameraIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  CloudUpload as CloudUploadIcon,
  PhotoCamera as PhotoCameraIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  VpnKey as VpnKeyIcon,
  DeleteForever as DeleteForeverIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Transgender as TransgenderIcon,
  CalendarToday as CalendarIcon,
  Cake as CakeIcon,
  Work as WorkIcon,
  Favorite as FavoriteIcon,
  HeartBroken as HeartBrokenIcon,
  InvertColors as InvertColorsIcon
} from '@mui/icons-material';
import axios from '../utils/axios';

const Profile = () => {
  const theme = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [usernameDialog, setUsernameDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [imageUploadDialog, setImageUploadDialog] = useState(false);
  const [imageDeleteDialog, setImageDeleteDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    old_password: '', new_password: '', confirm_password: ''
  });
  const [usernameData, setUsernameData] = useState({ new_username: '' });
  const [deleteData, setDeleteData] = useState({ password: '', confirm_delete: false });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/profile-mongo/');
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      console.log('🔧 Sending profile update data:', editData);
      await axios.put('/api/profile-mongo/update/', editData);
      setSuccess('Profile updated successfully');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      console.error('Error response:', error.response?.data);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setSaving(true);
      await axios.post('/api/profile/change-password/', passwordData);
      setSuccess('Password changed successfully');
      setPasswordDialog(false);
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      setError('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleUsernameUpdate = async () => {
    try {
      setSaving(true);
      await axios.post('/api/profile/update-username/', usernameData);
      setSuccess('Username updated successfully');
      setUsernameDialog(false);
      setUsernameData({ new_username: '' });
      fetchProfile();
    } catch (error) {
      console.error('Error updating username:', error);
      setError('Failed to update username');
    } finally {
      setSaving(false);
    }
  };

  const handleAccountDelete = async () => {
    try {
      setSaving(true);
      await axios.post('/api/profile/delete-account/', deleteData);
      setSuccess('Account deleted successfully');
      // Redirect to logout or home page
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('Failed to delete account');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) return;

    try {
      setImageUploading(true);
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await axios.post('/api/profile-mongo/upload-image/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setProfile(response.data);
      setSelectedImage(null);
      setImagePreview(null);
      setImageUploadDialog(false);
      setSuccess('Profile image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageDelete = async () => {
    try {
      setSaving(true);
      await axios.delete('/api/profile-mongo/delete-image/');
      setSuccess('Profile image deleted successfully');
      setImageDeleteDialog(false);
      fetchProfile();
    } catch (error) {
      console.error('Error deleting image:', error);
      setError('Failed to delete image');
    } finally {
      setSaving(false);
    }
  };

  const handleImageDeleteConfirm = () => {
    setImageDeleteDialog(true);
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteDialogOpen = () => {
    setDeleteData({ password: '', confirm_delete: false });
    setShowDeletePassword(false);
    setDeleteDialog(true);
  };

  const handleCloseSnackbar = () => {
    setSuccess(null);
    setError(null);
  };

  const getSexIcon = (sex) => {
    switch (sex) {
      case 'M': return <MaleIcon />;
      case 'F': return <FemaleIcon />;
      case 'O': return <PersonIcon />;
      default: return <PersonIcon />;
    }
  };

  const getMaritalStatusIcon = (status) => {
    switch (status) {
      case 'single': return <PersonIcon />;
      case 'married': return <FavoriteIcon />;
      case 'divorced': return <HeartBrokenIcon />;
      case 'widowed': return <InvertColorsIcon />;
      default: return <PersonIcon />;
    }
  };

  const formatMemberSince = (dateJoined) => {
    if (!dateJoined) return 'Not available';
    
    try {
      const joinDate = new Date(dateJoined);
      return joinDate.toLocaleDateString();
    } catch (error) {
      return 'Not available';
    }
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
        sx={{
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.1)} 100%)`
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 50%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
          : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.15)} 0%, ${alpha(theme.palette.secondary.light, 0.15)} 50%, ${alpha(theme.palette.primary.light, 0.08)} 100%)`,
        padding: 0,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 50%),
                       radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 50%)`,
          pointerEvents: 'none'
        }
      }}
    >
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{
          background: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          padding: { xs: '1.5rem 0', md: '2.5rem 0' },
          marginBottom: { xs: '1.5rem', md: '2.5rem' },
          position: 'relative',
          zIndex: 1
        }}
      >
        <Box 
          sx={{
            maxWidth: 1800,
            margin: '0 auto',
            padding: { xs: '0 1.5rem', sm: '0 2rem', md: '0 3rem' },
            textAlign: 'center'
          }}
        >
          <Typography 
            variant="h3" 
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 700,
              marginBottom: '0.75rem',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
            }}
          >
            Profile Settings
          </Typography>
          <Typography 
            variant="h6" 
            sx={{
              color: theme.palette.success.main,
              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
              margin: 0,
              fontWeight: 400,
              opacity: 0.9
            }}
          >
            Manage your account and preferences
          </Typography>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box 
        sx={{
          maxWidth: 1800,
          margin: '0 auto',
          padding: { xs: '0 1.5rem', sm: '0 2rem', md: '0 3rem' },
          paddingBottom: { xs: '2rem', md: '3rem' },
          position: 'relative',
          zIndex: 1
        }}
      >
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ minHeight: '70vh' }}>
          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            <Card 
              sx={{
                background: alpha(theme.palette.background.paper, 0.95),
                backdropFilter: 'blur(10px)',
                borderRadius: 4,
                boxShadow: theme.shadows[12],
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                height: 'fit-content',
                position: 'sticky',
                top: '2rem',
                minHeight: { xs: 'auto', lg: '600px' },
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <CardContent sx={{ 
                padding: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Profile Image and Personal Info Section */}
                <Box sx={{ marginBottom: '2.5rem', flex: 1 }}>
                  <Grid container spacing={3}>
                    {/* Profile Image */}
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center', marginBottom: 0 }}>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          badgeContent={
                            <Tooltip title="Upload photo">
                              <Fab
                                size="small"
                                color="primary"
                                onClick={() => setImageUploadDialog(true)}
                                sx={{
                                  boxShadow: theme.shadows[6],
                                  transition: 'transform 0.2s ease',
                                  '&:hover': {
                                    transform: 'scale(1.1)',
                                    backgroundColor: theme.palette.primary.dark
                                  }
                                }}
                              >
                                <PhotoCameraIcon />
                              </Fab>
                            </Tooltip>
                          }
                        >
                          <Avatar
                            src={profile?.profile_image_url}
                            sx={{ 
                              width: { xs: 80, sm: 100, md: 120 },
                              height: { xs: 80, sm: 100, md: 120 },
                              border: `4px solid ${theme.palette.primary.main}`,
                              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
                              transition: 'transform 0.3s ease',
                              '&:hover': {
                                transform: 'scale(1.05)'
                              }
                            }}
                          >
                            <PersonIcon sx={{ fontSize: { xs: 40, sm: 50, md: 60 } }} />
                          </Avatar>
                        </Badge>
                      </Box>
                    </Grid>

                    {/* Personal Info */}
                    <Grid item xs={12} sm={8}>
                      <Box sx={{ paddingLeft: { xs: 0, sm: '1rem' } }}>
                        <Typography 
                          variant="h5" 
                          sx={{
                            fontWeight: 700,
                            marginBottom: '0.75rem',
                            color: theme.palette.text.primary,
                            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
                          }}
                        >
                          {profile?.username}
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{
                            color: theme.palette.text.secondary,
                            marginBottom: '1.5rem',
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            fontWeight: 500
                          }}
                        >
                          {profile?.email}
                        </Typography>
                        
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Active"
                          color="success"
                          size="medium"
                          sx={{ 
                            marginBottom: '1.5rem',
                            fontSize: { xs: '0.8rem', sm: '0.9rem' },
                            height: { xs: 28, sm: 32 }
                          }}
                        />

                        {/* Quick Personal Info */}
                        <Box sx={{ 
                          background: alpha(theme.palette.background.default, 0.5),
                          borderRadius: 2,
                          padding: '1.5rem',
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            marginBottom: '1rem',
                            padding: '0.75rem',
                            borderRadius: 1,
                            transition: 'background-color 0.2s ease',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.action.hover, 0.1)
                            }
                          }}>
                            <CakeIcon sx={{ 
                              marginRight: '0.75rem', 
                              color: theme.palette.primary.main,
                              fontSize: '1.3rem'
                            }} />
                            <Typography variant="body2" sx={{ 
                              color: theme.palette.text.secondary,
                              fontWeight: 500
                            }}>
                              Age: {profile?.age || 'Not specified'}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            marginBottom: '1rem',
                            padding: '0.75rem',
                            borderRadius: 1,
                            transition: 'background-color 0.2s ease',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.action.hover, 0.1)
                            }
                          }}>
                            {getSexIcon(profile?.sex)}
                            <Typography variant="body2" sx={{ 
                              color: theme.palette.text.secondary,
                              fontWeight: 500
                            }}>
                              {profile?.sex === 'M' ? 'Male' : profile?.sex === 'F' ? 'Female' : profile?.sex === 'O' ? 'Other' : 'Not specified'}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            marginBottom: '0.5rem',
                            padding: '0.75rem',
                            borderRadius: 1,
                            transition: 'background-color 0.2s ease',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.action.hover, 0.1)
                            }
                          }}>
                            {getMaritalStatusIcon(profile?.marital_status)}
                            <Typography variant="body2" sx={{ 
                              color: theme.palette.text.secondary,
                              fontWeight: 500
                            }}>
                              {profile?.marital_status ? profile.marital_status.charAt(0).toUpperCase() + profile.marital_status.slice(1) : 'Not specified'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Navigation Tabs */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Tabs
                    orientation="vertical"
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    sx={{
                      '& .MuiTabs-indicator': {
                        backgroundColor: theme.palette.primary.main,
                        width: 4,
                        borderRadius: 2
                      }
                    }}
                  >
                    <Tab
                      icon={<AccountCircleIcon />}
                      label="Account Info"
                      sx={{
                        alignItems: 'flex-start',
                        textAlign: 'left',
                        minHeight: 56,
                        padding: '16px 20px',
                        color: theme.palette.text.secondary,
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        fontWeight: 500,
                        '&.Mui-selected': {
                          color: theme.palette.primary.main,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          borderRadius: 2
                        },
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.action.hover, 0.1),
                          borderRadius: 2
                        }
                      }}
                    />
                    <Tab
                      icon={<VpnKeyIcon />}
                      label="Security"
                      sx={{
                        alignItems: 'flex-start',
                        textAlign: 'left',
                        minHeight: 56,
                        padding: '16px 20px',
                        color: theme.palette.text.secondary,
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        fontWeight: 500,
                        '&.Mui-selected': {
                          color: theme.palette.primary.main,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          borderRadius: 2
                        },
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.action.hover, 0.1),
                          borderRadius: 2
                        }
                      }}
                    />
                    <Tab
                      icon={<SettingsIcon />}
                      label="Preferences"
                      sx={{
                        alignItems: 'flex-start',
                        textAlign: 'left',
                        minHeight: 56,
                        padding: '16px 20px',
                        color: theme.palette.text.secondary,
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        fontWeight: 500,
                        '&.Mui-selected': {
                          color: theme.palette.primary.main,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          borderRadius: 2
                        },
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.action.hover, 0.1),
                          borderRadius: 2
                        }
                      }}
                    />
                  </Tabs>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} lg={8}>
            <Card 
              sx={{
                background: alpha(theme.palette.background.paper, 0.95),
                backdropFilter: 'blur(10px)',
                borderRadius: 4,
                boxShadow: theme.shadows[12],
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                height: 'fit-content',
                minHeight: { xs: 'auto', lg: '800px' },
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <CardContent sx={{ 
                padding: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: { xs: 'auto', lg: '800px' },
                height: { xs: 'auto', lg: '100%' },
                width: '100%',
                minWidth: { xs: '100%', md: '800px' }
              }}>
                {activeTab === 0 && (
                  <Box sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    width: '100%',
                    minWidth: { xs: '100%', md: '900px' },
                    maxWidth: '100%'
                  }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                      <Typography 
                        variant="h4" 
                        sx={{
                          fontWeight: 700,
                          color: theme.palette.text.primary,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' }
                        }}
                      >
                        Account Information
                      </Typography>
                      <Button
                        variant={editing ? "outlined" : "contained"}
                        startIcon={editing ? <CancelIcon /> : <EditIcon />}
                        onClick={() => {
                          if (!editing) {
                            // Start editing - populate editData with current profile data
                            setEditData({
                              age: profile?.age || '',
                              sex: profile?.sex || '',
                              marital_status: profile?.marital_status || '',
                              date_of_birth: profile?.date_of_birth || ''
                            });
                          }
                          setEditing(!editing);
                        }}
                        disabled={saving}
                        size="large"
                        sx={{
                          borderRadius: 3,
                          textTransform: 'none',
                          fontWeight: 600,
                          boxShadow: theme.shadows[4],
                          padding: '12px 24px',
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          '&:hover': {
                            boxShadow: theme.shadows[8]
                          }
                        }}
                      >
                        {editing ? 'Cancel Edit' : 'Edit Profile'}
                      </Button>
                    </Box>
                    
                    {!editing ? (
                      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ flex: 1 }}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{
                            padding: { xs: '1.25rem', sm: '1.5rem' },
                            borderRadius: 3,
                            backgroundColor: alpha(theme.palette.background.default, 0.5),
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-start',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.action.hover, 0.1),
                              transform: 'translateY(-4px)',
                              boxShadow: theme.shadows[8]
                            }
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                              <PersonIcon sx={{ 
                                marginRight: '0.75rem', 
                                color: theme.palette.primary.main,
                                fontSize: '1.3rem'
                              }} />
                              <Typography variant="body2" color="textSecondary" sx={{ 
                                fontWeight: 600,
                                fontSize: { xs: '0.85rem', sm: '0.9rem' }
                              }}>
                                Username
                              </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ 
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              fontSize: { xs: '1rem', sm: '1.1rem' },
                              lineHeight: 1.3
                            }}>
                              {profile?.username}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Box sx={{
                            padding: { xs: '1.25rem', sm: '1.5rem' },
                            borderRadius: 3,
                            backgroundColor: alpha(theme.palette.background.default, 0.5),
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-start',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.action.hover, 0.1),
                              transform: 'translateY(-4px)',
                              boxShadow: theme.shadows[8]
                            }
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                              <AccountCircleIcon sx={{ 
                                marginRight: '0.75rem', 
                                color: theme.palette.primary.main,
                                fontSize: '1.3rem'
                              }} />
                              <Typography variant="body2" color="textSecondary" sx={{ 
                                fontWeight: 600,
                                fontSize: { xs: '0.85rem', sm: '0.9rem' }
                              }}>
                                Email
                              </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ 
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              fontSize: { xs: '1rem', sm: '1.1rem' },
                              lineHeight: 1.3
                            }}>
                              {profile?.email}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Box sx={{
                            padding: { xs: '1.25rem', sm: '1.5rem' },
                            borderRadius: 3,
                            backgroundColor: alpha(theme.palette.background.default, 0.5),
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-start',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.action.hover, 0.1),
                              transform: 'translateY(-4px)',
                              boxShadow: theme.shadows[8]
                            }
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                              <CalendarIcon sx={{ 
                                marginRight: '0.75rem', 
                                color: theme.palette.primary.main,
                                fontSize: '1.3rem'
                              }} />
                              <Typography variant="body2" color="textSecondary" sx={{ 
                                fontWeight: 600,
                                fontSize: { xs: '0.85rem', sm: '0.9rem' }
                              }}>
                                Date of Birth
                              </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ 
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              fontSize: { xs: '1rem', sm: '1.1rem' },
                              lineHeight: 1.3
                            }}>
                              {profile?.date_of_birth || 'Not specified'}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Box sx={{
                            padding: { xs: '1.25rem', sm: '1.5rem' },
                            borderRadius: 3,
                            backgroundColor: alpha(theme.palette.background.default, 0.5),
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-start',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.action.hover, 0.1),
                              transform: 'translateY(-4px)',
                              boxShadow: theme.shadows[8]
                            }
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                              <AccountCircleIcon sx={{ 
                                marginRight: '0.75rem', 
                                color: theme.palette.primary.main,
                                fontSize: '1.3rem'
                              }} />
                              <Typography variant="body2" color="textSecondary" sx={{ 
                                fontWeight: 600,
                                fontSize: { xs: '0.85rem', sm: '0.9rem' }
                              }}>
                                Member Since
                              </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ 
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              fontSize: { xs: '1rem', sm: '1.1rem' },
                              lineHeight: 1.3
                            }}>
                              {formatMemberSince(profile?.date_joined)}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    ) : (
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Grid container spacing={{ xs: 2, sm: 3, md: 3 }} sx={{ flex: 1 }}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              type="number"
                              label="Age"
                              value={editData.age || ''}
                              onChange={(e) => setEditData({ ...editData, age: e.target.value })}
                              size="large"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 3,
                                  fontSize: '1rem',
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.primary.main
                                  }
                                }
                              }}
                            />
                          </Grid>
                          
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="large" sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                fontSize: '1.1rem',
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.primary.main
                                }
                              }
                            }}>
                              <InputLabel>Sex</InputLabel>
                              <Select
                                value={editData.sex || ''}
                                onChange={(e) => setEditData({ ...editData, sex: e.target.value })}
                                label="Sex"
                              >
                                <MenuItem value="M">Male</MenuItem>
                                <MenuItem value="F">Female</MenuItem>
                                <MenuItem value="O">Other</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="large" sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                fontSize: '1.1rem',
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.primary.main
                                }
                              }
                            }}>
                              <InputLabel>Marital Status</InputLabel>
                              <Select
                                value={editData.marital_status || ''}
                                onChange={(e) => setEditData({ ...editData, marital_status: e.target.value })}
                                label="Marital Status"
                              >
                                <MenuItem value="single">Single</MenuItem>
                                <MenuItem value="married">Married</MenuItem>
                                <MenuItem value="Others">Others</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              type="date"
                              label="Date of Birth"
                              value={editData.date_of_birth || ''}
                              onChange={(e) => setEditData({ ...editData, date_of_birth: e.target.value })}
                              size="large"
                              InputLabelProps={{ shrink: true }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 3,
                                  fontSize: '1.1rem',
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.primary.main
                                  }
                                }
                              }}
                            />
                          </Grid>
                          
                          <Grid item xs={12}>
                            <Button
                              variant="contained"
                              startIcon={<SaveIcon />}
                              onClick={handleSaveProfile}
                              disabled={saving}
                              fullWidth
                              size="large"
                              sx={{
                                borderRadius: 3,
                                textTransform: 'none',
                                fontWeight: 700,
                                padding: '16px 32px',
                                fontSize: '1rem',
                                boxShadow: theme.shadows[6],
                                marginTop: -1,
                                '&:hover': {
                                  boxShadow: theme.shadows[12]
                                }
                              }}
                            >
                              {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </Box>
                )}

                {activeTab === 1 && (
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography 
                      variant="h4" 
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '2.5rem',
                        fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' }
                      }}
                    >
                      Security Settings
                    </Typography>
                    
                    <List sx={{ padding: 0, flex: 1 }}>
                      <ListItem sx={{
                        padding: { xs: '1.5rem', sm: '2rem' },
                        marginBottom: '1.5rem',
                        borderRadius: 3,
                        backgroundColor: alpha(theme.palette.background.default, 0.5),
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.action.hover, 0.1),
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8]
                        }
                      }}>
                        <ListItemIcon sx={{ 
                          color: theme.palette.primary.main,
                          marginRight: '1rem'
                        }}>
                          <VpnKeyIcon sx={{ fontSize: '1.8rem' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Change Password"
                          secondary="Update your account password"
                          sx={{
                            '& .MuiListItemText-primary': {
                              fontWeight: 700,
                              color: theme.palette.text.primary,
                              fontSize: { xs: '1.1rem', sm: '1.25rem' }
                            },
                            '& .MuiListItemText-secondary': {
                              color: theme.palette.text.secondary,
                              fontSize: { xs: '0.9rem', sm: '1rem' }
                            }
                          }}
                        />
                        <Button
                          variant="outlined"
                          size="large"
                          onClick={() => setPasswordDialog(true)}
                          sx={{
                            borderRadius: 3,
                            textTransform: 'none',
                            fontWeight: 600,
                            padding: '12px 24px',
                            fontSize: { xs: '0.9rem', sm: '1rem' }
                          }}
                        >
                          Change
                        </Button>
                      </ListItem>

                      <ListItem sx={{
                        padding: { xs: '1.5rem', sm: '2rem' },
                        marginBottom: '1.5rem',
                        borderRadius: 3,
                        backgroundColor: alpha(theme.palette.background.default, 0.5),
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.action.hover, 0.1),
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8]
                        }
                      }}>
                        <ListItemIcon sx={{ 
                          color: theme.palette.primary.main,
                          marginRight: '1rem'
                        }}>
                          <AccountCircleIcon sx={{ fontSize: '1.8rem' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Change Username"
                          secondary="Update your display username"
                          sx={{
                            '& .MuiListItemText-primary': {
                              fontWeight: 700,
                              color: theme.palette.text.primary,
                              fontSize: { xs: '1.1rem', sm: '1.25rem' }
                            },
                            '& .MuiListItemText-secondary': {
                              color: theme.palette.text.secondary,
                              fontSize: { xs: '0.9rem', sm: '1rem' }
                            }
                          }}
                        />
                        <Button
                          variant="outlined"
                          size="large"
                          onClick={() => setUsernameDialog(true)}
                          sx={{
                            borderRadius: 3,
                            textTransform: 'none',
                            fontWeight: 600,
                            padding: '12px 24px',
                            fontSize: { xs: '0.9rem', sm: '1rem' }
                          }}
                        >
                          Change
                        </Button>
                      </ListItem>

                      <ListItem sx={{
                        padding: { xs: '1.5rem', sm: '2rem' },
                        marginBottom: '1.5rem',
                        borderRadius: 3,
                        backgroundColor: alpha(theme.palette.background.default, 0.5),
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.action.hover, 0.1),
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8]
                        }
                      }}>
                        <ListItemIcon sx={{ 
                          color: theme.palette.primary.main,
                          marginRight: '1rem'
                        }}>
                          <PhotoCameraIcon sx={{ fontSize: '1.8rem' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Profile Photo"
                          secondary="Upload or change your profile picture"
                          sx={{
                            '& .MuiListItemText-primary': {
                              fontWeight: 700,
                              color: theme.palette.text.primary,
                              fontSize: { xs: '1.1rem', sm: '1.25rem' }
                            },
                            '& .MuiListItemText-secondary': {
                              color: theme.palette.text.secondary,
                              fontSize: { xs: '0.9rem', sm: '1rem' }
                            }
                          }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="large"
                            onClick={() => setImageUploadDialog(true)}
                            sx={{
                              borderRadius: 3,
                              textTransform: 'none',
                              fontWeight: 600,
                              padding: '12px 24px',
                              fontSize: { xs: '0.9rem', sm: '1rem' }
                            }}
                          >
                            Upload
                          </Button>
                          {profile?.profile_image_url && (
                            <Button
                              variant="outlined"
                              color="error"
                              size="large"
                              onClick={handleImageDeleteConfirm}
                              disabled={saving}
                              sx={{
                                borderRadius: 3,
                                textTransform: 'none',
                                fontWeight: 600,
                                padding: '12px 24px',
                                fontSize: { xs: '0.9rem', sm: '1rem' }
                              }}
                            >
                              Delete
                            </Button>
                          )}
                        </Box>
                      </ListItem>
                    </List>
                  </Box>
                )}

                {activeTab === 2 && (
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography 
                      variant="h4" 
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '2.5rem',
                        fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' }
                      }}
                    >
                      Account Preferences
                    </Typography>
                    
                    <List sx={{ padding: 0, flex: 1 }}>
                      <ListItem sx={{
                        padding: { xs: '1.5rem', sm: '2rem' },
                        marginBottom: '1.5rem',
                        borderRadius: 3,
                        backgroundColor: alpha(theme.palette.background.default, 0.5),
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.action.hover, 0.1),
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8]
                        }
                      }}>
                        <ListItemIcon sx={{ 
                          color: theme.palette.error.main,
                          marginRight: '1rem'
                        }}>
                          <WarningIcon sx={{ fontSize: '1.8rem' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Delete Account"
                          secondary="Permanently delete your account and all data"
                          sx={{
                            '& .MuiListItemText-primary': {
                              fontWeight: 700,
                              color: theme.palette.text.primary,
                              fontSize: { xs: '1.1rem', sm: '1.25rem' }
                            },
                            '& .MuiListItemText-secondary': {
                              color: theme.palette.text.secondary,
                              fontSize: { xs: '0.9rem', sm: '1rem' }
                            }
                          }}
                        />
                        <Button
                          variant="outlined"
                          color="error"
                          size="large"
                          onClick={handleDeleteDialogOpen}
                          sx={{
                            borderRadius: 3,
                            textTransform: 'none',
                            fontWeight: 600,
                            padding: '12px 24px',
                            fontSize: { xs: '0.9rem', sm: '1rem' }
                          }}
                        >
                          Delete
                        </Button>
                      </ListItem>
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Dialogs */}
        <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            fontWeight: 600
          }}>
            <LockIcon />
            Change Password
          </DialogTitle>
          <DialogContent sx={{ padding: '2rem' }}>
            <TextField
              fullWidth
              type={showOldPassword ? 'text' : 'password'}
              label="Current Password"
              value={passwordData.old_password}
              onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowOldPassword(!showOldPassword)} edge="end">
                      {showOldPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              type={showNewPassword ? 'text' : 'password'}
              label="New Password"
              value={passwordData.new_password}
              onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                      {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirm New Password"
              value={passwordData.confirm_password}
              onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </DialogContent>
          <DialogActions sx={{ padding: '1rem 2rem 2rem' }}>
            <Button 
              onClick={() => setPasswordDialog(false)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handlePasswordChange}
              disabled={saving}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: theme.shadows[2],
                '&:hover': {
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              {saving ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={usernameDialog} onClose={() => setUsernameDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            fontWeight: 600
          }}>
            <AccountCircleIcon />
            Change Username
          </DialogTitle>
          <DialogContent sx={{ padding: '2rem' }}>
            <TextField
              fullWidth
              label="New Username"
              value={usernameData.new_username}
              onChange={(e) => setUsernameData({ new_username: e.target.value })}
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ padding: '1rem 2rem 2rem' }}>
            <Button 
              onClick={() => setUsernameDialog(false)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleUsernameUpdate}
              disabled={saving}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: theme.shadows[2],
                '&:hover': {
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              {saving ? 'Updating...' : 'Update Username'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
            color: 'white',
            fontWeight: 600
          }}>
            <DeleteForeverIcon />
            Delete Account
          </DialogTitle>
          <DialogContent sx={{ padding: '2rem' }}>
            <Alert severity="warning" sx={{ marginBottom: 2 }}>
              This action cannot be undone. All your data will be permanently deleted.
            </Alert>
            <TextField
              fullWidth
              type={showDeletePassword ? 'text' : 'password'}
              label="Confirm Password"
              value={deleteData.password}
              onChange={(e) => setDeleteData({ ...deleteData, password: e.target.value })}
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowDeletePassword(!showDeletePassword)} edge="end">
                      {showDeletePassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={deleteData.confirm_delete}
                  onChange={(e) => setDeleteData({ ...deleteData, confirm_delete: e.target.checked })}
                  color="error"
                />
              }
              label="I understand this action is irreversible"
              sx={{ marginTop: 2 }}
            />
          </DialogContent>
          <DialogActions sx={{ padding: '1rem 2rem 2rem' }}>
            <Button 
              onClick={() => setDeleteDialog(false)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="error"
              onClick={handleAccountDelete}
              disabled={saving || !deleteData.confirm_delete}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: theme.shadows[2],
                '&:hover': {
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              {saving ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={imageUploadDialog} onClose={() => setImageUploadDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            fontWeight: 600
          }}>
            <CloudUploadIcon />
            Upload Profile Photo
          </DialogTitle>
          <DialogContent sx={{ padding: '2rem' }}>
            <Box sx={{
              border: `2px dashed ${theme.palette.primary.main}`,
              borderRadius: 2,
              padding: '3rem',
              textAlign: 'center',
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                borderColor: theme.palette.primary.dark
              }
            }} onClick={() => document.getElementById('image-upload').click()}>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <CloudUploadIcon sx={{ fontSize: 48, color: theme.palette.primary.main, marginBottom: 1 }} />
              <Typography variant="h6" sx={{ color: theme.palette.primary.main, marginBottom: 1 }}>
                Click to Upload
              </Typography>
              <Typography variant="body2" color="textSecondary">
                or drag and drop an image file
              </Typography>
            </Box>
            
            {imagePreview && (
              <Box sx={{ marginTop: 2, textAlign: 'center' }}>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: 200, 
                    borderRadius: 8,
                    border: `2px solid ${theme.palette.primary.main}`
                  }} 
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ padding: '1rem 2rem 2rem' }}>
            <Button 
              onClick={() => setImageUploadDialog(false)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleImageUpload}
              disabled={!selectedImage || imageUploading}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: theme.shadows[2],
                '&:hover': {
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              {imageUploading ? 'Uploading...' : 'Upload Photo'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={imageDeleteDialog} onClose={() => setImageDeleteDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
            color: 'white',
            fontWeight: 600
          }}>
            <DeleteIcon />
            Delete Profile Photo
          </DialogTitle>
          <DialogContent sx={{ padding: '2rem' }}>
            <Alert severity="warning" sx={{ marginBottom: 2 }}>
              Are you sure you want to delete your profile photo? This action cannot be undone.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ padding: '1rem 2rem 2rem' }}>
            <Button 
              onClick={() => setImageDeleteDialog(false)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="error"
              onClick={handleImageDelete}
              disabled={saving}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: theme.shadows[2],
                '&:hover': {
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              {saving ? 'Deleting...' : 'Delete Photo'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbars */}
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default Profile; 

