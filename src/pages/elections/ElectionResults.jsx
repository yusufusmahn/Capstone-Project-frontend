import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  LinearProgress
} from '@mui/material'
import { useAuth } from '../../contexts/AuthContext'
import { electionsAPI } from '../../services/api'
import { Layout } from '../../components/layout/Layout'

const ElectionResults = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [liveResults, setLiveResults] = useState(null)
  const [refreshInterval, setRefreshInterval] = useState(null)

  useEffect(() => {
    // Load live results for the first active election
    loadLiveResults()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadLiveResults()
    }, 30000)
    
    setRefreshInterval(interval)
    
    // Clean up interval on component unmount
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [])

  const loadLiveResults = async () => {
    setLoading(true)
    setError('')
    
    try {
      // For demo purposes, we'll get the first active election
      // In a real implementation, you might want to let users select which election to view
      const activeElectionsResponse = await electionsAPI.getActiveElections()
      
      if (activeElectionsResponse.data.length > 0) {
        const electionId = activeElectionsResponse.data[0].election_id
        const response = await electionsAPI.getLiveResults(electionId)
        setLiveResults(response.data)
      } else {
        setError('No active elections found.')
      }
    } catch (err) {
      setError('Failed to load live election results. Please try again.')
      console.error('Error loading live results:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleManualRefresh = () => {
    loadLiveResults()
  }

  if (loading && !liveResults) {
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, mt: 2 }}>
          <Typography variant="h4" component="h1" sx={{ color: '#008751', fontWeight: 'bold' }}>
            Live Election Results
          </Typography>
          <Button 
            variant="outlined" 
            onClick={handleManualRefresh}
            disabled={loading}
            sx={{ 
              borderColor: '#008751',
              color: '#008751',
              '&:hover': {
                borderColor: '#006633',
                backgroundColor: 'rgba(0, 135, 81, 0.05)'
              },
              px: 3,
              py: 1
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#008751' }} /> : 'Refresh Results'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {liveResults && (
          <Box>
            <Card sx={{ mb: 3 }}>
              <CardHeader
                title={liveResults.election_title}
                subheader={`${liveResults.election_type.replace('_', ' ')} Election`}
                action={
                  <Chip 
                    label={liveResults.status} 
                    color={liveResults.status === 'ongoing' ? 'success' : 'default'} 
                  />
                }
              />
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Votes Cast: {liveResults.total_votes}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last updated: {new Date(liveResults.last_updated).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Candidate Results" />
              <CardContent>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Position</TableCell>
                        <TableCell>Candidate</TableCell>
                        <TableCell>Party</TableCell>
                        <TableCell align="right">Votes</TableCell>
                        <TableCell align="right">Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {liveResults.live_results.map((candidate, index) => {
                        const percentage = liveResults.total_votes > 0 
                          ? ((candidate.vote_count / liveResults.total_votes) * 100).toFixed(1)
                          : 0
                        
                        return (
                          <TableRow 
                            key={candidate.candidate_id}
                            sx={{ 
                              backgroundColor: index === 0 ? 'rgba(76, 175, 80, 0.1)' : 'inherit'
                            }}
                          >
                            <TableCell>{candidate.position}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {index === 0 && (
                                  <Chip 
                                    label="Leading" 
                                    size="small" 
                                    color="success" 
                                    sx={{ mr: 1 }} 
                                  />
                                )}
                                {candidate.name}
                              </Box>
                            </TableCell>
                            <TableCell>{candidate.party}</TableCell>
                            <TableCell align="right">{candidate.vote_count}</TableCell>
                            <TableCell align="right">
                              <Box>
                                <Typography variant="body2">{percentage}%</Typography>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={parseFloat(percentage)} 
                                  sx={{ mt: 1 }} 
                                />
                              </Box>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            <Alert severity="info" sx={{ mt: 3 }}>
              <strong>Live Results:</strong> This page automatically refreshes every 30 seconds to show 
              the most current vote counts. The leading candidate is highlighted in green.
            </Alert>
          </Box>
        )}

        {!liveResults && !loading && !error && (
          <Alert severity="info">
            No live election results available at this time.
          </Alert>
        )}
      </Container>
    </Layout>
  )
}

export default ElectionResults