import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      authAPI.setAuthToken(token)
      loadUserProfile()
    } else {
      setIsLoading(false)
    }
  }, [])

  const loadUserProfile = async () => {
    try {
      const response = await authAPI.getProfile()
      setUser(response.data.user)
      setProfile(response.data.profile)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Failed to load user profile:', error)
      logout()
    } finally {
      setIsLoading(false)
    }
  }

  // Role helper booleans for easy checks across the app
  const isSuperuser = !!user?.is_superuser
  const isAdmin = user?.role === 'admin' || isSuperuser
  const isInec = user?.role === 'inec_official'
  const isVoter = user?.role === 'voter'

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      const { user, profile, token, verification_status } = response.data
      
      localStorage.setItem('auth_token', token)
      authAPI.setAuthToken(token)
      
      setUser(user)
      setProfile(profile)
      setIsAuthenticated(true)
      
      return { 
        success: true, 
        user, 
        profile,
        verification_status
      }
    } catch (error) {
      console.error('Login error:', error.response?.data)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Login failed. Please check your credentials.'
      
      return { 
        success: false, 
        error: errorMessage,
        details: error.response?.data?.details || {}
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      const { user, profile, token, message, status } = response.data
      
      localStorage.setItem('auth_token', token)
      authAPI.setAuthToken(token)
      
      setUser(user)
      setProfile(profile)
      setIsAuthenticated(true)
      
      return { 
        success: true, 
        user, 
        profile,
        message: message || 'Registration successful!',
        status: status || 'pending_verification'
      }
    } catch (error) {
      console.error('Registration error:', error.response?.data)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Registration failed. Please try again.'
      const details = error.response?.data?.details || {}
      
      return { 
        success: false, 
        error: errorMessage,
        details: details
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    authAPI.removeAuthToken()
    setUser(null)
    setProfile(null)
    setIsAuthenticated(false)
  }


  const value = {
    user,
    profile,
    isAuthenticated,
    isLoading,
    isSuperuser,
    isAdmin,
    isInec,
    isVoter,
    login,
    register,
    logout,
    refreshProfile: loadUserProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}