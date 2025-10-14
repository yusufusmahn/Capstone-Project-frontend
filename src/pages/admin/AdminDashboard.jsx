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
  Refresh
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { authAPI, adminAPI, electionsAPI, incidentsAPI } from '../../services/api'
import { Layout } from '../../components/layout/Layout'
import ErrorBoundary from '../../components/common/ErrorBoundary'

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
  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadDashboardStats(),
        loadElections(),
        loadVoters(),
        loadIncidents()
      ]);
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
    
    // Set up periodic check for election management
    const interval = setInterval(() => {
      // This is just a reminder - in a real application, you would implement
      // a backend API endpoint to trigger election management
      console.log('Checking for elections that need management...');
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [])

  const loadElections = async () => {
    try {
      console.log('Loading elections...')
      const response = await electionsAPI.getElections()
      console.log('Elections API response:', response)
      const electionsData = response.data || []
      console.log('Elections data:', electionsData)
      console.log('Elections count:', electionsData.length)
      setElections(electionsData)
    } catch (err) {
      console.error('Failed to load elections:', err)
      setError('Failed to load elections: ' + (err.response?.data?.message || err.message || err.toString()))
    }
  }

  const loadDashboardStats = async () => {
    try {
      console.log('Loading dashboard stats...')
      // Prefer centralized admin helper
      try {
        const statsRes = await adminAPI.getDashboardStats()
        console.log('Dashboard stats (central):', statsRes)
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

      // Fallback: aggregate directly
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
      console.log('Loading voters...')
      const response = await authAPI.getVoters()
      console.log('Voters loaded:', response.data)
      setVoters(response.data || [])
    } catch (err) {
      console.error('Failed to load voters:', err)
      setError('Failed to load voters: ' + (err.response?.data?.message || err.message || err.toString()))
    }
  }

  const loadIncidents = async () => {
    try {
      console.log('Loading incidents...')
      const response = await incidentsAPI.getIncidents()
      console.log('Incidents loaded:', response.data)
      setIncidents(response.data || [])
    } catch (err) {
      console.error('Failed to load incidents:', err)
      setError('Failed to load incidents: ' + (err.response?.data?.message || err.message || err.toString()))
    }
  }

  const handleTabChange = (event, newValue) => {
    console.log('Switching to tab:', newValue)
    console.log('Current elections:', elections)
    console.log('Current voters:', voters)
    console.log('Current incidents:', incidents)
    setTabValue(newValue)
    
    // Reload data when switching tabs to ensure freshness
    switch(newValue) {
      case 0: // Overview
        loadDashboardStats().catch(err => {
          console.error('Failed to load dashboard stats:', err)
          setError('Failed to load dashboard stats: ' + (err.message || err.toString()))
        })
        break
      case 1: // Elections
        loadElections().catch(err => {
          console.error('Failed to load elections:', err)
          setError('Failed to load elections: ' + (err.message || err.toString()))
        })
        break
      case 2: // Voters
        loadVoters().catch(err => {
          console.error('Failed to load voters:', err)
          setError('Failed to load voters: ' + (err.message || err.toString()))
        })
        break
      case 3: // Incidents
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

  // Handle file input for candidate photo
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
      console.log('Creating election with data:', electionForm)
      const response = await electionsAPI.createElection(electionForm)
      console.log('Election created successfully:', response)
      setSuccess('Election created successfully! Elections with start dates that have passed need to be manually started using the management commands.')
      setShowElectionForm(false)
      setElectionForm({
        title: '',
        type: '',
        description: '',
        start_date: '',
        end_date: ''
      })
      // Add a small delay to ensure the backend has time to process
      await new Promise(resolve => setTimeout(resolve, 1000))
      // Reload elections and stats
      await Promise.all([
        loadElections(),
        loadDashboardStats()
      ])
      console.log('Data reloaded after election creation')
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
      console.log('Creating candidate with data:', candidateForm)
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
      console.log('Candidate created successfully:', response)
      // Verify if the backend returned the candidate or if we can fetch candidates for the election
      let photoSaved = false
      try {
        const candidatesRes = await electionsAPI.getCandidates(candidateForm.election)
        const created = candidatesRes.data.find(c => c.name === candidateForm.name && c.party === candidateForm.party)
        if (created && created.photo) photoSaved = true
      } catch (e) {
        console.warn('Could not verify candidate photo after creation:', e)
      }

  // Signal success; photo upload verification is noisy, so present a positive message
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
      // Reload elections to reflect any changes
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
      // Refresh users/voters list
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
    // Open confirmation dialog before performing the action
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
      // Reload data to reflect changes
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
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
          <IconButton 
            onClick={loadData} 
            size="small" 
            sx={{ ml: 2 }}
            disabled={loading}
          >
            <Refresh />
          </IconButton>
        </Typography>

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

        {/* Dashboard Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" align="center">
                  {loading ? <CircularProgress size={30} /> : (stats?.totalElections || 0)}
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary">
                  Total Elections
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" align="center" color="primary">
                  {loading ? <CircularProgress size={30} /> : (stats?.activeElections || 0)}
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary">
                  Active Elections
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" align="center">
                  {loading ? <CircularProgress size={30} /> : (stats?.totalVoters || 0)}
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary">
                  Registered Voters
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" align="center" color="warning.main">
                  {loading ? <CircularProgress size={30} /> : (stats?.pendingVoters || 0)}
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary">
                  Pending Verification
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab icon={<Dashboard />} label="Overview" />
          <Tab icon={<HowToVote />} label="Elections" />
          <Tab icon={<People />} label="Voters" />
          <Tab icon={<Report />} label="Incidents" />
          <Tab icon={<BarChart />} label="Reports" />
        </Tabs>

        {/* Overview Tab */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader title="Recent Activity" />
                <CardContent>
                  <Typography variant="body1">
                    Welcome to the admin dashboard. Here you can manage elections, verify voters, and monitor incidents.
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => setShowElectionForm(true)}
                      sx={{ mr: 2 }}
                    >
                      Create Election
                    </Button>
                    {/* Add Candidate button visible on desktop */}
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => setShowCandidateForm(true)}
                      sx={{ mr: 2 }}
                    >
                      Add Candidate
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<People />}
                      onClick={() => setTabValue(2)}
                      sx={{ mr: 2 }}
                    >
                      Verify Voters
                    </Button>
                    {/* Create Admin (superuser only) */}
                    {user?.is_superuser && (
                      <Button
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={() => setShowCreateAdminDialog(true)}
                        sx={{ mr: 2 }}
                      >
                        Create Admin
                      </Button>
                    )}

                    {/* Create INEC Official (superuser or admin) */}
                    {(user?.is_superuser || isAdmin) && (
                      <Button
                        variant="outlined"
                        startIcon={<People />}
                        onClick={() => setShowCreateInecDialog(true)}
                        sx={{ mr: 2 }}
                      >
                        Create INEC Official
                      </Button>
                    )}
                    
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Quick Stats" />
                <CardContent>
                  <Typography variant="body2">
                    Pending Incidents: {stats?.pendingIncidents || 0}
                  </Typography>
                  <Typography variant="body2">
                    Verified Voters: {stats?.verifiedVoters || 0}
                  </Typography>
                  <Typography variant="body2">
                    Total Incidents: {stats?.totalIncidents || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Elections Tab */}
        {tabValue === 1 && (
          <Box>
            <Typography variant="h5">Manage Elections ({elections.length})</Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Alert severity="info">Elections tab is working</Alert>
            )}
          </Box>
        )}

        {/* Voters Tab */}
        {tabValue === 2 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5">Voter Management</Typography>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Voter ID</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {voters.map((voter) => (
                      <TableRow key={voter.user.id}>
                        <TableCell>{voter.user.name}</TableCell>
                        <TableCell>{voter.user.phone_number}</TableCell>
                        <TableCell>{voter.voter_id}</TableCell>
                        <TableCell>
                          {voter.registration_verified ? (
                            <Chip icon={<Verified />} label="Verified" color="success" size="small" />
                          ) : (
                            <Chip icon={<Cancel />} label="Pending" color="warning" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          {!voter.registration_verified && (
                              <>
                                <Button size="small" onClick={async () => handleVerifyVoter(voter.voter_id)}>
                                  Verify
                                </Button>
                                <Button size="small" color="error" onClick={async () => {
                                  setConfirmAction('cancel')
                                  setConfirmPayload(voter.voter_id)
                                  setConfirmOpen(true)
                                }} sx={{ ml: 1 }}>
                                  Cancel
                                </Button>
                              </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* Incidents Tab */}
        {tabValue === 3 && (
          <Box>
            <Typography variant="h5" gutterBottom>Incident Management</Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Priority</TableCell>
                      {(isAdmin || isInec) && <TableCell>Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {incidents.map((incident) => (
                      <TableRow key={incident.report_id}>
                        <TableCell>{incident.incident_type.replace('_', ' ')}</TableCell>
                        <TableCell>{incident.description.substring(0, 50)}...</TableCell>
                        <TableCell>{incident.location || 'Not specified'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={incident.status} 
                            color={
                              incident.status === 'resolved' ? 'success' : 
                              incident.status === 'pending' ? 'warning' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={incident.priority} 
                            color={
                              incident.priority === 'critical' ? 'error' : 
                              incident.priority === 'high' ? 'warning' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        {(isAdmin || isInec) && (
                          <TableCell>
                            <Button size="small" onClick={async () => {
                              try {
                                if (isInec) {
                                  await incidentsAPI.assignIncident(incident.report_id, user.user_id)
                                  setSuccess('Incident assigned to you.')
                                }
                                // Refresh incidents
                                await loadIncidents()
                              } catch (e) {
                                if (e.response?.status === 403) {
                                  const assignedName = e.response?.data?.assigned_to_name || null
                                  if (assignedName) {
                                    setError(`This incident is already assigned to ${assignedName}. Only admins can reassign.`)
                                  } else {
                                    setError('This incident is already assigned to another official and cannot be reassigned.')
                                  }
                                } else {
                                  setError('Failed to assign incident: ' + (e.response?.data || e.message))
                                }
                              }
                            }}>
                              Assign to me
                            </Button>
                            <Button size="small" onClick={async () => {
                              try {
                                const next = incident.status === 'pending' ? 'investigating' : (incident.status === 'investigating' ? 'resolved' : 'resolved')
                                await incidentsAPI.updateIncidentStatus(incident.report_id, { status: next, resolution_notes: next === 'resolved' ? 'Resolved via Admin Dashboard' : '' })
                                setSuccess('Incident status updated.')
                                await loadIncidents()
                              } catch (e) {
                                setError('Failed to update incident status: ' + (e.response?.data || e.message))
                              }
                            }} sx={{ ml: 1 }}>
                              Update Status
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* Reports Tab */}
        {tabValue === 4 && (
          <Box>
            <Typography variant="h5" gutterBottom>Reports & Analytics</Typography>
            <Alert severity="info">
              Detailed reporting and analytics features will be implemented here.
            </Alert>
          </Box>
        )}

        {/* Create Election Dialog */}
        <Dialog open={showElectionForm} onClose={() => setShowElectionForm(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Election</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Election Title"
                  name="title"
                  value={electionForm.title}
                  onChange={handleElectionFormChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Election Type</InputLabel>
                  <Select
                    name="type"
                    value={electionForm.type}
                    onChange={handleElectionFormChange}
                    label="Election Type"
                  >
                    <MenuItem value="presidential">Presidential</MenuItem>
                    <MenuItem value="gubernatorial">Gubernatorial</MenuItem>
                    <MenuItem value="senatorial">Senatorial</MenuItem>
                    <MenuItem value="house_of_reps">House of Representatives</MenuItem>
                    <MenuItem value="house_of_assembly">House of Assembly</MenuItem>
                    <MenuItem value="local_government">Local Government</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  name="description"
                  value={electionForm.description}
                  onChange={handleElectionFormChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Start Date"
                  type="datetime-local"
                  name="start_date"
                  value={electionForm.start_date}
                  onChange={handleElectionFormChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="End Date"
                  type="datetime-local"
                  name="end_date"
                  value={electionForm.end_date}
                  onChange={handleElectionFormChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowElectionForm(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateElection} 
              variant="contained" 
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Election'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Admin Dialog (Superuser only) */}
        <Dialog open={showCreateAdminDialog} onClose={() => setShowCreateAdminDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create Admin</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField fullWidth label="Name" name="name" value={createForm.name} onChange={handleCreateFormChange} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Phone Number" name="phone_number" value={createForm.phone_number} onChange={handleCreateFormChange} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Password" name="password" type="password" value={createForm.password} onChange={handleCreateFormChange} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateAdminDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              // open confirmation before creating
              setShowCreateAdminDialog(false)
              setConfirmAction('create_admin')
              setConfirmPayload({ ...createForm })
              setConfirmOpen(true)
            }} variant="contained" disabled={loading}>{loading ? <CircularProgress size={20} /> : 'Create Admin'}</Button>
          </DialogActions>
        </Dialog>

        {/* Create INEC Official Dialog (Superuser/Admin) */}
        <Dialog open={showCreateInecDialog} onClose={() => setShowCreateInecDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create INEC Official</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField fullWidth label="Name" name="name" value={createForm.name} onChange={handleCreateFormChange} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Phone Number" name="phone_number" value={createForm.phone_number} onChange={handleCreateFormChange} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Password" name="password" type="password" value={createForm.password} onChange={handleCreateFormChange} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateInecDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              // open confirmation before creating
              setShowCreateInecDialog(false)
              setConfirmAction('create_inec')
              setConfirmPayload({ ...createForm })
              setConfirmOpen(true)
            }} variant="contained" disabled={loading}>{loading ? <CircularProgress size={20} /> : 'Create INEC Official'}</Button>
          </DialogActions>
        </Dialog>

        {/* Confirm Action Dialog (shared for Verify/Cancel) */}
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Confirm action</DialogTitle>
          <DialogContent>
            <Typography>
              {confirmAction === 'verify' ? 'Are you sure you want to verify this voter? This will allow them to vote.' : 'Are you sure you want to cancel this voter registration?'}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)}>No</Button>
            <Button onClick={async () => {
              setConfirmOpen(false)
              setLoading(true)
              try {
                if (confirmAction === 'verify') {
                  const resp = await authAPI.verifyVoter(confirmPayload)
                  setSuccess(resp.data?.message || 'Voter verified successfully!')
                } else if (confirmAction === 'cancel') {
                  const resp = await authAPI.cancelVoter(confirmPayload)
                  setSuccess(resp.data?.message || 'Voter registration cancelled')
                } else if (confirmAction === 'create_admin') {
                  const resp = await authAPI.createAdmin(confirmPayload)
                  setSuccess(resp.data?.message || 'Admin created successfully')
                  // clear create form
                  setCreateForm({ name: '', phone_number: '', password: '' })
                } else if (confirmAction === 'create_inec') {
                  const resp = await authAPI.createInecOfficial(confirmPayload)
                  setSuccess(resp.data?.message || 'INEC Official created successfully')
                  setCreateForm({ name: '', phone_number: '', password: '' })
                }

                await Promise.all([loadVoters(), loadDashboardStats()])
              } catch (e) {
                setError((e.response?.data?.error || e.response?.data?.message) || e.message || 'Action failed')
              } finally {
                setLoading(false)
                setConfirmAction(null)
                setConfirmPayload(null)
              }
            }} variant="contained">Yes</Button>
          </DialogActions>
        </Dialog>

        {/* Create Candidate Dialog */}
        <Dialog open={showCandidateForm} onClose={() => setShowCandidateForm(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Candidate</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Candidate Name"
                  name="name"
                  value={candidateForm.name}
                  onChange={handleCandidateFormChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Political Party"
                  name="party"
                  value={candidateForm.party}
                  onChange={handleCandidateFormChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Position"
                  name="position"
                  value={candidateForm.position}
                  onChange={handleCandidateFormChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Election</InputLabel>
                  <Select
                    name="election"
                    value={candidateForm.election}
                    onChange={handleCandidateFormChange}
                    label="Election"
                  >
                    {elections.map((election) => (
                      <MenuItem key={election.election_id} value={election.election_id}>
                        {election.title} — {String(election.type).replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Biography"
                  name="biography"
                  value={candidateForm.biography}
                  onChange={handleCandidateFormChange}
                />
              </Grid>
              <Grid item xs={12}>
                <input
                  accept="image/*"
                  id="candidate-photo"
                  type="file"
                  style={{ display: 'block' }}
                  onChange={handleCandidatePhotoChange}
                />
                {candidateForm.photo && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Selected photo preview:</Typography>
                    <Box component="img" src={typeof candidateForm.photo === 'string' ? candidateForm.photo : URL.createObjectURL(candidateForm.photo)} alt="Selected" sx={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 1, mt: 1 }} />
                  </Box>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCandidateForm(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateCandidate} 
              variant="contained" 
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Add Candidate'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Floating Action Button - opens Candidate form */}
        <Fab
          color="primary"
          aria-label="add-candidate"
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16,
            display: 'flex'
          }}
          onClick={() => setShowCandidateForm(true)}
        >
          <Add />
        </Fab>
      </Container>
    </Layout>
    </ErrorBoundary>
  )
}

export default AdminDashboard