import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { getAppTheme } from '../theme'

export const ThemeContext = createContext(null)

export function useThemeMode() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeMode must be used within ThemeProvider')
  return ctx
}

export function CustomThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try {
      const stored = localStorage.getItem('theme_mode')
      return stored === 'dark' ? 'dark' : 'light'
    } catch (e) {
      return 'light'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('theme_mode', mode)
    } catch (e) {

    }
  }, [mode])

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', mode)
    } catch (e) {

    }
  }, [mode])

  const toggle = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'))

  const theme = useMemo(() => getAppTheme(mode), [mode])

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  )
}
