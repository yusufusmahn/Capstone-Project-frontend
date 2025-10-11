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
  Divider
} from '@mui/material'
import { useAuth } from '../../contexts/AuthContext'
import { authAPI } from '../../services/api'
import { Layout } from '../../components/layout/Layout'

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth()
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

  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    })
  }

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // TODO: Implement profile update API call
      // For now, just show success message
      setSuccess('Profile updated successfully!')
      refreshProfile()
    } catch (err) {
      setError('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Check if new password and confirm password match
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New password and confirm password do not match.')
      setLoading(false)
      return
    }

    try {
      const response = await authAPI.changePassword(passwordData)
      setSuccess(response.data.message || 'Password updated successfully!')
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
    } catch (err) {
      if (err.response && err.response.data) {
        if (err.response.data.details) {
          setError(err.response.data.details)
        } else if (err.response.data.error) {
          setError(err.response.data.error)
        } else {
          setError('Failed to update password. Please try again.')
        }
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
        <Typography variant="h4" component="h1" gutterBottom>
          User Profile
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* User Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Personal Information" />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="name"
                      value={profileData.name}
                      onChange={handleChange}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phone_number"
                      value={profileData.phone_number}
                      onChange={handleChange}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleChange}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Date of Birth"
                      name="dob"
                      type="date"
                      value={profileData.dob}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      disabled
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Role-specific Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Account Details" />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="User Role"
                      value={user.role?.replace('_', ' ').toUpperCase()}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Account Status"
                      value={user.status ? 'Active' : 'Inactive'}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Member Since"
                      value={new Date(user.created_at).toLocaleDateString()}
                      disabled
                    />
                  </Grid>
                  
                  {profile && (
                    <>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Voter ID"
                          value={profile.voter_id || 'N/A'}
                          disabled
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Voter's Card ID"
                          value={profile.voters_card_id || 'N/A'}
                          disabled
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Registration Status"
                          value={profile.registration_verified ? 'Verified' : 'Pending Verification'}
                          disabled
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Password Change */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Change Password" />
              <Divider />
              <CardContent>
                <Box component="form" onSubmit={handlePasswordSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Current Password"
                        type="password"
                        name="current_password"
                        value={passwordData.current_password}
                        onChange={handlePasswordChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="New Password"
                        type="password"
                        name="new_password"
                        value={passwordData.new_password}
                        onChange={handlePasswordChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Confirm New Password"
                        type="password"
                        name="confirm_password"
                        value={passwordData.confirm_password}
                        onChange={handlePasswordChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Update Password'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  )
}

export default Profile