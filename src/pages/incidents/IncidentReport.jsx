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
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material'
import {
  Report,
  Add,
  Photo,
  Videocam,
  Description,
  LocationOn,
  PriorityHigh
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { incidentsAPI } from '../../services/api'
import { Layout } from '../../components/layout/Layout'

const IncidentReport = () => {
  const { user, isAdmin, isInec } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [myIncidents, setMyIncidents] = useState([])
  const [showReportForm, setShowReportForm] = useState(false)
  const [formData, setFormData] = useState({
    incident_type: '',
    description: '',
    location: '',
    priority: 'medium',
    evidence_files: []
  })
  const [previewFiles, setPreviewFiles] = useState([])

  // Load incidents on mount
  useEffect(() => {
    loadMyIncidents()
  }, [])

  const incidentTypes = [
    { value: 'voter_intimidation', label: 'Voter Intimidation' },
    { value: 'ballot_stuffing', label: 'Ballot Stuffing' },
    { value: 'technical_issue', label: 'Technical Issue' },
    { value: 'violence', label: 'Violence' },
    { value: 'bribery', label: 'Bribery' },
    { value: 'equipment_malfunction', label: 'Equipment Malfunction' },
    { value: 'unauthorized_access', label: 'Unauthorized Access' },
    { value: 'other', label: 'Other' }
  ]

  const priorityLevels = [
    { value: 'low', label: 'Low', color: 'success' },
    { value: 'medium', label: 'Medium', color: 'warning' },
    { value: 'high', label: 'High', color: 'error' },
    { value: 'critical', label: 'Critical', color: 'error' }
  ]

  const loadMyIncidents = async () => {
    try {
      // If user is admin/inec, load all incidents; otherwise load my incidents
      let response
      if (isAdmin || isInec) {
        response = await incidentsAPI.getIncidents()
        setMyIncidents(response.data || [])
      } else {
        response = await incidentsAPI.getMyIncidents()
        setMyIncidents(response.data || [])
      }
    } catch (err) {
      console.error('Failed to load incidents:', err)
      const msg = err.response?.data ? (typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data)) : (err.message || 'Failed to load incidents')
      setError('Failed to load incidents: ' + msg)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    setFormData(prev => ({
      ...prev,
      evidence_files: [...prev.evidence_files, ...files]
    }))
    
    // Create previews for image files
    const newPreviews = files
      .filter(file => file.type.startsWith('image/'))
      .map(file => URL.createObjectURL(file))
    setPreviewFiles(prev => [...prev, ...newPreviews])
  }

  const removeFile = (index) => {
    const newFiles = [...formData.evidence_files]
    newFiles.splice(index, 1)
    setFormData(prev => ({
      ...prev,
      evidence_files: newFiles
    }))
    
    // Remove preview if it exists
    if (previewFiles[index]) {
      const newPreviews = [...previewFiles]
      newPreviews.splice(index, 1)
      setPreviewFiles(newPreviews)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('incident_type', formData.incident_type)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('location', formData.location)
      formDataToSend.append('priority', formData.priority)
      
      formData.evidence_files.forEach(file => {
        formDataToSend.append('evidence_files', file)
      })
      
      await incidentsAPI.createIncident(formDataToSend)
      
      setSuccess('Incident report submitted successfully!')
      setFormData({
        incident_type: '',
        description: '',
        location: '',
        priority: 'medium',
        evidence_files: []
      })
      setPreviewFiles([])
      setShowReportForm(false)
      loadMyIncidents()
    } catch (err) {
      console.error('Incident submit error:', err.response?.data || err)
      const serverMsg = err.response?.data ? (typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data)) : err.message || 'Failed to submit incident report.'
      setError('Failed to submit incident report. ' + serverMsg)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'success'
      case 'dismissed': return 'default'
      case 'investigating': return 'warning'
      default: return 'info'
    }
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          Report Incident
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

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="Report New Incident" />
              <Divider />
              <CardContent>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowReportForm(true)}
                  fullWidth
                >
                  Report Incident
                </Button>
              </CardContent>
            </Card>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h5" gutterBottom>
                My Incident Reports
              </Typography>
              
              {myIncidents.length === 0 ? (
                <Alert severity="info">
                  You haven't reported any incidents yet.
                </Alert>
              ) : (
                <List>
                  {myIncidents.map((incident) => (
                    <ListItem key={incident.report_id} divider>
                      <ListItemIcon>
                        <Report />
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography component="div" variant="body1">{incident.incident_type.replace('_', ' ')}</Typography>}
                        secondary={
                          <Box>
                            <Typography component="div" variant="body2" color="text.primary">
                              {incident.description.substring(0, 50)}...
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Chip 
                                label={incident.status} 
                                size="small" 
                                color={getStatusColor(incident.status)}
                                sx={{ mr: 1 }}
                              />
                              <Chip 
                                label={incident.priority} 
                                size="small" 
                                color={priorityLevels.find(p => p.value === incident.priority)?.color || 'default'}
                              />
                            </Box>
                          </Box>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {new Date(incident.created_at).toLocaleDateString()}
                      </Typography>
                      {/* Actions for admins/INEC officials */}
                      {(isAdmin || isInec) && (
                        <Box sx={{ ml: 2 }}>
                          <Button size="small" onClick={async () => {
                            try {
                              // Assign to self if INEC official; admins can assign to any via a dialog (not implemented here)
                              if (isInec) {
                                await incidentsAPI.assignIncident(incident.report_id, user.user_id)
                                setSuccess('Incident assigned to you.')
                                loadMyIncidents()
                              }
                            } catch (e) {
                              // If backend returns 403 with assigned_to_name, show friendly message
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
                              // Cycle status as a quick action for demo: pending -> investigating -> resolved
                              const next = incident.status === 'pending' ? 'investigating' : (incident.status === 'investigating' ? 'resolved' : 'resolved')
                              await incidentsAPI.updateIncidentStatus(incident.report_id, { status: next, resolution_notes: next === 'resolved' ? 'Resolved by official' : '' })
                              setSuccess('Incident status updated.')
                              loadMyIncidents()
                            } catch (e) {
                              setError('Failed to update status: ' + (e.response?.data || e.message))
                            }
                          }} sx={{ ml: 1 }}>Update Status</Button>
                        </Box>
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Reporting Guidelines" />
              <Divider />
              <CardContent>
                <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                  Please provide accurate information when reporting incidents:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <LocationOn fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Include exact location" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <PriorityHigh fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Set appropriate priority level" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Description fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Provide detailed description" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Photo fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Attach evidence when possible" />
                  </ListItem>
                </List>
                <Alert severity="info" sx={{ mt: 2 }}>
                  All reports are confidential and will be investigated by authorized personnel.
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Incident Report Dialog */}
        <Dialog 
          open={showReportForm} 
          onClose={() => setShowReportForm(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>Report New Incident</DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Incident Type</InputLabel>
                    <Select
                      name="incident_type"
                      value={formData.incident_type}
                      onChange={handleInputChange}
                      label="Incident Type"
                    >
                      {incidentTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    multiline
                    rows={4}
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    helperText="Provide a detailed description of the incident"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    helperText="Enter the exact location where the incident occurred"
                    InputProps={{
                      startAdornment: <LocationOn sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Priority Level</InputLabel>
                    <Select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      label="Priority Level"
                    >
                      {priorityLevels.map((level) => (
                        <MenuItem key={level.value} value={level.value}>
                          <Chip 
                            label={level.label} 
                            size="small" 
                            color={level.color}
                            sx={{ mr: 1 }}
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<Photo />}
                    fullWidth
                  >
                    Attach Evidence
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx"
                      onChange={handleFileChange}
                    />
                  </Button>
                  
                  {previewFiles.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Attached Files:
                      </Typography>
                      <Grid container spacing={1}>
                        {previewFiles.map((preview, index) => (
                          <Grid item key={index}>
                            <Box sx={{ position: 'relative' }}>
                              <img 
                                src={preview} 
                                alt="Preview" 
                                style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }} 
                              />
                              <Button
                                size="small"
                                onClick={() => removeFile(index)}
                                sx={{ 
                                  position: 'absolute', 
                                  top: 0, 
                                  right: 0,
                                  minWidth: 0,
                                  padding: 0.5
                                }}
                              >
                                ×
                              </Button>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                  
                  {formData.evidence_files.length > previewFiles.length && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {formData.evidence_files.length - previewFiles.length} non-image files attached
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowReportForm(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Report />}
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Floating Action Button for Mobile */}
        <Fab
          color="primary"
          aria-label="report incident"
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16,
            display: { xs: 'flex', md: 'none' }
          }}
          onClick={() => setShowReportForm(true)}
        >
          <Add />
        </Fab>
      </Container>
    </Layout>
  )
}

export default IncidentReport