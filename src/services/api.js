import axios from 'axios'

// API base for backend endpoints (includes /api prefix)
const API_BASE_URL = import.meta.env.VITE_API_URL
// Separate base for media files served by Django (no /api prefix)
const MEDIA_BASE_URL = import.meta.env.VITE_API_URL.replace('/api', '')

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Auth token management
let authToken = null

const setAuthToken = (token) => {
  authToken = token
  if (token) {
    api.defaults.headers.common['Authorization'] = `Token ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

const removeAuthToken = () => {
  authToken = null
  delete api.defaults.headers.common['Authorization']
}

// Response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      removeAuthToken()
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Helper to normalize DRF list/paginated responses.
// If the backend returns { results: [...], count, next, previous },
// return an object where .data is the array for compatibility with existing callers.
function normalizeListResponse(response) {
  if (!response) return { data: [] }
  const payload = response.data
  if (Array.isArray(payload)) {
    return { data: payload }
  }
  if (payload && Array.isArray(payload.results)) {
    // Keep meta fields available under .meta
    const { results, ...meta } = payload
    return { data: results, meta }
  }
  // Fallback - return whatever data was provided
  return { data: payload }
}

// Authentication API
export const authAPI = {
  setAuthToken,
  removeAuthToken,
  
  login: (credentials) => {
    // Use absolute API path to avoid accidental relative URL requests
    const url = `${API_BASE_URL}/auth/login/`
    console.log('Calling login URL:', url)
    return api.post(url, credentials)
  },
  register: (userData) => {
    const url = `${API_BASE_URL}/auth/register/`
    console.log('Calling register URL:', url)
    return api.post(url, userData)
  },
  logout: () => api.post('/auth/logout/'),
  getProfile: () => api.get('/auth/profile/'),
  changePassword: (passwordData) => api.post('/auth/change-password/', passwordData),
  requestPasswordReset: (phoneData) => api.post('/auth/reset-password-request/', phoneData),
  resetPassword: (resetData) => api.post('/auth/reset-password/', resetData),
  
  // User management (Admin only)
  getUsers: () => api.get('/auth/users/'),
  getVoters: () => api.get('/auth/voters/').then(normalizeListResponse),
  verifyVoter: (voterId) => api.post(`/auth/voters/${voterId}/verify/`),
  cancelVoter: (voterId) => api.post(`/auth/voters/${voterId}/cancel/`),
  // Create admin (Superuser only)
  createAdmin: (data) => api.post('/auth/create-admin/', data),
  // Create INEC Official (Superuser or Admin)
  createInecOfficial: (data) => api.post('/auth/create-inec-official/', data),
}

// Elections API
export const electionsAPI = {
  getElections: () => api.get('/elections/elections/').then(normalizeListResponse),
  getElection: (id) => api.get(`/elections/elections/${id}/`),
  createElection: (data) => api.post('/elections/elections/', data),
  updateElection: (id, data) => api.put(`/elections/elections/${id}/`, data),
  deleteElection: (id) => api.delete(`/elections/elections/${id}/`),
  
  // Candidates
  getCandidates: (electionId) => api.get(`/elections/elections/${electionId}/candidates/`).then(normalizeListResponse),
  createCandidate: (data) => {
    // If a photo/file is present, send as multipart/form-data
    if (data instanceof FormData) {
      return api.post('/elections/candidates/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }

    // If plain object, send JSON (no file)
    return api.post('/elections/candidates/', data)
  },
  updateCandidate: (id, data) => api.put(`/elections/candidates/${id}/`, data),
  deleteCandidate: (id) => api.delete(`/elections/candidates/${id}/`),
  
  // Results
  getResults: (electionId) => api.get(`/elections/elections/${electionId}/results/`),
  getLiveResults: (electionId) => api.get(`/elections/elections/${electionId}/live-results/`),
  exportResults: (electionId) => api.get(`/elections/elections/${electionId}/results/export/`),
  
  // Election management
  startElection: (electionId) => api.post(`/elections/elections/${electionId}/start/`),
  endElection: (electionId) => api.post(`/elections/elections/${electionId}/end/`),
  checkElectionStatus: () => api.post('/elections/elections/check-status/'),
  getActiveElections: () => api.get('/elections/active/').then(normalizeListResponse),
}

// Voting API
export const votingAPI = {
  getBallot: (electionId) => api.get(`/voting/ballot/${electionId}/`),
  castVote: (data) => api.post('/voting/cast-vote/', data),
  getVotingHistory: () => api.get('/voting/history/'),
  verifyVote: (voteId) => api.post('/voting/verify/', { vote_id: voteId }),
  
  // Voting sessions
  startVotingSession: (electionId) => api.post('/voting/session/start/', { election_id: electionId }),
  completeVotingSession: (sessionId) => api.post(`/voting/session/${sessionId}/complete/`),
  
  // Statistics
  getVotingStats: () => api.get('/voting/stats/'),
}

// Incidents API
export const incidentsAPI = {
  getIncidents: () => api.get('/incidents/reports/').then(normalizeListResponse),
  getIncident: (id) => api.get(`/incidents/reports/${id}/`),
  createIncident: (data) => {
    // If caller already provided a FormData (e.g., file inputs), send it directly
    if (data instanceof FormData) {
      return api.post('/incidents/reports/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }

    const formData = new FormData()
    // Add text fields from plain object
    Object.keys(data).forEach(key => {
      if (key !== 'evidence_files') {
        formData.append(key, data[key])
      }
    })

    // Add files
    if (data.evidence_files) {
      data.evidence_files.forEach(file => {
        formData.append('evidence_files', file)
      })
    }

    return api.post('/incidents/reports/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  updateIncident: (id, data) => api.put(`/incidents/reports/${id}/`, data),
  deleteIncident: (id) => api.delete(`/incidents/reports/${id}/`),
  
  // Incident management (INEC Officials)
  assignIncident: (incidentId, officialId) => api.post('/incidents/assign/', {
    incident_id: incidentId,
    official_id: officialId
  }),
  updateIncidentStatus: (incidentId, data) => api.post(`/incidents/reports/${incidentId}/status/`, data),
  addResponse: (data) => api.post('/incidents/response/', data),
  getMyIncidents: () => api.get('/incidents/my-incidents/'),
  
  // Statistics
  getIncidentStats: () => api.get('/incidents/stats/'),
}

// Admin API - Using existing endpoints that are actually implemented
export const adminAPI = {
  // These endpoints use existing functionality
  getDashboardStats: async () => {
    // This will be implemented by calling multiple existing endpoints
    const elections = await electionsAPI.getElections()
    const voters = await authAPI.getVoters()
    const incidents = await incidentsAPI.getIncidents()
    
    return {
      totalElections: elections.data.length,
      activeElections: elections.data.filter(e => e.status === 'ongoing').length,
      totalVoters: voters.data.length,
      verifiedVoters: voters.data.filter(v => v.registration_verified).length,
      pendingVoters: voters.data.filter(v => !v.registration_verified).length,
      totalIncidents: incidents.data.length,
      pendingIncidents: incidents.data.filter(i => i.status === 'pending').length
    }
  },
  // Other admin functions would be implemented using existing endpoints
}

export { API_BASE_URL, MEDIA_BASE_URL }
export default api