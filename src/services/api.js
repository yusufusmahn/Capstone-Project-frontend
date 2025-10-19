import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_URL
export const MEDIA_BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : ''

// Use relative URLs when API_BASE_URL is not provided (dev proxy will handle /api)
const apiBaseForHelpers = API_BASE_URL || ''

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeAuthToken()
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

function normalizeListResponse(response) {
  if (!response) return { data: [] }
  const payload = response.data
  if (Array.isArray(payload)) {
    return { data: payload }
  }
  if (payload && Array.isArray(payload.results)) {
    const { results, ...meta } = payload
    return { data: results, meta }
  }
  return { data: payload }
}

export const authAPI = {
  setAuthToken,
  removeAuthToken,
  
  login: (credentials) => {
    const url = `${apiBaseForHelpers}/auth/login/`
    return api.post(url, credentials)
  },
  register: (userData) => {
    const url = `${apiBaseForHelpers}/auth/register/`
    return api.post(url, userData)
  },
  logout: () => api.post('/auth/logout/'),
  getProfile: () => api.get('/auth/profile/'),
  changePassword: (passwordData) => api.post('/auth/change-password/', passwordData),
  // Password reset endpoints temporarily disabled in frontend
  // requestPasswordReset: (phoneData) => api.post('/auth/reset-password-request/', phoneData),
  // resetPassword: (resetData) => api.post('/auth/reset-password/', resetData),
  
  getUsers: () => api.get('/auth/users/'),
  getVoters: (params = {}) => {
    // Use the searchable endpoint when params are provided to enable server-side filtering/pagination
    const url = Object.keys(params).length ? '/auth/voters/search/' : '/auth/voters/'
    return api.get(url, { params }).then(normalizeListResponse)
  },
  getVoter: (voterId) => api.get(`/auth/voters/${voterId}/`),
  getVoterHistory: (voterId) => api.get(`/auth/voters/${voterId}/history/`).then(res => res.data),
  verifyVoter: (voterId) => api.post(`/auth/voters/${voterId}/verify/`),
  cancelVoter: (voterId) => api.post(`/auth/voters/${voterId}/cancel/`),
  createAdmin: (data) => api.post('/auth/create-admin/', data),
  createInecOfficial: (data) => api.post('/auth/create-inec-official/', data),
}

export const electionsAPI = {
  getElections: () => api.get('/elections/elections/').then(normalizeListResponse),
  getElection: (id) => api.get(`/elections/elections/${id}/`),
  createElection: (data) => api.post('/elections/elections/', data),
  updateElection: (id, data) => api.put(`/elections/elections/${id}/`, data),
  deleteElection: (id) => api.delete(`/elections/elections/${id}/`),
  
  getCandidates: (electionId) => api.get(`/elections/elections/${electionId}/candidates/`).then(normalizeListResponse),
  createCandidate: (data) => {
    if (data instanceof FormData) {
      return api.post('/elections/candidates/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }

    return api.post('/elections/candidates/', data)
  },
  updateCandidate: (id, data) => api.put(`/elections/candidates/${id}/`, data),
  deleteCandidate: (id) => api.delete(`/elections/candidates/${id}/`),
  
  getResults: (electionId) => api.get(`/elections/elections/${electionId}/results/`),
  getLiveResults: (electionId) => api.get(`/elections/elections/${electionId}/live-results/`),
  exportResults: (electionId) => api.get(`/elections/elections/${electionId}/results/export/`),
  
  startElection: (electionId) => api.post(`/elections/elections/${electionId}/start/`),
  endElection: (electionId) => api.post(`/elections/elections/${electionId}/end/`),
  checkElectionStatus: () => api.post('/elections/elections/check-status/'),
  getActiveElections: () => api.get('/elections/active/').then(normalizeListResponse),
}

export const votingAPI = {
  getBallot: (electionId) => api.get(`/voting/ballot/${electionId}/`),
  castVote: (data) => api.post('/voting/cast-vote/', data),
  getVotingHistory: () => api.get('/voting/history/'),
  verifyVote: (voteId) => api.post('/voting/verify/', { vote_id: voteId }),
  
  startVotingSession: (electionId) => api.post('/voting/session/start/', { election_id: electionId }),
  completeVotingSession: (sessionId) => api.post(`/voting/session/${sessionId}/complete/`),
  
  getVotingStats: () => api.get('/voting/stats/'),
}

export const incidentsAPI = {
  getIncidents: () => api.get('/incidents/reports/').then(normalizeListResponse),
  getIncident: (id) => api.get(`/incidents/reports/${id}/`),
  createIncident: (data) => {
    if (data instanceof FormData) {
      return api.post('/incidents/reports/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }

    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (key !== 'evidence_files') {
        formData.append(key, data[key])
      }
    })

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
  
  assignIncident: (incidentId, officialId) => api.post('/incidents/assign/', {
    incident_id: incidentId,
    official_id: officialId
  }),
  updateIncidentStatus: (incidentId, data) => api.post(`/incidents/reports/${incidentId}/status/`, data),
  addResponse: (data) => api.post('/incidents/response/', data),
  getMyIncidents: () => api.get('/incidents/my-incidents/'),
  
  getIncidentStats: () => api.get('/incidents/stats/'),
}

export const adminAPI = {
  /**
   * Aggregates dashboard statistics by calling existing endpoints.
   * Returns an object with keys used by AdminDashboard: totalElections, activeElections,
   * totalVoters, verifiedVoters, pendingVoters, totalIncidents, pendingIncidents
   */
  getDashboardStats: async () => {
    // Use available helpers to fetch data in parallel
    try {
      const [electionsRes, votersRes, incidentsStatsRes] = await Promise.all([
        electionsAPI.getElections(),
        authAPI.getVoters(),
        // incidentsAPI exposes getIncidentStats which returns a response from /incidents/stats/
        incidentsAPI.getIncidentStats().catch(() => null)
      ])

  const elections = (electionsRes && electionsRes.data) || []
  const electionsMeta = (electionsRes && electionsRes.meta) || {}
      const voters = (votersRes && votersRes.data) || []
      const incidentStats = (incidentsStatsRes && incidentsStatsRes.data) || null

  // If the API returned pagination metadata, prefer its total/count value
  const totalElections = electionsMeta.count || electionsMeta.total || elections.length || 0
  // For active elections we can either rely on server-provided aggregated count in meta
  // or compute from the current page. Prefer meta.active if available.
  const activeElections = electionsMeta.active || (Array.isArray(elections) ? elections.filter(e => e.status === 'ongoing').length : 0) || 0

      const totalVoters = voters.length || 0
      const verifiedVoters = (Array.isArray(voters) ? voters.filter(v => v.registration_verified).length : 0) || 0
      const pendingVoters = (Array.isArray(voters) ? voters.filter(v => !v.registration_verified).length : 0) || 0

      // incidents endpoint may return aggregated counts already
      let totalIncidents = 0
      let pendingIncidents = 0
      if (incidentStats) {
        // try common shapes
        totalIncidents = incidentStats.total_incidents || incidentStats.totalIncidents || 0
        pendingIncidents = (incidentStats.incidents_by_status && incidentStats.incidents_by_status.pending) || incidentStats.pendingIncidents || 0
      }

      return {
        totalElections,
        activeElections,
        totalVoters,
        verifiedVoters,
        pendingVoters,
        totalIncidents,
        pendingIncidents
      }
    } catch (err) {
      // bubble up error for callers to handle
      throw err
    }
  }
}

// Note: named constants `API_BASE_URL` and `MEDIA_BASE_URL` are exported above