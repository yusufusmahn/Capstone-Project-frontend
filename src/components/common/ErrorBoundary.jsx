import React from 'react'
import { Box, Typography, Alert, Button } from '@mui/material'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // You could log to an external service here
    console.error('Uncaught error in component tree:', error, info)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            An unexpected error occurred while rendering this page.
          </Alert>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
            {String(this.state.error && this.state.error.toString())}
          </Typography>
          <Button variant="contained" onClick={this.handleReload}>Reload</Button>
        </Box>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
