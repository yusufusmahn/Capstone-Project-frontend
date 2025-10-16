import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import ErrorBoundary from './components/common/ErrorBoundary'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageVoters from './pages/inec/ManageVoters'
import VotingPage from './pages/voting/VotingPage'
import ElectionResults from './pages/elections/ElectionResults'
import IncidentReport from './pages/incidents/IncidentReport'
import Profile from './pages/auth/Profile'
// ForgotPassword routes temporarily disabled; component file kept for future restore
// import ForgotPassword from './pages/auth/ForgotPassword'
import PasswordReset from './pages/auth/PasswordReset'

function App() {
  const { isAuthenticated, user } = useAuth()

  return (
    <ErrorBoundary>
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" /> : <Login />
      } />
      <Route path="/register" element={
        isAuthenticated ? <Navigate to="/" /> : <Register />
      } />
  {/* Forgot/reset password routes temporarily disabled */}
  {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}
  {/* <Route path="/reset-password" element={<PasswordReset />} /> */}
      
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      
      <Route path="/vote" element={
        <ProtectedRoute requiredRole="voter">
          <VotingPage />
        </ProtectedRoute>
      } />
      
      <Route path="/results" element={
        <ProtectedRoute>
          <ElectionResults />
        </ProtectedRoute>
      } />
      
      <Route path="/report-incident" element={
        <ProtectedRoute requiredRole="voter">
          <IncidentReport />
        </ProtectedRoute>
      } />

      <Route path="/incidents" element={
        <ProtectedRoute>
          <IncidentReport />
        </ProtectedRoute>
      } />
      
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/manage-voters" element={
        <ProtectedRoute requiredRole="inec_official">
          <ManageVoters />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </ErrorBoundary>
  )
}

export default App