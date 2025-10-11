import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material'
import { Visibility, VisibilityOff, Phone, Person } from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    dob: '',
    voter_id: '',
    password: '',
    password_confirm: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Client-side validation
    if (formData.password !== formData.password_confirm) {
      setError("Passwords don't match")
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      setLoading(false)
      return
    }

    if (!formData.dob) {
      setError("Date of birth is required")
      setLoading(false)
      return
    }

    if (!formData.voter_id) {
      setError("Voter ID is required")
      setLoading(false)
      return
    }

    if (formData.voter_id.length !== 10) {
      setError("Voter ID must be exactly 10 characters long")
      setLoading(false)
      return
    }

    if (!/^[A-Z0-9]+$/i.test(formData.voter_id)) {
      setError("Voter ID must contain only letters and numbers")
      setLoading(false)
      return
    }

    // Check if user is at least 18 years old
    const today = new Date()
    const birthDate = new Date(formData.dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    if (age < 18) {
      setError("You must be at least 18 years old to register")
      setLoading(false)
      return
    }

    const result = await register(formData)
    
    if (result.success) {
      setSuccess(result.message || 'Registration successful! Your account is pending INEC verification.')
      setError('')
      
      // Redirect after showing success message
      setTimeout(() => {
        navigate('/')
      }, 3000)
    } else {
      setError(result.error || 'Registration failed. Please try again.')
      setSuccess('')
      
      // Show detailed field errors if available
      if (result.details) {
        const fieldErrors = []
        Object.keys(result.details).forEach(field => {
          if (Array.isArray(result.details[field])) {
            fieldErrors.push(`${field}: ${result.details[field].join(', ')}`)
          }
        })
        if (fieldErrors.length > 0) {
          setError(`${result.error}\n${fieldErrors.join('\n')}`)
        }
      }
    }
    
    setLoading(false)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #008751 0%, #008751 50%, #FFFFFF 50%, #FFFFFF 100%)',
      }}
    >
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper elevation={6} sx={{ padding: 4, width: '100%', borderRadius: 2 }}>
            <Typography component="h1" variant="h4" align="center" gutterBottom sx={{ color: '#008751', fontWeight: 'bold' }}>
              Register for Voting
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

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Full Name"
                name="name"
                autoComplete="name"
                autoFocus
                value={formData.name}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#008751' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                id="phone_number"
                label="Phone Number"
                name="phone_number"
                autoComplete="tel"
                value={formData.phone_number}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone sx={{ color: '#008751' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                id="dob"
                label="Date of Birth"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
                helperText="You must be at least 18 years old to register"
                sx={{ 
                  '& input': { 
                    color: '#333',
                  },
                  '& label': { 
                    color: '#666',
                  },
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                id="voter_id"
                label="Voter ID"
                name="voter_id"
                value={formData.voter_id}
                onChange={handleChange}
                inputProps={{
                  maxLength: 10,
                  style: { textTransform: 'uppercase' }
                }}
                helperText="Enter your 10-character alphanumeric voter ID"
                sx={{ 
                  '& input': { 
                    color: '#333',
                  },
                  '& label': { 
                    color: '#666',
                  },
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password_confirm"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                id="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ 
                  mt: 3, 
                  mb: 2,
                  backgroundColor: '#008751',
                  '&:hover': {
                    backgroundColor: '#006633',
                  },
                  py: 1.5,
                  fontWeight: 'bold'
                }}
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Register'}
              </Button>
              
              <Box textAlign="center">
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" sx={{ color: '#008751', fontWeight: 'medium' }}>
                    Already have an account? Sign In
                  </Typography>
                </Link>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  )
}

export default Register