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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  IconButton
} from '@mui/material'
import {
  HowToVote,
  CheckCircle,
  Warning,
  Info,
  RadioButtonChecked,
  RadioButtonUnchecked,
  Refresh
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { votingAPI, electionsAPI, API_BASE_URL, MEDIA_BASE_URL } from '../../services/api'
import { Layout } from '../../components/layout/Layout'

const VotingPage = () => {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeElections, setActiveElections] = useState([])
  const [selectedElection, setSelectedElection] = useState(null)
  const [ballot, setBallot] = useState(null)
  const [selectedCandidates, setSelectedCandidates] = useState({})
  const [previewCandidate, setPreviewCandidate] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [votingHistory, setVotingHistory] = useState([])

  const steps = ['Select Election', 'Review Ballot', 'Cast Vote', 'Confirmation']

  // Check if user is eligible to vote
  const isEligibleToVote = profile?.registration_verified && profile?.can_vote

  useEffect(() => {
    loadActiveElections()
    loadVotingHistory()
  }, [])

  const loadActiveElections = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Try to get active elections first
      const response = await electionsAPI.getActiveElections()
      console.log('Active elections response:', response)
      setActiveElections(response.data || [])
    } catch (err) {
      console.log('Failed to load active elections, trying all elections:', err)
      // If active elections fail, try to get all elections
      try {
        const response = await electionsAPI.getElections()
        console.log('All elections response:', response)
        // Filter for ongoing elections
        const ongoingElections = response.data?.filter(election => election.status === 'ongoing') || []
        console.log('Ongoing elections:', ongoingElections)
        setActiveElections(ongoingElections)
      } catch (err2) {
        console.error('Failed to load elections:', err2)
        setError('Failed to load elections. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadVotingHistory = async () => {
    try {
      const response = await votingAPI.getVotingHistory()
      setVotingHistory(response.data)
    } catch (err) {
      console.error('Failed to load voting history:', err)
    }
  }

  const handleElectionSelect = async (election) => {
    // Check if election is actually active
    const now = new Date();
    const startDate = new Date(election.start_date);
    const endDate = new Date(election.end_date);
    const isActuallyActive = startDate <= now && now <= endDate;
    
    if (!isActuallyActive) {
      setError('This election is not currently active.');
      return;
    }
    
    setSelectedElection(election)
    setActiveStep(1)
    
    try {
      const response = await votingAPI.getBallot(election.election_id)
      setBallot(response.data)
      setSelectedCandidates({})
    } catch (err) {
      setError('Failed to load ballot. Please try again.')
    }
  }

  // Open a preview dialog before finalizing selection
  const handleCandidateSelect = (candidate) => {
    setPreviewCandidate(candidate)
    setPreviewOpen(true)
  }

  const confirmCandidateSelection = () => {
    if (!previewCandidate) return
    setSelectedCandidates(prev => ({
      ...prev,
      [previewCandidate.candidate.candidate_id]: previewCandidate
    }))
    setPreviewCandidate(null)
    setPreviewOpen(false)
  }

  const cancelCandidatePreview = () => {
    setPreviewCandidate(null)
    setPreviewOpen(false)
  }

  const handleProceedToVote = () => {
    setActiveStep(2)
  }

  const handleCastVote = () => {
    setConfirmationOpen(true)
  }

  const confirmVote = async () => {
    setLoading(true)
    setConfirmationOpen(false)
    
    try {
      // Cast vote for each selected candidate
      const votePromises = Object.values(selectedCandidates).map(candidate => {
        return votingAPI.castVote({
          election_id: selectedElection.election_id,
          candidate_id: candidate.candidate.candidate_id
        })
      })
      
      await Promise.all(votePromises)

      setActiveStep(3)
      loadVotingHistory()
    } catch (err) {
      // Parse server error payload for useful messages
      const payload = err.response?.data || err.message
      let human = ''
      if (payload && typeof payload === 'object') {
        // Look for non_field_errors or message keys
        if (payload.non_field_errors) {
          human = Array.isArray(payload.non_field_errors) ? payload.non_field_errors.join(' ') : String(payload.non_field_errors)
        } else if (payload.detail) {
          human = String(payload.detail)
        } else if (payload.message) {
          human = String(payload.message)
        } else {
          human = JSON.stringify(payload)
        }
      } else {
        human = String(payload)
      }

      const msgLower = human.toLowerCase()
      if (msgLower.includes('already voted')) {
        setError('You have already voted in this election. Each voter can only vote once per election.')
      } else if (msgLower.includes('not eligible')) {
        setError('You are not eligible to vote in this election.')
      } else {
        setError('Failed to cast vote. ' + human)
      }
    } finally {
      setLoading(false)
    }
  }

  const resetVotingProcess = () => {
    setSelectedElection(null)
    setBallot(null)
    setSelectedCandidates({})
    setActiveStep(0)
  }

  if (loading && activeStep === 0) {
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
          Cast Your Vote
          <IconButton 
            onClick={loadActiveElections} 
            size="small" 
            sx={{ ml: 2 }}
            disabled={loading}
          >
            <Refresh />
          </IconButton>
        </Typography>

        {!isEligibleToVote && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {profile?.registration_verified 
              ? "You are not currently eligible to vote." 
              : "Your registration is pending verification. Please wait for INEC officials to verify your details before voting."
            }
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 0: Select Election */
        activeStep === 0 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Active Elections
            </Typography>
            
            {activeElections.length === 0 ? (
              <Alert severity="info">
                No active elections at this time. Please check back later.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {activeElections.map((election) => (
                  <Grid item xs={12} md={6} key={election.election_id}>
                    <Card 
                      sx={{ 
                        cursor: isEligibleToVote ? 'pointer' : 'not-allowed',
                        opacity: isEligibleToVote ? 1 : 0.6
                      }}
                      onClick={isEligibleToVote ? () => handleElectionSelect(election) : undefined}
                    >
                      <CardHeader
                        title={election.title}
                        subheader={`${election.type.replace('_', ' ')} Election`}
                      />
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {election.description}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                          <Chip 
                            label={election.status} 
                            color={election.status === 'ongoing' ? 'success' : 'default'} 
                          />
                          <Typography variant="body2">
                            {new Date(election.start_date).toLocaleDateString()} - {new Date(election.end_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* Step 1: Review Ballot */
        activeStep === 1 && ballot && (
          <Box>
            <Typography variant="h5" gutterBottom>
              {ballot.election_title} Ballot
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Please review the ballot carefully before casting your vote. You can select one candidate for each position.
            </Alert>
            
            {ballot.candidates.map((ballotCandidate, index) => (
              <Card key={ballotCandidate.candidate.candidate_id} sx={{ mb: 2 }}>
                <CardHeader
                  title={`Position: ${ballotCandidate.candidate.position}`}
                  action={
                    selectedCandidates[ballotCandidate.candidate.candidate_id] ? (
                      <CheckCircle color="success" />
                    ) : (
                      <RadioButtonUnchecked />
                    )
                  }
                />
                <Divider />
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <HowToVote />
                      </ListItemIcon>
                      <ListItemText 
                        primary={ballotCandidate.candidate.name}
                        secondary={`Party: ${ballotCandidate.candidate.party}`}
                      />
                      <Button
                        variant={selectedCandidates[ballotCandidate.candidate.candidate_id] ? "contained" : "outlined"}
                        onClick={() => handleCandidateSelect(ballotCandidate)}
                      >
                        {selectedCandidates[ballotCandidate.candidate.candidate_id] ? "Selected" : "View & Select"}
                      </Button>
                    </ListItem>
                  </List>
                  
                  {ballotCandidate.candidate.biography && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">Biography:</Typography>
                      <Typography variant="body2">{ballotCandidate.candidate.biography}</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Candidate Preview Dialog */}
            <Dialog open={previewOpen} onClose={cancelCandidatePreview} maxWidth="sm" fullWidth>
              <DialogTitle>Candidate Preview</DialogTitle>
              <DialogContent>
                {previewCandidate ? (
                  <Box sx={{ textAlign: 'center' }}>
                    {previewCandidate.candidate.photo ? (
                      // show image prominently; ensure absolute URL for media served by Django
                      <Box component="img" src={previewCandidate.candidate.photo.startsWith('http') ? previewCandidate.candidate.photo : `${MEDIA_BASE_URL}${previewCandidate.candidate.photo}`} alt={previewCandidate.candidate.name} sx={{ width: '60%', maxHeight: 300, objectFit: 'cover', borderRadius: 2, mb: 2 }} />
                    ) : (
                      <Box sx={{ width: '60%', height: 180, bgcolor: 'grey.200', display: 'inline-block', borderRadius: 2, mb: 2 }} />
                    )}

                    <Typography variant="h6" gutterBottom>
                      {previewCandidate.candidate.name}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      {previewCandidate.candidate.party}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Position:</strong> {previewCandidate.candidate.position}
                    </Typography>
                    {previewCandidate.candidate.biography && (
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="subtitle2">Biography</Typography>
                        <Typography variant="body2">{previewCandidate.candidate.biography}</Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography>No candidate selected</Typography>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={cancelCandidatePreview}>Cancel</Button>
                <Button onClick={confirmCandidateSelection} variant="contained">Select Candidate</Button>
              </DialogActions>
            </Dialog>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={() => setActiveStep(0)} variant="outlined">
                Back
              </Button>
              <Button 
                onClick={handleProceedToVote} 
                variant="contained" 
                disabled={Object.keys(selectedCandidates).length === 0}
              >
                Proceed to Vote
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 2: Cast Vote */
        activeStep === 2 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Confirm Your Vote
            </Typography>
            
            <Alert severity="warning" sx={{ mb: 3 }}>
              <strong>Important:</strong> Please review your selections carefully. Once submitted, your vote cannot be changed.
            </Alert>
            
            <Card>
              <CardHeader title="Your Vote Summary" />
              <Divider />
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Election: {selectedElection?.title}
                </Typography>
                
                {Object.values(selectedCandidates).map((ballotCandidate) => (
                  <Paper key={ballotCandidate.candidate.candidate_id} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1">
                      Position: {ballotCandidate.candidate.position}
                    </Typography>
                    <Typography variant="body1">
                      Candidate: {ballotCandidate.candidate.name} ({ballotCandidate.candidate.party})
                    </Typography>
                  </Paper>
                ))}
              </CardContent>
            </Card>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={() => setActiveStep(1)} variant="outlined">
                Back
              </Button>
              <Button 
                onClick={handleCastVote} 
                variant="contained" 
                color="success"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <HowToVote />}
              >
                {loading ? "Casting Vote..." : "Cast Vote"}
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 3: Confirmation */
        activeStep === 3 && (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Vote Successfully Cast!
            </Typography>
            <Typography variant="h6" color="text.secondary" paragraph>
              Your vote has been securely recorded and encrypted.
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3 }}>
              Thank you for participating in the democratic process. Your vote counts!
            </Alert>
            
            <Button 
              onClick={resetVotingProcess} 
              variant="contained" 
              size="large"
            >
              Vote in Another Election
            </Button>
          </Box>
        )}

        {/* Voting History */}
        {votingHistory.length > 0 && (
          <Box sx={{ mt: 5 }}>
            <Typography variant="h5" gutterBottom>
              Voting History
            </Typography>
            
            <Card>
              <CardContent>
                <List>
                  {votingHistory.map((vote, index) => (
                    <ListItem key={vote.vote_id} divider={index < votingHistory.length - 1}>
                      <ListItemText
                        primary={`${vote.election_title} - ${vote.candidate_name}`}
                        secondary={`Voted on ${new Date(vote.timestamp).toLocaleString()}`}
                      />
                      <Chip label="Voted" color="success" size="small" />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Vote Confirmation Dialog */}
        <Dialog open={confirmationOpen} onClose={() => setConfirmationOpen(false)}>
          <DialogTitle>Confirm Vote Submission</DialogTitle>
          <DialogContent>
            <Alert severity="warning">
              Are you sure you want to submit your vote? This action cannot be undone.
            </Alert>
            <Typography variant="body1" sx={{ mt: 2 }}>
              You are voting in the <strong>{selectedElection?.title}</strong> election for the following candidates:
            </Typography>
            <List>
              {Object.values(selectedCandidates).map((ballotCandidate) => (
                <ListItem key={ballotCandidate.candidate.candidate_id}>
                  <ListItemText
                    primary={`${ballotCandidate.candidate.position}: ${ballotCandidate.candidate.name}`}
                    secondary={ballotCandidate.candidate.party}
                  />
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmationOpen(false)}>Cancel</Button>
            <Button onClick={confirmVote} variant="contained" color="success">
              Confirm Vote
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  )
}

export default VotingPage