import { createTheme } from '@mui/material/styles'

export const getAppTheme = (mode = 'light') => {
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#00a35a',
      },
      background: {
        default: isDark ? '#07111a' : '#f6fbff',
        paper: isDark ? '#0b1722' : '#ffffff',
      },
      text: {
        primary: isDark ? '#e6eef6' : '#1f2937',
        secondary: isDark ? '#bcd3d8' : undefined
      }
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#063220' : '#008751'
          }
        }
      }
    }
  })
}
