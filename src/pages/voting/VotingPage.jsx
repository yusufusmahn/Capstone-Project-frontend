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
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import {
  HowToVote,
  CheckCircle,
  Warning,
  Info,
  RadioButtonChecked,
  RadioButtonUnchecked,
  Refresh,
  ExpandMore,
  History
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
  const [hasVotedForSelectedElection, setHasVotedForSelectedElection] = useState(false)
  const [ballot, setBallot] = useState(null)
  const [selectedCandidates, setSelectedCandidates] = useState({})
  const [previewCandidate, setPreviewCandidate] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [votingHistory, setVotingHistory] = useState([])
  const [electionSelectOpen, setElectionSelectOpen] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const [showHistory, setShowHistory] = useState(false)

  const steps = ['Select Election', 'Review Ballot', 'Cast Vote', 'Confirmation']

  const isEligibleToVote = profile?.registration_verified && profile?.can_vote

  const hasVotedInAnyElection = votingHistory && votingHistory.length > 0;

  useEffect(() => {
    loadActiveElections()
    loadVotingHistory()
  }, [])

  const loadActiveElections = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await electionsAPI.getActiveElections()
        // Active elections response logged
      setActiveElections(response.data || [])
      setLastRefreshed(new Date())
    } catch (err) {
        // Failed to load active elections, fallback to all elections
      try {
        const response = await electionsAPI.getElections()
          // All elections response logged
        const ongoingElections = response.data?.filter(election => election.status === 'ongoing') || []
          // Ongoing elections computed
        setActiveElections(ongoingElections)
        setLastRefreshed(new Date())
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
    setError('')
    
    const hasVotedInThisElection = votingHistory.some(vote => vote.election_id === election.election_id);
    setHasVotedForSelectedElection(hasVotedInThisElection)
    if (hasVotedInThisElection) {
      // Inform early and prevent proceeding; user can go back to selection
      setSelectedElection(election)
      setError('You have already voted in this election. Each voter can only vote once per election.')
      return;
    }
    
    const now = new Date();
    const startDate = new Date(election.start_date);
    const endDate = new Date(election.end_date);
    const isActuallyActive = startDate <= now && now <= endDate;
    
    if (!isActuallyActive) {
      setError('This election is not currently active for voting.');
      return;
    }
    
    if (!isEligibleToVote) {
      setError('You are not currently eligible to vote. Please contact election officials.');
      return;
    }
    
    setSelectedElection(election)
  }

  const handleElectionDropdownChange = (event) => {
    const electionId = event.target.value;
    if (electionId === '') {
      setSelectedElection(null);
      setHasVotedForSelectedElection(false)
      setError('')
      return;
    }
    const election = activeElections.find(e => e.election_id === electionId);
    if (election) {
      handleElectionSelect(election);
    }
  }

  const handleProceedToBallot = async () => {
    setError('')
    
    if (!selectedElection) {
      setError('Please select an election first.')
      return
    }
    
    if (!isEligibleToVote) {
      setError('You are not currently eligible to vote. Please contact election officials.')
      return
    }
    
    const hasVotedInThisElection = votingHistory.some(vote => vote.election_id === selectedElection.election_id)
    if (hasVotedInThisElection) {
      setError('You have already voted in this election. Each voter can only vote once per election.')
      return
    }
    
    const now = new Date()
    const startDate = new Date(selectedElection.start_date)
    const endDate = new Date(selectedElection.end_date)
    const isActuallyActive = startDate <= now && now <= endDate
    
    if (!isActuallyActive) {
      setError('This election is not currently active for voting.')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await votingAPI.getBallot(selectedElection.election_id)
      if (response.data && response.data.candidates) {
        // candidates present in ballot
      }
      
      setBallot(response.data)
      setSelectedCandidates({})
      setActiveStep(1)
    } catch (err) {
      console.error('Ballot error:', err)
      if (err.response?.status === 400) {
        if (err.response.data?.error) {
          setError(err.response.data.error)
        } else {
          setError('This election is not currently active for voting.')
        }
      } else if (err.response?.status === 403) {
        if (err.response.data?.error) {
          setError(err.response.data.error)
        } else {
          setError('You are not eligible to vote in this election.')
        }
      } else if (err.response?.status === 404) {
        setError('Election not found. Please select a valid election.')
      } else {
        setError('Failed to load ballot. Please try again.')
      }
    } finally {
      setLoading(false)
    }
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
    setError('')
    
    try {
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
      console.error('Vote casting error:', err)
      const payload = err.response?.data || err.message
      let human = ''
      if (payload && typeof payload === 'object') {
        if (payload.non_field_errors) {
          human = Array.isArray(payload.non_field_errors) ? payload.non_field_errors.join(' ') : String(payload.non_field_errors)
        } else if (payload.detail) {
          human = String(payload.detail)
        } else if (payload.error) {
          human = String(payload.error)
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
      } else if (msgLower.includes('election is not currently accepting votes')) {
        setError('This election is not currently accepting votes. Please check the election schedule.')
      } else if (msgLower.includes('candidate does not belong to this election')) {
        setError('Invalid candidate selection. Please try again.')
      } else if (msgLower.includes('not found')) {
        setError('Election or candidate not found. Please try again.')
      } else {
        setError('Failed to cast vote: ' + human)
      }
    } finally {
      setLoading(false)
    }
  }

  const resetVotingProcess = () => {
    // Reset the voting UI to initial state so user can vote in another election
    setActiveStep(0)
    setSelectedElection(null)
    setBallot(null)
    setSelectedCandidates({})
    setConfirmationOpen(false)
    setPreviewOpen(false)
    setPreviewCandidate(null)
    setError('')
    // Refresh available elections and voting history
    loadActiveElections()
    loadVotingHistory()
  }


  if (loading && activeStep === 0 && !selectedElection) {
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#008751', fontWeight: 'bold' }}>
            Cast Your Vote
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2, color: 'text.secondary' }}>
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </Typography>
            <IconButton 
              onClick={loadActiveElections} 
              size="small" 
              sx={{ 
                backgroundColor: '#e8f5e9',
                '&:hover': {
                  backgroundColor: '#c8e6c9'
                }
              }}
              disabled={loading}
            >
              <Refresh />
            </IconButton>
          </Box>
        </Box>

        {!isEligibleToVote && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {profile?.registration_verified 
              ? "You are not currently eligible to vote." 
              : "Your registration is pending verification. Please wait for INEC officials to verify your details before voting."
            }
          </Alert>
        )}

        {/* If the voter already voted in the currently selected election, show an early notice and prevent proceeding */}
        {hasVotedForSelectedElection && selectedElection && (
          <Alert
            severity="warning"
            sx={{ mb: 3 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  setSelectedElection(null)
                  setHasVotedForSelectedElection(false)
                  setError('')
                }}
              >
                Back
              </Button>
            }
          >
            You have already voted in the selected election "{selectedElection.title}". You cannot vote in the same election again.
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

        {activeStep === 0 && (
          <Box>
            <Card sx={{ mb: 3, boxShadow: 3, borderRadius: 2 }}>
              <CardHeader
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HowToVote sx={{ color: '#008751' }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
                      Select an Election to Vote
                    </Typography>
                  </Box>
                }
                sx={{ 
                  backgroundColor: '#f0f0f0',
                  borderBottom: '1px solid #e0e0e0'
                }}
              />
              <CardContent>
                <Box sx={{ mb: 3 }}>
                  <FormControl fullWidth>
                    <Select
                      value={selectedElection ? selectedElection.election_id : ''}
                      onChange={handleElectionDropdownChange}
                      displayEmpty
                      disabled={!isEligibleToVote || activeElections.length === 0}
                      sx={{ 
                        borderRadius: 2,
                        '& .MuiSelect-select': {
                          py: 1.5,
                          display: 'flex',
                          alignItems: 'center'
                        }
                      }}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 300,
                          },
                        },
                      }}
                    >
                      <MenuItem value="" disabled>
                        <em>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HowToVote sx={{ fontSize: 18, color: '#9e9e9e' }} />
                            <span>Choose an election</span>
                          </Box>
                        </em>
                      </MenuItem>
                      {activeElections.map((election) => {
                        const hasVotedInThisElection = votingHistory.some(vote => vote.election_id === election.election_id);
                        return (
                          <MenuItem 
                            key={election.election_id} 
                            value={election.election_id}
                            disabled={hasVotedInThisElection}
                            sx={{ 
                              py: 1,
                              '&:hover': {
                                backgroundColor: hasVotedInThisElection ? 'transparent' : '#e8f5e9'
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: hasVotedInThisElection ? 'normal' : 'medium' }}>
                                  {election.title}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {election.type.replace('_', ' ')}
                                </Typography>
                              </Box>
                              {hasVotedInThisElection ? (
                                <Chip 
                                  label="Already Voted" 
                                  size="small" 
                                  sx={{ 
                                    backgroundColor: '#ffebee',
                                    color: '#c62828',
                                    fontWeight: 'bold'
                                  }} 
                                />
                              ) : (
                                <Box sx={{ 
                                  width: 24, 
                                  height: 24, 
                                  borderRadius: '50%', 
                                  backgroundColor: '#e8f5e9',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <HowToVote sx={{ fontSize: 16, color: '#008751' }} />
                                </Box>
                              )}
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleProceedToBallot}
                    disabled={!selectedElection || loading}
                    startIcon={loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <HowToVote />}
                    sx={{ 
                      backgroundColor: '#008751',
                      '&:hover': {
                        backgroundColor: '#006633'
                      },
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      boxShadow: 3,
                      '&.Mui-disabled': {
                        backgroundColor: '#9e9e9e',
                        color: 'white'
                      }
                    }}
                  >
                    Proceed to Ballot
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Accordion 
              expanded={showHistory} 
              onChange={() => setShowHistory(!showHistory)}
              sx={{ boxShadow: 3, borderRadius: 2, mb: 3 }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{ 
                  backgroundColor: '#f5f5f5',
                  borderBottom: '1px solid #e0e0e0'
                }}
              >
                <History sx={{ mr: 1, color: '#008751' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
                  Your Voting History
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {votingHistory.length > 0 ? (
                  <List>
                    {votingHistory.map((vote, index) => (
                      <ListItem 
                        key={vote.vote_id} 
                        divider={index < votingHistory.length - 1}
                        sx={{ 
                          '&:hover': { backgroundColor: '#f9f9f9' }
                        }}
                      >
                        <ListItemText
                          primary={
                              <Typography variant="body1" component="div" sx={{ fontWeight: 'medium' }}>
                                {vote.election_title}
                              </Typography>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" component="div" color="text.secondary">
                                Voted for: {vote.candidate_name} ({vote.candidate_party})
                              </Typography>
                              <Typography variant="body2" component="div" color="text.secondary">
                                Voted on: {new Date(vote.timestamp).toLocaleString()}
                              </Typography>
                            </>
                          }
                          secondaryTypographyProps={{ component: 'div' }}
                        />
                        <Chip label="Voted" color="success" size="small" />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    You haven't voted in any elections yet.
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>

            {activeElections.length === 0 ? (
              <Alert severity="info">
                No active elections at this time. Please check back later.
              </Alert>
            ) : null}
          </Box>
        )}

        {activeStep === 1 && ballot && (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ color: '#008751', fontWeight: 'bold' }}>
              {ballot.election_title} Ballot
            </Typography>
            
            {votingHistory.some(vote => vote.election_id === selectedElection.election_id) ? (
              <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                <strong>You have already voted in this election.</strong> Each voter can only vote once per election.
                Please go back and select a different election.
              </Alert>
            ) : (
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                Please review the ballot carefully before casting your vote. You can select one candidate for each position.
              </Alert>
            )}
            
            {votingHistory.some(vote => vote.election_id === selectedElection.election_id) ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Button 
                  onClick={() => {
                    setSelectedElection(null);
                    setBallot(null);
                    setActiveStep(0);
                  }} 
                  variant="outlined"
                  sx={{
                    borderColor: '#9e9e9e',
                    color: '#666',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                      borderColor: '#757575'
                    },
                    px: 4,
                    py: 1.5,
                    borderRadius: 2
                  }}
                >
                  Back to Election Selection
                </Button>
              </Box>
            ) : (
              <>
                {ballot.candidates && ballot.candidates.length > 0 ? (
                  (() => {
                    const filteredCandidates = ballot.candidates;
                    
                    return filteredCandidates.length > 0 ? (
                      filteredCandidates.map((ballotCandidate, index) => (
                        <Card key={ballotCandidate.candidate.candidate_id} sx={{ mb: 3, boxShadow: 3, borderRadius: 2 }}>
                          <CardHeader
                            title={
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                Position: {ballotCandidate.candidate.position}
                              </Typography>
                            }
                            action={
                              selectedCandidates[ballotCandidate.candidate.candidate_id] ? (
                                <CheckCircle color="success" sx={{ fontSize: 30 }} />
                              ) : (
                                <RadioButtonUnchecked sx={{ color: '#9e9e9e', fontSize: 30 }} />
                              )
                            }
                            sx={{ 
                              backgroundColor: '#f5f5f5',
                              borderBottom: '1px solid #e0e0e0'
                            }}
                          />
                          <Divider />
                          <CardContent>
                            <List>
                              <ListItem>
                                <ListItemIcon>
                                  <HowToVote sx={{ color: '#008751' }} />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={
                                    <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                                      {ballotCandidate.candidate.name}
                                    </Typography>
                                  }
                                  secondary={
                                    <Chip 
                                      label={ballotCandidate.candidate.party} 
                                      size="small" 
                                      sx={{ 
                                        backgroundColor: '#e8f5e9',
                                        color: '#008751',
                                        fontWeight: 'bold',
                                        mt: 1
                                      }} 
                                    />
                                  }
                                  secondaryTypographyProps={{ component: 'div' }}
                                />
                                <Button
                                  variant={selectedCandidates[ballotCandidate.candidate.candidate_id] ? "contained" : "outlined"}
                                  onClick={() => {
                                    setPreviewCandidate(ballotCandidate);
                                    setPreviewOpen(true);
                                  }}
                                  sx={{
                                    borderColor: '#008751',
                                    color: selectedCandidates[ballotCandidate.candidate.candidate_id] ? 'white' : '#008751',
                                    backgroundColor: selectedCandidates[ballotCandidate.candidate.candidate_id] ? '#008751' : 'transparent',
                                    '&:hover': {
                                      backgroundColor: selectedCandidates[ballotCandidate.candidate.candidate_id] ? '#006633' : '#e8f5e9',
                                      borderColor: '#006633'
                                    },
                                    borderRadius: 2
                                  }}
                                >
                                  {selectedCandidates[ballotCandidate.candidate.candidate_id] ? "Selected" : "View & Select"}
                                </Button>
                              </ListItem>
                            </List>
                            
                            {ballotCandidate.candidate.biography && (
                              <Box className="candidate-bio" sx={{ mt: 2, p: 2, backgroundColor: '#f9f9f9', borderRadius: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Biography:</Typography>
                                <Typography variant="body2">{ballotCandidate.candidate.biography}</Typography>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Alert severity="warning" sx={{ mb: 3 }}>
                        No candidates found for the selected election. This may indicate a data issue.
                      </Alert>
                    );
                  })()
                ) : (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    No candidates found for this election.
                  </Alert>
                )}

                <Dialog open={previewOpen} onClose={cancelCandidatePreview} maxWidth="sm" fullWidth>
                  <DialogTitle>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#333' }}>
                      Candidate Preview
                    </Typography>
                  </DialogTitle>
                  <DialogContent>
                    {previewCandidate ? (
                      <Box sx={{ textAlign: 'center' }}>
                        {previewCandidate.candidate.photo ? (
                          <Box 
                            component="img" 
                            src={previewCandidate.candidate.photo.startsWith('http') ? previewCandidate.candidate.photo : `${MEDIA_BASE_URL}${previewCandidate.candidate.photo}`} 
                            alt={previewCandidate.candidate.name} 
                            sx={{ 
                              width: '60%', 
                              maxHeight: 300, 
                              objectFit: 'cover', 
                              borderRadius: 2, 
                              mb: 2,
                              boxShadow: 3
                            }} 
                          />
                        ) : (
                          <Box sx={{ 
                            width: '60%', 
                            height: 180, 
                            bgcolor: 'grey.200', 
                            display: 'inline-block', 
                            borderRadius: 2, 
                            mb: 2,
                            boxShadow: 1
                          }} />
                        )}

                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                          {previewCandidate.candidate.name}
                        </Typography>
                        <Chip 
                          label={previewCandidate.candidate.party} 
                          size="medium" 
                          sx={{ 
                            backgroundColor: '#e8f5e9',
                            color: '#008751',
                            fontWeight: 'bold',
                            mb: 2
                          }} 
                        />
                        <Typography variant="body1" component="div" sx={{ mb: 1 }}>
                          <strong>Position:</strong> {previewCandidate.candidate.position}
                        </Typography>
                        {previewCandidate.candidate.biography && (
                          <Box sx={{ textAlign: 'left', mt: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Biography</Typography>
                            <Typography variant="body1">{previewCandidate.candidate.biography}</Typography>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Typography>No candidate selected</Typography>
                    )}
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={cancelCandidatePreview} sx={{ color: '#666' }}>Cancel</Button>
                    <Button onClick={confirmCandidateSelection} variant="contained" sx={{ backgroundColor: '#008751', '&:hover': { backgroundColor: '#006633' } }}>
                      Select Candidate
                    </Button>
                  </DialogActions>
                </Dialog>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button 
                    onClick={() => {
                      setSelectedElection(null);
                      setBallot(null);
                      setActiveStep(0);
                    }} 
                    variant="outlined"
                    sx={{
                      borderColor: '#9e9e9e',
                      color: '#666',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                        borderColor: '#757575'
                      },
                      borderRadius: 2
                    }}
                  >
                    Back to Election Selection
                  </Button>
                  <Button 
                    onClick={handleProceedToVote} 
                    variant="contained" 
                    disabled={Object.keys(selectedCandidates).length === 0}
                    sx={{ 
                      backgroundColor: '#008751',
                      '&:hover': {
                        backgroundColor: '#006633'
                      },
                      px: 4,
                      py: 1.5,
                      borderRadius: 2
                    }}
                  >
                    Proceed to Vote
                  </Button>
                </Box>
              </>
            )}
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ color: '#008751', fontWeight: 'bold' }}>
              Confirm Your Vote
            </Typography>
            
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
              <strong>Important:</strong> Please review your selections carefully. Once submitted, your vote cannot be changed.
            </Alert>
            
            <Card sx={{ boxShadow: 3, borderRadius: 2, mb: 3 }}>
              <CardHeader 
                title={
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
                    Your Vote Summary
                  </Typography>
                }
                sx={{ 
                  backgroundColor: '#f0f0f0',
                  borderBottom: '1px solid #e0e0e0'
                }}
              />
              <Divider />
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#008751', mb: 3 }}>
                  Election: {selectedElection?.title}
                </Typography>
                
                {Object.values(selectedCandidates).map((ballotCandidate) => (
                  <Paper key={ballotCandidate.candidate.candidate_id} sx={{ p: 2, mb: 2, backgroundColor: '#f9f9f9' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Position: {ballotCandidate.candidate.position}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">
                        Candidate: {ballotCandidate.candidate.name}
                      </Typography>
                      <Chip 
                        label={ballotCandidate.candidate.party} 
                        size="small" 
                        sx={{ 
                          backgroundColor: '#e8f5e9',
                          color: '#008751',
                          fontWeight: 'bold',
                          ml: 1
                        }} 
                      />
                    </Box>
                  </Paper>
                ))}
              </CardContent>
            </Card>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button 
                onClick={() => setActiveStep(1)} 
                variant="outlined"
                sx={{
                  borderColor: '#9e9e9e',
                  color: '#666',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    borderColor: '#757575'
                  },
                  borderRadius: 2
                }}
              >
                Back
              </Button>
              <Button 
                onClick={handleCastVote} 
                variant="contained" 
                color="success"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <HowToVote />}
                sx={{ 
                  px: 4,
                  py: 1.5,
                  borderRadius: 2
                }}
              >
                {loading ? "Casting Vote..." : "Cast Vote"}
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 3 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
              Vote Successfully Cast!
            </Typography>
            <Typography variant="h6" color="text.secondary" component="div" sx={{ mb: 2 }}>
              Your vote has been securely recorded and encrypted.
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              Thank you for participating in the democratic process. Your vote counts!
            </Alert>
            
            <Button 
              onClick={resetVotingProcess} 
              variant="contained" 
              size="large"
              sx={{ 
                backgroundColor: '#008751',
                '&:hover': {
                  backgroundColor: '#006633'
                },
                px: 4,
                py: 1.5,
                borderRadius: 2
              }}
            >
              Vote in Another Election
            </Button>
          </Box>
        )}

        <Dialog open={confirmationOpen} onClose={() => setConfirmationOpen(false)}>
          <DialogTitle>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#333' }}>
              Confirm Vote Submission
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              Are you sure you want to submit your vote? This action cannot be undone.
            </Alert>
            <Typography variant="body1" sx={{ mt: 2 }}>
              You are voting in the <strong>{selectedElection?.title}</strong> election for the following candidates:
            </Typography>
            <List>
              {Object.values(selectedCandidates).map((ballotCandidate) => (
                <ListItem key={ballotCandidate.candidate.candidate_id}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {ballotCandidate.candidate.position}: {ballotCandidate.candidate.name}
                        </Typography>
                        <Chip 
                          label={ballotCandidate.candidate.party} 
                          size="small" 
                          sx={{ 
                            backgroundColor: '#e8f5e9',
                            color: '#008751',
                            fontWeight: 'bold',
                            ml: 1
                          }} 
                        />
                      </Box>
                    }
                    primaryTypographyProps={{ component: 'div' }}
                  />
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmationOpen(false)} sx={{ color: '#666' }}>Cancel</Button>
            <Button onClick={confirmVote} variant="contained" color="success" sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#388e3c' } }}>
              Confirm Vote
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  )
}

export default VotingPage