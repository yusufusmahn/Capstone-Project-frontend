import React from 'react'
import { Box, Typography, Alert, Button } from '@mui/material'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo)
    this.setState({ error: error, errorInfo: errorInfo })
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
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
          {this.state.errorInfo && (
            <details style={{ whiteSpace: 'pre-wrap', marginBottom: '20px' }}>
              <summary>Click for error details</summary>
              {this.state.errorInfo.componentStack}
            </details>
          )}
          <Button variant="contained" onClick={this.handleReload}>Reload</Button>
        </Box>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary