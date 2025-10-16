import { useEffect, useState } from 'react'
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Alert
} from '@mui/material'
import { HowToVote, BarChart, Report, Settings, Refresh } from '@mui/icons-material'
import ActionButton from '../components/common/ActionButton'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Layout } from '../components/layout/Layout'

const Dashboard = () => {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const getQuickActions = () => {
    const actions = []

    if (user?.role === 'voter') {
      actions.push(
        {
          title: 'Cast Your Vote',
          description: 'Participate in ongoing elections',
          icon: <HowToVote />,
          action: () => navigate('/vote'),
          // use success so icons render green
          color: 'success'
        },
        {
          title: 'View Results',
          description: 'Check election results',
          icon: <BarChart />,
          action: () => navigate('/results'),
          // Use success so the icon uses the green color from the theme
          color: 'success'
        },
        {
          title: 'Report Incident',
          description: 'Report voting irregularities',
          icon: <Report />,
          action: () => navigate('/report-incident'),
          // make the incident icon green as well
          color: 'success'
        }
      )
    } else if (user?.role === 'admin' || user?.role === 'inec_official') {
      const isInec = user?.role === 'inec_official'
      actions.push(
        {
          title: isInec ? 'Manage Voters' : 'Manage Elections',
          description: isInec ? 'Verify and manage voter registrations' : 'Create and manage elections',
          icon: <Settings />,
          action: () => navigate(isInec ? '/manage-voters' : '/admin'),
          // make manage elections green for admin users
          color: 'success'
        },
        {
          title: 'View Results',
          description: 'Monitor election results',
          icon: <BarChart />,
          action: () => navigate('/results'),
          // make admin/result icons green
          color: 'success'
        },
        {
          title: 'Handle Incidents',
          description: 'Review incident reports',
          icon: <Report />,
          action: () => navigate('/incidents'),
      // make incident icon green as well
      color: 'success'
        }
      )
    }

    return actions
  }

  const quickActions = getQuickActions()
  // quickActions computed

  return (
    <Layout>
      <Box 
        sx={{ 
          minHeight: '100vh',
          background: 'transparent',
          pt: 2,
          pb: 4
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#008751', fontWeight: 'bold' }}>
              Welcome, {user?.name}
            </Typography>
            <Typography variant="h6" sx={{ color: '#666' }}>
              Role: {user?.role?.replace('_', ' ').toUpperCase()}
            </Typography>
          </Box>

          {user?.role === 'voter' && profile && !profile.registration_verified && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Your voter registration is pending verification. Please wait for INEC officials to verify your details.
            </Alert>
          )}

          <Grid container spacing={3}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 6
                    },
                    borderLeft: `4px solid ${action.color === 'success' ? '#008751' : action.color === 'primary' ? '#1976d2' : action.color === 'secondary' ? '#dc004e' : '#ff9800'}`
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ mr: 2, color: `${action.color}.main` }}>
                        {action.icon}
                      </Box>
                      <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                        {action.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {action.description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    {/* Map colors: primary -> green, secondary -> white, warning -> green */}
                    {action.color === 'secondary' ? (
                      <ActionButton
                        onClick={action.action}
                        sx={{ ml: 1, mb: 1, backgroundColor: 'white', color: '#333', '&:hover': { backgroundColor: '#f5f5f5' } }}
                      >
                        Get Started
                      </ActionButton>
                    ) : (
                      <ActionButton
                        onClick={action.action}
                        sx={{ ml: 1, mb: 1 }}
                      >
                        Get Started
                      </ActionButton>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {user?.role === 'voter' && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ color: '#008751', fontWeight: 'bold' }}>
                Voter Information
              </Typography>
              <Card 
                sx={{ 
                  boxShadow: 3,
                  borderRadius: 2,
                  border: '1px solid #e0e0e0'
                }}
              >
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <strong>Voter ID:</strong> {profile?.voter_id || 'Not assigned'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <strong>Voter's Card ID:</strong> {profile?.voters_card_id || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <strong>Registration Status:</strong> 
                        <Box 
                          component="span" 
                          sx={{ 
                            ml: 1,
                            color: profile?.registration_verified ? 'success.main' : 'warning.main',
                            fontWeight: 'bold'
                          }}
                        >
                          {profile?.registration_verified ? 'Verified' : 'Pending Verification'}
                        </Box>
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <strong>Voting Status:</strong>
                        <Box 
                          component="span" 
                          sx={{ 
                            ml: 1,
                            color: profile?.can_vote ? 'success.main' : 'error.main',
                            fontWeight: 'bold'
                          }}
                        >
                          {profile?.can_vote ? 'Eligible to Vote' : 'Not Eligible'}
                        </Box>
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          )}
        </Container>
      </Box>
    </Layout>
  )
}

// Dashboard exported
export default Dashboard