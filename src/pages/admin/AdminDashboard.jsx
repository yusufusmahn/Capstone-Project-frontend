import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Paper,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab,
  Tooltip,
  IconButton
} from '@mui/material'
import {
  Dashboard,
  HowToVote,
  People,
  Report,
  BarChart,
  Add,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  Verified,
  Refresh,
  Warning
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { authAPI, adminAPI, electionsAPI, incidentsAPI } from '../../services/api'
import { Layout } from '../../components/layout/Layout'
import ErrorBoundary from '../../components/common/ErrorBoundary'
import ActionButton from '../../components/common/ActionButton'

const AdminDashboard = () => {
  const { user, isAdmin, isInec } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tabValue, setTabValue] = useState(0)
  const [stats, setStats] = useState({
    totalElections: 0,
    activeElections: 0,
    totalVoters: 0,
    verifiedVoters: 0,
    pendingVoters: 0,
    totalIncidents: 0,
    pendingIncidents: 0
  })
  const [elections, setElections] = useState([])
  const [voters, setVoters] = useState([])
  const [incidents, setIncidents] = useState([])
  const [showElectionForm, setShowElectionForm] = useState(false)
  const [showCandidateForm, setShowCandidateForm] = useState(false)
  const [showCreateAdminDialog, setShowCreateAdminDialog] = useState(false)
  const [showCreateInecDialog, setShowCreateInecDialog] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', phone_number: '', password: '' })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmPayload, setConfirmPayload] = useState(null)
  const [electionForm, setElectionForm] = useState({
    title: '',
    type: '',
    description: '',
    start_date: '',
    end_date: ''
  })
  const [candidateForm, setCandidateForm] = useState({
    name: '',
    party: '',
    position: '',
    biography: '',
    election: '',
    photo: null
  })
  const [lastRefreshed, setLastRefreshed] = useState(new Date())

  const loadData = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await Promise.all([
        loadDashboardStats(),
        loadElections(),
        loadVoters(),
        loadIncidents()
      ]);
      setLastRefreshed(new Date())
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    loadData().catch(err => {
      console.error('Failed to initialize dashboard:', err);
      setError('Failed to initialize dashboard. Please refresh the page.');
    });
    
    const interval = setInterval(() => {
      // periodic check placeholder
    }, 60000);
    
    return () => clearInterval(interval);
  }, [])

  const loadElections = async () => {
    try {
  const response = await electionsAPI.getElections()
  const electionsData = response.data || []
      setElections(electionsData)
    } catch (err) {
      console.error('Failed to load elections:', err)
      setError('Failed to load elections: ' + (err.response?.data?.message || err.message || err.toString()))
    }
  }

  const loadDashboardStats = async () => {
    try {
      // loading dashboard stats
      try {
        const statsRes = await adminAPI.getDashboardStats()
        // statsRes may be an aggregated response
        setStats({
          totalElections: Number(statsRes.totalElections || 0),
          activeElections: Number(statsRes.activeElections || 0),
          totalVoters: Number(statsRes.totalVoters || 0),
          verifiedVoters: Number(statsRes.verifiedVoters || 0),
          pendingVoters: Number(statsRes.pendingVoters || 0),
          totalIncidents: Number(statsRes.totalIncidents || 0),
          pendingIncidents: Number(statsRes.pendingIncidents || 0)
        })
        return
      } catch (err) {
        console.warn('adminAPI.getDashboardStats failed, falling back to manual aggregation:', err)
      }

      const [electionsRes, votersRes, incidentsRes] = await Promise.all([
        electionsAPI.getElections(),
        authAPI.getVoters(),
        incidentsAPI.getIncidents()
      ])

      const electionsData = electionsRes?.data || []
      const votersData = votersRes?.data || []
      const incidentsData = incidentsRes?.data || []

      setStats({
        totalElections: electionsData.length || 0,
        activeElections: (electionsData.filter ? electionsData.filter(e => e.status === 'ongoing').length : 0) || 0,
        totalVoters: votersData.length || 0,
        verifiedVoters: (votersData.filter ? votersData.filter(v => v.registration_verified).length : 0) || 0,
        pendingVoters: (votersData.filter ? votersData.filter(v => !v.registration_verified).length : 0) || 0,
        totalIncidents: incidentsData.length || 0,
        pendingIncidents: (incidentsData.filter ? incidentsData.filter(i => i.status === 'pending').length : 0) || 0
      })
    } catch (err) {
      console.error('Failed to load dashboard stats:', err)
    }
  }

  const loadVoters = async () => {
    try {
  const response = await authAPI.getVoters()
      setVoters(response.data || [])
    } catch (err) {
      console.error('Failed to load voters:', err)
      setError('Failed to load voters: ' + (err.response?.data?.message || err.message || err.toString()))
    }
  }

  const loadIncidents = async () => {
    try {
  const response = await incidentsAPI.getIncidents()
  // incidents loaded
      setIncidents(response.data || [])
    } catch (err) {
      console.error('Failed to load incidents:', err)
      setError('Failed to load incidents: ' + (err.response?.data?.message || err.message || err.toString()))
    }
  }

  const handleTabChange = (event, newValue) => {
  // switch tab handler
    setTabValue(newValue)
    
    switch(newValue) {
      case 0:
        loadDashboardStats().catch(err => {
          console.error('Failed to load dashboard stats:', err)
          setError('Failed to load dashboard stats: ' + (err.message || err.toString()))
        })
        break
      case 1:
        loadElections().catch(err => {
          console.error('Failed to load elections:', err)
          setError('Failed to load elections: ' + (err.message || err.toString()))
        })
        break
      case 2:
        loadVoters().catch(err => {
          console.error('Failed to load voters:', err)
          setError('Failed to load voters: ' + (err.message || err.toString()))
        })
        break
      case 3:
        loadIncidents().catch(err => {
          console.error('Failed to load incidents:', err)
          setError('Failed to load incidents: ' + (err.message || err.toString()))
        })
        break
      default:
        break
    }
  }

  const handleElectionFormChange = (e) => {
    const { name, value } = e.target
    setElectionForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCandidateFormChange = (e) => {
    const { name, value } = e.target
    setCandidateForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCandidatePhotoChange = (e) => {
    const file = e.target.files?.[0] || null
    setCandidateForm(prev => ({
      ...prev,
      photo: file
    }))
  }

  const handleCreateElection = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await electionsAPI.createElection(electionForm)
  // election created
      setSuccess('Election created successfully! Elections with start dates that have passed need to be manually started using the management commands.')
      setShowElectionForm(false)
      setElectionForm({
        title: '',
        type: '',
        description: '',
        start_date: '',
        end_date: ''
      })
      await new Promise(resolve => setTimeout(resolve, 1000))
      await Promise.all([
        loadElections(),
        loadDashboardStats()
      ])
  // data reloaded after election creation
    } catch (err) {
      console.error('Failed to create election:', err)
      setError('Failed to create election: ' + (err.response?.data?.detail || err.response?.data?.error || err.message || err.toString()))
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCandidate = async () => {
    setLoading(true)
    setError('')
    try {
  // creating candidate
      let payload = candidateForm
      if (candidateForm.photo) {
        const formData = new FormData()
        formData.append('name', candidateForm.name)
        formData.append('party', candidateForm.party)
        formData.append('position', candidateForm.position)
        formData.append('biography', candidateForm.biography)
        formData.append('election', candidateForm.election)
        formData.append('photo', candidateForm.photo)
        payload = formData
      }

  const response = await electionsAPI.createCandidate(payload)
  // candidate created
      let photoSaved = false
      try {
        const candidatesRes = await electionsAPI.getCandidates(candidateForm.election)
        const created = candidatesRes.data.find(c => c.name === candidateForm.name && c.party === candidateForm.party)
        if (created && created.photo) photoSaved = true
      } catch (e) {
        console.warn('Could not verify candidate photo after creation:', e)
      }

  setSuccess('Candidate created successfully! The candidate has been added. If you uploaded a photo it should appear in the candidate list.')
      setShowCandidateForm(false)
      setCandidateForm({
        name: '',
        party: '',
        position: '',
        biography: '',
        election: '',
        photo: null
      })
      await loadElections()
    } catch (err) {
      console.error('Failed to create candidate:', err)
      setError('Failed to create candidate: ' + (err.response?.data?.detail || err.response?.data?.error || err.message || err.toString()))
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFormChange = (e) => {
    const { name, value } = e.target
    setCreateForm(prev => ({ ...prev, [name]: value }))
  }

  const handleCreateAdmin = async () => {
    setLoading(true)
    setError('')
    try {
      const payload = {
        name: createForm.name,
        phone_number: createForm.phone_number,
        password: createForm.password
      }
      const resp = await authAPI.createAdmin(payload)
      setSuccess(resp.data?.message || 'Admin created successfully')
      setShowCreateAdminDialog(false)
      setCreateForm({ name: '', phone_number: '', password: '' })
      await Promise.all([loadVoters(), loadDashboardStats()])
    } catch (err) {
      console.error('Create admin failed', err)
      setError(err.response?.data?.details || err.response?.data?.error || err.message || 'Failed to create admin')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInec = async () => {
    setLoading(true)
    setError('')
    try {
      const payload = {
        name: createForm.name,
        phone_number: createForm.phone_number,
        password: createForm.password
      }
      const resp = await authAPI.createInecOfficial(payload)
      setSuccess(resp.data?.message || 'INEC Official created successfully')
      setShowCreateInecDialog(false)
      setCreateForm({ name: '', phone_number: '', password: '' })
      await Promise.all([loadVoters(), loadDashboardStats()])
    } catch (err) {
      console.error('Create INEC official failed', err)
      setError(err.response?.data?.details || err.response?.data?.error || err.message || 'Failed to create INEC official')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyVoter = async (voterId) => {
    setConfirmAction('verify')
    setConfirmPayload(voterId)
    setConfirmOpen(true)
  }

  const handleDeleteElection = async (electionId) => {
    if (window.confirm('Are you sure you want to delete this election?')) {
      try {
        await electionsAPI.deleteElection(electionId)
        setSuccess('Election deleted successfully!')
        loadElections()
        loadDashboardStats()
      } catch (err) {
        setError('Failed to delete election.')
      }
    }
  }

  const handleTriggerElectionManagement = async () => {
    setLoading(true)
    try {
      const response = await electionsAPI.checkElectionStatus()
      setSuccess('Election status check completed successfully. Elections have been updated based on current time.')
      await loadData()
    } catch (err) {
      console.error('Failed to trigger election management:', err)
      setError('Failed to trigger election management: ' + (err.response?.data?.error || err.message || err.toString()))
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success'
      case 'ongoing': return 'primary'
      case 'upcoming': return 'info'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  return (
    <ErrorBoundary>
    <Layout>
      <Container maxWidth="lg" className="admin-dashboard">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ color: '#008751', fontWeight: 'bold' }}>
            Admin Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2, color: 'text.secondary' }}>
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </Typography>
            <IconButton 
              onClick={loadData} 
              size="large"
              sx={{ 
                backgroundColor: '#e8f5e9',
                '&:hover': {
                  backgroundColor: '#c8e6c9'
                }
              }}
              disabled={loading}
            >
              <Refresh sx={{ color: '#008751' }} />
            </IconButton>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

          <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card className="soft-card" sx={{ 
              boxShadow: 3, 
              border: 0,
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <HowToVote sx={{ fontSize: 40, color: '#008751' }} />
                  <Typography variant="h4" align="right">
                    {loading ? <CircularProgress size={30} /> : (stats?.totalElections || 0)}
                  </Typography>
                </Box>
                <Typography variant="body2" align="right" color="text.secondary" sx={{ mt: 1 }}>
                  Total Elections
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card className="soft-card" sx={{ 
              boxShadow: 3, 
              border: 0,
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <CheckCircle sx={{ fontSize: 40, color: '#4caf50' }} />
                  <Typography variant="h4" align="right" color="primary">
                    {loading ? <CircularProgress size={30} /> : (stats?.activeElections || 0)}
                  </Typography>
                </Box>
                <Typography variant="body2" align="right" color="text.secondary" sx={{ mt: 1 }}>
                  Active Elections
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card className="soft-card" sx={{ 
              boxShadow: 3, 
              border: 0,
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <People sx={{ fontSize: 40, color: '#2196f3' }} />
                  <Typography variant="h4" align="right">
                    {loading ? <CircularProgress size={30} /> : (stats?.totalVoters || 0)}
                  </Typography>
                </Box>
                <Typography variant="body2" align="right" color="text.secondary" sx={{ mt: 1 }}>
                  Registered Voters
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card className="soft-card" sx={{ 
              boxShadow: 3, 
              border: 0,
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Warning sx={{ fontSize: 40, color: '#ff9800' }} />
                  <Typography variant="h4" align="right" color="warning.main">
                    {loading ? <CircularProgress size={30} /> : (stats?.pendingVoters || 0)}
                  </Typography>
                </Box>
                <Typography variant="body2" align="right" color="text.secondary" sx={{ mt: 1 }}>
                  Pending Verification
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          sx={{ mb: 3 }}
          TabIndicatorProps={{
            style: {
              backgroundColor: '#008751'
            }
          }}
        >
          <Tab icon={<Dashboard sx={{ color: '#008751' }} />} label="Overview" />
          <Tab icon={<HowToVote sx={{ color: '#008751' }} />} label="Elections" />
          <Tab icon={<People sx={{ color: '#008751' }} />} label="Voters" />
          <Tab icon={<Report sx={{ color: '#008751' }} />} label="Incidents" />
          <Tab icon={<BarChart sx={{ color: '#008751' }} />} label="Reports" />
        </Tabs>

        {tabValue === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card className="soft-card" sx={{ boxShadow: 3, borderRadius: 2 }}>
                <CardHeader 
                  title="Quick Actions" 
                  sx={{ backgroundColor: '#e8f5e9' }}
                />
                <CardContent>
                        <Typography variant="body1" component="div" sx={{ mb: 1 }}>
                          Welcome to the admin dashboard. Here you can manage elections, verify voters, and monitor incidents.
                        </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 3 }}>
                    <ActionButton startIcon={<Add sx={{ color: '#008751' }} />} onClick={() => setShowElectionForm(true)}>Create Election</ActionButton>
                    <ActionButton startIcon={<Add sx={{ color: '#008751' }} />} onClick={() => setShowCandidateForm(true)}>Add Candidate</ActionButton>
                    <ActionButton startIcon={<People sx={{ color: '#008751' }} />} onClick={() => setTabValue(2)}>Verify Voters</ActionButton>
                    {user?.is_superuser && (
                      <ActionButton startIcon={<Add sx={{ color: '#008751' }} />} onClick={() => setShowCreateAdminDialog(true)}>Create Admin</ActionButton>
                    )}

                    {(user?.is_superuser || isAdmin) && (
                      <ActionButton startIcon={<People sx={{ color: '#008751' }} />} onClick={() => setShowCreateInecDialog(true)}>Create INEC Official</ActionButton>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card className="soft-card" sx={{ boxShadow: 3, borderRadius: 2 }}>
                <CardHeader 
                  title="Quick Stats" 
                  sx={{ backgroundColor: '#e8f5e9' }}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2">Pending Incidents:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{stats?.pendingIncidents || 0}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2">Verified Voters:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{stats?.verifiedVoters || 0}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Total Incidents:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{stats?.totalIncidents || 0}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {tabValue === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5">Manage Elections ({elections.length})</Typography>
              <Box>
                
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowElectionForm(true)}
                  sx={{ 
                    backgroundColor: '#008751',
                    '&:hover': {
                      backgroundColor: '#006633'
                    },
                    borderRadius: 2
                  }}
                >
                  Create Election
                </Button>
              </Box>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
              </Box>
            ) : elections.length === 0 ? (
              <Alert severity="info">No elections found.</Alert>
            ) : (
              <Grid container spacing={3}>
                {elections.map((election) => (
                  <Grid item xs={12} key={election.election_id}>
                    <Card sx={{ 
                      boxShadow: 4, 
                      borderRadius: 3,
                      border: '1px solid #e0e0e0',
                      backgroundColor: '#fafafa',
                      '&:hover': {
                        boxShadow: 6,
                        transform: 'translateY(-2px)',
                        transition: 'all 0.3s ease'
                      }
                    }}>
                      <CardHeader
                        title={
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
                            {election.title}
                          </Typography>
                        }
                        subheader={
                          <Typography variant="body2" sx={{ color: '#666' }}>
                            {election.type.replace('_', ' ')} Election
                          </Typography>
                        }
                        action={
                          <Chip 
                            label={election.status} 
                            color={getStatusColor(election.status)} 
                            size="small"
                            sx={{ 
                              fontWeight: 'bold',
                              fontSize: '0.8rem',
                              minWidth: '80px'
                            }}
                          />
                        }
                        sx={{ 
                          backgroundColor: '#f0f0f0',
                          borderBottom: '1px solid #e0e0e0',
                          pb: 1
                        }}
                      />
                      <CardContent>
                        <Typography variant="body1" color="text.primary" component="div" sx={{ minHeight: '60px', mb: 1 }}>
                          {election.description || 'No description provided'}
                        </Typography>
                        
                        <Box className="election-dates" sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                          <ActionButton startIcon={<People />} onClick={() => setShowCreateInecDialog(true)}>Create INEC Official</ActionButton>
                        </Box>
                        
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid item xs={6} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center', boxShadow: 2, backgroundColor: '#e8f5e9' }}>
                              <Typography variant="h5" sx={{ color: '#008751', fontWeight: 'bold' }}>
                                {election.candidates?.length || 0}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#333', fontWeight: 'medium' }}>
                                Candidates
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center', boxShadow: 2, backgroundColor: '#e3f2fd' }}>
                              <Typography variant="h5" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                                {election.vote_count || 0}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#333', fontWeight: 'medium' }}>
                                Total Votes
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center', boxShadow: 2, backgroundColor: election.status === 'ongoing' ? '#e8f5e9' : '#f5f5f5' }}>
                              <Typography variant="h5" sx={{ color: election.status === 'ongoing' ? '#4caf50' : '#9e9e9e', fontWeight: 'bold' }}>
                                {election.status === 'ongoing' ? 'Live' : 'Not Live'}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#333', fontWeight: 'medium' }}>
                                Status
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center', boxShadow: 2, backgroundColor: '#fff3e0' }}>
                              <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                                {election.created_by?.name || 'Unknown'}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#333', fontWeight: 'medium' }}>
                                Created By
                              </Typography>
                            </Paper>
                          </Grid>
                        </Grid>
                        
                        {election.candidates && election.candidates.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" gutterBottom className="candidates-heading" sx={{ fontWeight: 'bold', color: '#333', mb: 2 }}>
                              Candidates:
                            </Typography>
                            <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: 2 }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ backgroundColor: '#008751' }}>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Party</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Position</TableCell>
                                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Votes</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {election.candidates.map((candidate) => (
                                    <TableRow 
                                      key={candidate.candidate_id}
                                      sx={{ 
                                        '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' },
                                        '&:hover': { backgroundColor: '#e8f5e9' }
                                      }}
                                    >
                                      <TableCell sx={{ fontWeight: 'medium' }}>{candidate.name}</TableCell>
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
                                      <TableCell>{candidate.position}</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 'bold', color: '#008751' }}>
                                        {candidate.vote_count !== undefined ? candidate.vote_count : 'N/A'}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        )}
                        
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => {
                              setCandidateForm(prev => ({ ...prev, election: election.election_id }))
                              setShowCandidateForm(true)
                            }}
                            sx={{ 
                              mr: 1,
                              backgroundColor: '#008751',
                              '&:hover': {
                                backgroundColor: '#006633'
                              },
                              borderRadius: 2
                            }}
                          >
                            Add Candidate
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => handleDeleteElection(election.election_id)}
                            sx={{ 
                              backgroundColor: '#f44336',
                              '&:hover': {
                                backgroundColor: '#d32f2f'
                              },
                              borderRadius: 2
                            }}
                          >
                            Delete
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5">Voter Management</Typography>
              
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
              </Box>
            ) : voters.length === 0 ? (
              <Alert severity="info">No voters found.</Alert>
            ) : (
              <Card className="soft-card" sx={{ boxShadow: 3, borderRadius: 2 }}>
                <CardHeader 
                  title="Registered Voters" 
                  sx={{ backgroundColor: '#e8f5e9' }}
                />
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#008751' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Phone Number</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Age</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Registration Status</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Voting Eligibility</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {voters.map((voter) => (
            <TableRow 
              key={voter.voter_id || voter.id}
                          sx={{ 
                            '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' },
                            '&:hover': { backgroundColor: '#e8f5e9' }
                          }}
                        >
                          <TableCell sx={{ fontWeight: 'medium' }}>{(voter.user && (voter.user.name || voter.user.full_name)) || voter.name || 'Unknown'}</TableCell>
                          <TableCell>{(voter.user && voter.user.phone_number) || voter.phone_number || 'N/A'}</TableCell>
                          <TableCell>
                            {(() => {
                              // Prefer server-provided age if present
                              const userObj = voter.user || {}
                              if (userObj.age !== undefined && userObj.age !== null) return userObj.age
                              // Fallback: compute from dob if available
                              if (userObj.dob) {
                                try {
                                  const dob = new Date(userObj.dob)
                                  const today = new Date()
                                  let age = today.getFullYear() - dob.getFullYear()
                                  const m = today.getMonth() - dob.getMonth()
                                  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
                                  return age
                                } catch (e) {
                                  return 'N/A'
                                }
                              }
                              return 'N/A'
                            })()}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={voter.registration_verified ? 'Verified' : 'Pending'}
                              color={voter.registration_verified ? 'success' : 'warning'}
                              size="small"
                              sx={{ fontWeight: 'bold' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={voter.can_vote ? 'Eligible' : 'Not Eligible'}
                              color={voter.can_vote ? 'success' : 'error'}
                              size="small"
                              sx={{ fontWeight: 'bold' }}
                            />
                          </TableCell>
                          <TableCell>
                            {!voter.registration_verified ? (
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<Verified />}
                                  onClick={() => handleVerifyVoter(voter.voter_id)}
                                  sx={{ 
                                    backgroundColor: '#4caf50',
                                    '&:hover': {
                                      backgroundColor: '#388e3c'
                                    },
                                    borderRadius: 2
                                  }}
                                >
                                  Verify
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => {
                                    setConfirmAction('cancel')
                                    setConfirmPayload(voter.voter_id)
                                    setConfirmOpen(true)
                                  }}
                                  sx={{ borderRadius: 2 }}
                                >
                                  Reject
                                </Button>
                              </Box>
                            ) : (
                              <Chip 
                                label="Verified" 
                                color="success" 
                                size="small"
                                sx={{ fontWeight: 'bold' }}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}
          </Box>
        )}

        {tabValue === 3 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5">Incident Reports ({incidents.length})</Typography>
              
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
              </Box>
            ) : incidents.length === 0 ? (
              <Alert severity="info">No incidents reported.</Alert>
            ) : (
              <Grid container spacing={3}>
                {incidents.map((incident, _idx) => (
                  <Grid item xs={12} key={incident.id ?? incident.incident_id ?? `incident-${_idx}`}>
                    <Card sx={{ 
                      boxShadow: 3, 
                      borderRadius: 2,
                      borderLeft: incident.status === 'pending' ? '4px solid #ff9800' : 
                                  incident.status === 'resolved' ? '4px solid #4caf50' : 
                                  '4px solid #f44336',
                      backgroundColor: '#fafafa'
                    }}>
                      <CardHeader
                        title={
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
                            {incident.title}
                          </Typography>
                        }
                        subheader={
                          <Typography variant="body2" sx={{ color: '#666' }}>
                            Reported by {incident.reported_by?.name || 'Unknown'} on {new Date(incident.created_at).toLocaleString()}
                          </Typography>
                        }
                        action={
                          <Chip 
                            label={incident.status} 
                            color={
                              incident.status === 'pending' ? 'warning' : 
                              incident.status === 'resolved' ? 'success' : 'error'
                            } 
                            size="small"
                            sx={{ 
                              fontWeight: 'bold',
                              fontSize: '0.8rem'
                            }}
                          />
                        }
                        sx={{ 
                          backgroundColor: '#f0f0f0',
                          borderBottom: '1px solid #e0e0e0'
                        }}
                      />
                      <CardContent>
                        <Typography variant="body1" color="text.primary" component="div" sx={{ mb: 1 }}>
                          {incident.description}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Chip 
                            label={incident.election?.title || 'No Election'} 
                            size="small" 
                            sx={{ 
                              backgroundColor: '#e3f2fd',
                              color: '#1976d2',
                              fontWeight: 'bold'
                            }} 
                          />
                          <Chip 
                            label={incident.category} 
                            size="small" 
                            sx={{ 
                              backgroundColor: '#fff3e0',
                              color: '#f57c00',
                              fontWeight: 'bold'
                            }} 
                          />
                        </Box>
                        
                        {incident.evidence_files && incident.evidence_files.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Evidence:</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {incident.evidence_files.map((file) => (
                                <Chip 
                                  key={file}
                                  label={file.split('/').pop()}
                                  size="small"
                                  sx={{ 
                                    backgroundColor: '#e8f5e9',
                                    color: '#2e7d32',
                                    fontWeight: 'bold'
                                  }} 
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {tabValue === 4 && (
          <Box>
            <Typography variant="h5" gutterBottom>Reports & Analytics</Typography>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <Paper className="soft-card" sx={{ p: 2, boxShadow: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary">Total Elections</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#008751' }}>{stats.totalElections || 0}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper className="soft-card" sx={{ p: 2, boxShadow: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary">Active Elections</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ff9800' }}>{stats.activeElections || 0}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper className="soft-card" sx={{ p: 2, boxShadow: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary">Total Voters</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2196f3' }}>{stats.totalVoters || 0}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper className="soft-card" sx={{ p: 2, boxShadow: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary">Pending Incidents</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#f44336' }}>{stats.pendingIncidents || 0}</Typography>
                </Paper>
              </Grid>
            </Grid>

            <Card className="soft-card" sx={{ boxShadow: 3, mb: 3 }}>
              <CardHeader title="Recent Incidents" />
              <CardContent>
                {incidents.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No incidents reported.</Typography>
                ) : (
                  <List>
                    {incidents.slice(0, 6).map((inc, _i) => (
                      <ListItem key={inc.id ?? inc.incident_id ?? `inc-${_i}`} divider>
                        <ListItemText
                          primary={inc.title || inc.incident_type}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.secondary">
                                {inc.description?.substring(0, 80) || ''}
                              </Typography>
                              <br />
                              <Typography component="span" variant="caption" color="text.secondary">
                                {inc.election?.title ? `Election: ${inc.election.title} • ` : ''}{new Date(inc.created_at).toLocaleString()}
                              </Typography>
                            </>
                          }
                        />
                        <Chip label={inc.status} size="small" sx={{ ml: 2 }} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>

            <Card className="soft-card" sx={{ boxShadow: 3 }}>
              <CardHeader title="Incidents by Status" />
              <CardContent>
                {incidents.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No incident data to display.</Typography>
                ) : (
                  (() => {
                    const counts = incidents.reduce((acc, it) => {
                      const s = it.status || 'unknown'
                      acc[s] = (acc[s] || 0) + 1
                      return acc
                    }, {})
                    const entries = Object.entries(counts)
                    const total = entries.reduce((s, [, v]) => s + v, 0)
                    const colorMap = {
                      pending: '#ff9800',
                      investigating: '#ffb300',
                      resolved: '#4caf50',
                      dismissed: '#9e9e9e',
                      unknown: '#90a4ae'
                    }

                    return (
                      <Box>
                        {entries.map(([status, cnt]) => {
                          const pct = Math.round((cnt / total) * 100)
                          const color = colorMap[status] || '#607d8b'
                          return (
                            <Box key={status} sx={{ mb: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{status.replace('_', ' ')}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{cnt} ({pct}%)</Typography>
                              </Box>
                              <Paper variant="outlined" sx={{ height: 12, borderRadius: 6, overflow: 'hidden' }}>
                                <Box sx={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
                              </Paper>
                            </Box>
                          )
                        })}
                        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {entries.map(([status]) => (
                            <Chip key={status} label={status} size="small" sx={{ backgroundColor: colorMap[status] || '#607d8b', color: 'white', fontWeight: 'bold' }} />
                          ))}
                        </Box>
                      </Box>
                    )
                  })()
                )}
              </CardContent>
            </Card>
          </Box>
        )}

        <Dialog open={showElectionForm} onClose={() => setShowElectionForm(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#333' }}>
              Create New Election
            </Typography>
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Election Title"
              name="title"
              value={electionForm.title}
              onChange={handleElectionFormChange}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Election Type</InputLabel>
              <Select
                name="type"
                value={electionForm.type}
                onChange={handleElectionFormChange}
                required
              >
                <MenuItem value="presidential">Presidential</MenuItem>
                <MenuItem value="gubernatorial">Gubernatorial</MenuItem>
                <MenuItem value="senatorial">Senatorial</MenuItem>
                <MenuItem value="house_of_reps">House of Representatives</MenuItem>
                <MenuItem value="house_of_assembly">State Assembly</MenuItem>
                <MenuItem value="local_government">Local Government</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={electionForm.description}
              onChange={handleElectionFormChange}
              margin="normal"
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="Start Date"
              name="start_date"
              type="datetime-local"
              value={electionForm.start_date}
              onChange={handleElectionFormChange}
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
              required
            />
            <TextField
              fullWidth
              label="End Date"
              name="end_date"
              type="datetime-local"
              value={electionForm.end_date}
              onChange={handleElectionFormChange}
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
              required
            />
          </DialogContent>
          <DialogActions>
            <ActionButton variant="text" scheme="cancel" onClick={() => setShowElectionForm(false)} sx={{ px: 2, py: 0.5, fontWeight: 600 }}>Cancel</ActionButton>
            <ActionButton onClick={handleCreateElection} disabled={loading}>{loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Create Election'}</ActionButton>
          </DialogActions>
        </Dialog>

        <Dialog open={showCandidateForm} onClose={() => setShowCandidateForm(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#333' }}>
              Add Candidate
            </Typography>
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Candidate Name"
              name="name"
              value={candidateForm.name}
              onChange={handleCandidateFormChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Political Party"
              name="party"
              value={candidateForm.party}
              onChange={handleCandidateFormChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Position"
              name="position"
              value={candidateForm.position}
              onChange={handleCandidateFormChange}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Select Election</InputLabel>
              <Select
                name="election"
                value={candidateForm.election}
                onChange={handleCandidateFormChange}
                required
              >
                {elections.map((election) => (
                  <MenuItem key={election.election_id} value={election.election_id}>
                    {election.title} ({election.type.replace('_', ' ')})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Biography"
              name="biography"
              value={candidateForm.biography}
              onChange={handleCandidateFormChange}
              margin="normal"
              multiline
              rows={4}
            />
            <input
              accept="image/*"
              type="file"
              onChange={handleCandidatePhotoChange}
              style={{ marginTop: '16px' }}
            />
          </DialogContent>
          <DialogActions>
            <ActionButton variant="text" scheme="cancel" onClick={() => setShowCandidateForm(false)} sx={{ px: 2, py: 0.5, fontWeight: 600 }}>Cancel</ActionButton>
            <ActionButton onClick={handleCreateCandidate} disabled={loading}>{loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Add Candidate'}</ActionButton>
          </DialogActions>
        </Dialog>

        <Dialog open={showCreateAdminDialog} onClose={() => setShowCreateAdminDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#333' }}>
              Create New Admin
            </Typography>
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={createForm.name}
              onChange={handleCreateFormChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Phone Number"
              name="phone_number"
              value={createForm.phone_number}
              onChange={handleCreateFormChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={createForm.password}
              onChange={handleCreateFormChange}
              margin="normal"
              required
            />
          </DialogContent>
          <DialogActions>
            <ActionButton variant="text" scheme="cancel" onClick={() => setShowCreateAdminDialog(false)} sx={{ px: 2, py: 0.5, fontWeight: 600 }}>Cancel</ActionButton>
            <ActionButton onClick={handleCreateAdmin} disabled={loading}>{loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Create Admin'}</ActionButton>
          </DialogActions>
        </Dialog>

        <Dialog open={showCreateInecDialog} onClose={() => setShowCreateInecDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#333' }}>
              Create INEC Official
            </Typography>
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={createForm.name}
              onChange={handleCreateFormChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Phone Number"
              name="phone_number"
              value={createForm.phone_number}
              onChange={handleCreateFormChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={createForm.password}
              onChange={handleCreateFormChange}
              margin="normal"
              required
            />
          </DialogContent>
          <DialogActions>
            <ActionButton variant="text" scheme="cancel" onClick={() => setShowCreateInecDialog(false)} sx={{ px: 2, py: 0.5, fontWeight: 600 }}>Cancel</ActionButton>
            <ActionButton onClick={handleCreateInec} disabled={loading}>{loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Create Official'}</ActionButton>
          </DialogActions>
        </Dialog>
        
        {/* Confirmation dialog for verify/cancel actions */}
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#333' }}>
              Confirm Action
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to {confirmAction === 'verify' ? 'verify' : 'cancel'} this voter?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)} sx={{ color: '#666' }}>No</Button>
            <ActionButton onClick={async () => {
              setConfirmOpen(false)
              setLoading(true)
              setError('')
              try {
                if (confirmAction === 'verify') {
                  await authAPI.verifyVoter(confirmPayload)
                  setSuccess('Voter verified successfully')
                } else if (confirmAction === 'cancel') {
                  await authAPI.cancelVoter(confirmPayload)
                  setSuccess('Voter verification cancelled')
                }
                await Promise.all([loadVoters(), loadDashboardStats()])
              } catch (e) {
                console.error('Confirm action failed', e)
                // Normalize error into a string to avoid React rendering an object
                let errMsg = 'Action failed'
                if (e?.response?.data) {
                  if (typeof e.response.data === 'string') errMsg = e.response.data
                  else if (e.response.data.error) errMsg = e.response.data.error
                  else errMsg = JSON.stringify(e.response.data)
                } else if (e?.message) {
                  errMsg = e.message
                }
                setError(errMsg)
              } finally {
                setLoading(false)
              }
            }}>
              Yes
            </ActionButton>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
    </ErrorBoundary>
  )
}

export default AdminDashboard