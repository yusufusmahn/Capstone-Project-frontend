import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Avatar,
  Stack,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import EditIcon from '@mui/icons-material/Edit'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import { useAuth } from '../../contexts/AuthContext'
import { authAPI } from '../../services/api'
import { Layout } from '../../components/layout/Layout'

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone_number: user?.phone_number || '',
    email: user?.email || '',
    dob: user?.dob || ''
  })

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone_number: user.phone_number || '',
        email: user.email || '',
        dob: user.dob || ''
      })
    }
  }, [user])

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    })
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New password and confirm password do not match.')
      setLoading(false)
      return
    }

    try {
      const response = await authAPI.changePassword(passwordData)
      setSuccess(response.data.message || 'Password updated successfully!')
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      if (err.response && err.response.data) {
        if (err.response.data.details) setError(err.response.data.details)
        else if (err.response.data.error) setError(err.response.data.error)
        else setError('Failed to update password. Please try again.')
      } else {
        setError('Failed to update password. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Layout>
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </Container>
      </Layout>
    )
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" component="h1">Your Profile</Typography>
          <Box>
            {error && <Alert severity="error" sx={{ mb: 0 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 0 }}>{success}</Alert>}
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={6}
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                borderRadius: 2,
                background: isDark ? 'linear-gradient(180deg,#07121a,#0b1b22)' : 'linear-gradient(180deg,#fff,#f7f9fb)'
              }}
            >
              <Avatar sx={{ width: 96, height: 96, mb: 2, bgcolor: isDark ? '#063220' : '#008751' }}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{user.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{user.phone_number}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Box>
                  <Chip label={user.role?.replace('_', ' ').toUpperCase()} color="primary" size="small" />
                  <Chip label={user.status ? 'Active' : 'Inactive'} size="small" variant={user.status ? 'filled' : 'outlined'} />
                </Box>
              </Stack>

              <Box sx={{ mt: 2, width: '100%' }}>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1} alignItems="stretch">
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Member since</Typography>
                    <Typography variant="body2">{new Date(user.created_at).toLocaleDateString()}</Typography>
                  </Box>
                  {profile && (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Voter ID</Typography>
                        <Typography variant="body2">{profile.voter_id || 'N/A'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Registration</Typography>
                        <Typography variant="body2">{profile.registration_verified ? 'Verified' : 'Pending'}</Typography>
                      </Box>
                    </>
                  )}
                </Stack>
              </Box>

              <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                <Tooltip title="Update avatar">
                  <IconButton color="primary">
                    <PhotoCameraIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit profile">
                  <IconButton>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  <CardHeader title="Personal Information" />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Full Name" value={profileData.name} disabled />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Phone Number" value={profileData.phone_number} disabled />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Email" value={profileData.email} disabled />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Date of Birth" value={profileData.dob} disabled />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardHeader title="Account Details" />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField fullWidth label="User Role" value={user.role?.replace('_', ' ').toUpperCase()} disabled />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField fullWidth label="Account Status" value={user.status ? 'Active' : 'Inactive'} disabled />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField fullWidth label="Member Since" value={new Date(user.created_at).toLocaleDateString()} disabled />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardHeader title="Change Password" />
                  <Divider />
                  <CardContent>
                    <Box component="form" onSubmit={handlePasswordSubmit}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                          <TextField fullWidth label="Current Password" type="password" name="current_password" value={passwordData.current_password} onChange={handlePasswordChange} required />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField fullWidth label="New Password" type="password" name="new_password" value={passwordData.new_password} onChange={handlePasswordChange} required />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField fullWidth label="Confirm New Password" type="password" name="confirm_password" value={passwordData.confirm_password} onChange={handlePasswordChange} required />
                        </Grid>
                        <Grid item xs={12} sx={{ textAlign: 'right' }}>
                          <Button variant="contained" type="submit" disabled={loading}>
                            {loading ? <CircularProgress size={20} /> : 'Update Password'}
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  )
}

export default Profile