import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import ErrorBoundary from './components/common/ErrorBoundary'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import VotingPage from './pages/voting/VotingPage'
import ElectionResults from './pages/elections/ElectionResults'
import IncidentReport from './pages/incidents/IncidentReport'
import Profile from './pages/auth/Profile'
import ForgotPassword from './pages/auth/ForgotPassword'
import PasswordReset from './pages/auth/PasswordReset'

function App() {
  const { isAuthenticated, user } = useAuth()

  return (
    <ErrorBoundary>
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" /> : <Login />
      } />
      <Route path="/register" element={
        isAuthenticated ? <Navigate to="/" /> : <Register />
      } />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<PasswordReset />} />
      
      {/* Protected routes */}
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
      
      {/* Redirect all other routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </ErrorBoundary>
  )
}

export default App