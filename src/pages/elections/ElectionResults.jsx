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
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Avatar,
  Divider
} from '@mui/material'
import { 
  HowToVote, 
  TrendingUp, 
  Event, 
  AccessTime, 
  Refresh as RefreshIcon,
  EmojiEvents
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { electionsAPI } from '../../services/api'
import { Layout } from '../../components/layout/Layout'

const ElectionResults = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [liveResults, setLiveResults] = useState(null)
  const [refreshInterval, setRefreshInterval] = useState(null)
  const [activeElections, setActiveElections] = useState([])
  const [selectedElectionId, setSelectedElectionId] = useState('')

  useEffect(() => {
    // Load active elections
    loadActiveElections()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (selectedElectionId) {
        loadLiveResults(selectedElectionId)
      } else if (activeElections.length > 0) {
        // Load results for the first election by default
        const firstElectionId = activeElections[0].election_id
        loadLiveResults(firstElectionId)
      }
    }, 30000)
    
    setRefreshInterval(interval)
    
    // Clean up interval on component unmount
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [selectedElectionId, activeElections])

  useEffect(() => {
    if (selectedElectionId) {
      loadLiveResults(selectedElectionId)
    } else if (activeElections.length > 0) {
      // Load results for the first election by default
      const firstElectionId = activeElections[0].election_id
      setSelectedElectionId(firstElectionId)
      loadLiveResults(firstElectionId)
    }
  }, [selectedElectionId, activeElections])

  const loadActiveElections = async () => {
    try {
      const response = await electionsAPI.getActiveElections()
      setActiveElections(response.data || [])
    } catch (err) {
      setError('Failed to load active elections.')
      console.error('Error loading active elections:', err)
    }
  }

  const loadLiveResults = async (electionId) => {
    // Clear any previous errors when loading
    setError('')
    
    try {
      const response = await electionsAPI.getLiveResults(electionId)
      setLiveResults(response.data)
      // Clear loading state immediately after successful load
      setLoading(false)
    } catch (err) {
      setError('Failed to load live election results. Please try again.')
      console.error('Error loading live results:', err)
      // Clear loading state even on error
      setLoading(false)
    }
  }

  const handleElectionChange = (event) => {
    setSelectedElectionId(event.target.value)
  }

  const handleManualRefresh = () => {
    // Show loading indicator immediately when user clicks refresh
    setLoading(true)
    if (selectedElectionId) {
      loadLiveResults(selectedElectionId)
    } else if (activeElections.length > 0) {
      // Load results for the first election by default
      const firstElectionId = activeElections[0].election_id
      loadLiveResults(firstElectionId)
    }
  }

  const formatPercentage = (votes, total) => {
    if (total === 0) return '0.0%'
    return `${((votes / total) * 100).toFixed(1)}%`
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
          <Box>
            <Typography variant="h4" component="h1" sx={{ color: '#008751', fontWeight: 'bold' }}>
              Live Election Results
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Real-time voting results and statistics
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            onClick={handleManualRefresh}
            disabled={loading}
            startIcon={<RefreshIcon />}
            sx={{ 
              backgroundColor: '#008751',
              '&:hover': {
                backgroundColor: '#006633'
              },
              px: 3,
              py: 1.5,
              borderRadius: 2
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Refresh Results'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Election Selector */}
        {activeElections.length > 0 && (
          <Card sx={{ mb: 4, boxShadow: 3, borderRadius: 2 }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={8}>
                  <FormControl fullWidth>
                    <InputLabel>Select Election</InputLabel>
                    <Select
                      value={selectedElectionId}
                      label="Select Election"
                      onChange={handleElectionChange}
                      sx={{ borderRadius: 2 }}
                    >
                      {activeElections.map((election) => (
                        <MenuItem key={election.election_id} value={election.election_id}>
                          {election.title} - {election.type.replace('_', ' ')}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Chip 
                      icon={<Event />} 
                      label={`${activeElections.length} Active Elections`} 
                      color="success" 
                      sx={{ fontWeight: 'bold' }} 
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {liveResults && (
          <Box>
            {/* Election Summary */}
            <Card sx={{ mb: 4, boxShadow: 4, borderRadius: 3, border: '1px solid #e0e0e0' }}>
              <CardHeader
                title={
                  <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: '#333' }}>
                    {liveResults.election_title}
                  </Typography>
                }
                subheader={
                  <Typography variant="body1" sx={{ color: '#666' }}>
                    {liveResults.election_type.replace('_', ' ')} Election
                  </Typography>
                }
                avatar={
                  <Avatar sx={{ bgcolor: '#008751' }}>
                    <HowToVote />
                  </Avatar>
                }
                action={
                  <Chip 
                    icon={<AccessTime />}
                    label={liveResults.status} 
                    color={liveResults.status === 'ongoing' ? 'success' : 'default'} 
                    sx={{ 
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      height: '32px'
                    }}
                  />
                }
                sx={{ 
                  backgroundColor: '#f5f5f5',
                  borderBottom: '1px solid #e0e0e0'
                }}
              />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', boxShadow: 2, backgroundColor: '#e8f5e9' }}>
                      <TrendingUp sx={{ fontSize: 40, color: '#008751', mb: 1 }} />
                      <Typography variant="h4" sx={{ color: '#008751', fontWeight: 'bold' }}>
                        {liveResults.total_votes}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#333', fontWeight: 'medium' }}>
                        Total Votes
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', boxShadow: 2, backgroundColor: '#e3f2fd' }}>
                      <HowToVote sx={{ fontSize: 40, color: '#2196f3', mb: 1 }} />
                      <Typography variant="h4" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                        {liveResults.live_results.length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#333', fontWeight: 'medium' }}>
                        Candidates
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', boxShadow: 2, backgroundColor: '#fff3e0' }}>
                      <Event sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                      <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                        {new Date(liveResults.last_updated).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#333', fontWeight: 'medium' }}>
                        Last Updated
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', boxShadow: 2, backgroundColor: '#f3e5f5' }}>
                      <AccessTime sx={{ fontSize: 40, color: '#9c27b0', mb: 1 }} />
                      <Typography variant="h6" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
                        {new Date(liveResults.last_updated).toLocaleTimeString()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#333', fontWeight: 'medium' }}>
                        Time
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
                
                {/* Last refreshed timestamp */}
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Last refreshed: {new Date().toLocaleTimeString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Results Table */}
            <Card sx={{ boxShadow: 4, borderRadius: 3, border: '1px solid #e0e0e0' }}>
              <CardHeader 
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmojiEvents sx={{ mr: 1, color: '#ff9800' }} />
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
                      Candidate Results
                    </Typography>
                  </Box>
                } 
                sx={{ 
                  backgroundColor: '#f0f0f0',
                  borderBottom: '1px solid #e0e0e0'
                }}
              />
              <Divider />
              <CardContent>
                <TableContainer component={Paper} sx={{ boxShadow: 2, borderRadius: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#008751' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>Position</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>Candidate</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>Party</TableCell>
                        <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>Votes</TableCell>
                        <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {liveResults.live_results.map((candidate, index) => {
                        const percentage = liveResults.total_votes > 0 
                          ? ((candidate.vote_count / liveResults.total_votes) * 100)
                          : 0
                        
                        return (
                          <TableRow 
                            key={candidate.candidate_id}
                            sx={{ 
                              backgroundColor: index === 0 ? 'rgba(76, 175, 80, 0.1)' : 'inherit',
                              '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                              '&:hover': { backgroundColor: 'rgba(0, 135, 81, 0.05)' }
                            }}
                          >
                            <TableCell sx={{ fontWeight: 'medium' }}>
                              {candidate.position}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {index === 0 && (
                                  <Chip 
                                    icon={<EmojiEvents />}
                                    label="Leading" 
                                    size="small" 
                                    color="success" 
                                    sx={{ mr: 1, fontWeight: 'bold' }} 
                                  />
                                )}
                                <Box>
                                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                    {candidate.name}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={candidate.party} 
                                size="small" 
                                sx={{ 
                                  backgroundColor: '#e3f2fd',
                                  color: '#1976d2',
                                  fontWeight: 'bold'
                                }} 
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                              {candidate.vote_count.toLocaleString()}
                            </TableCell>
                            <TableCell align="right">
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                  {formatPercentage(candidate.vote_count, liveResults.total_votes)}
                                </Typography>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={percentage} 
                                  sx={{ 
                                    height: 10, 
                                    borderRadius: 5,
                                    backgroundColor: '#e0e0e0',
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: index === 0 ? '#4caf50' : '#2196f3'
                                    }
                                  }} 
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

            {/* Live results informational alert removed — a manual refresh button is available */}
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