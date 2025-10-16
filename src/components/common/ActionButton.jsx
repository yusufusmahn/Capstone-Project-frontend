import React from 'react'
import { Button } from '@mui/material'
import { useTheme } from '@mui/material/styles'

const schemes = {
  green: { backgroundColor: '#008751', '&:hover': { backgroundColor: '#006633' } },
  red: { backgroundColor: '#f44336', '&:hover': { backgroundColor: '#d32f2f' } },
  orange: { backgroundColor: '#ff9800', '&:hover': { backgroundColor: '#f57c00' } },
  neutral: { color: '#666' }
}

export default function ActionButton({ scheme = 'green', sx = {}, children, variant = 'contained', ...props }) {
  const theme = useTheme()
  const mode = theme?.palette?.mode || 'light'
  let schemeSx = schemes[scheme] || {}
  // handle theme-aware cancel scheme
  if (scheme === 'cancel') {
    if (mode === 'dark') {
      schemeSx = { color: '#e0e0e0', backgroundColor: 'transparent', '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' } }
    } else {
      schemeSx = { color: '#666', backgroundColor: 'transparent', '&:hover': { backgroundColor: '#f5f5f5' } }
    }
  }
  // Apply scheme styles only for contained buttons. For outlined/text, prefer explicit sx overrides
  let mergedSx
  if (variant === 'contained') {
    mergedSx = { borderRadius: 2, ...schemeSx, ...sx }
  } else if (variant === 'text') {
    // For neutral/text buttons, allow scheme to influence color (e.g., neutral)
    mergedSx = { ...schemeSx, ...sx }
  } else {
    // outlined or other variants: keep borderRadius and respect caller sx
    mergedSx = { borderRadius: 2, ...sx }
  }

  return (
    <Button variant={variant} sx={mergedSx} {...props}>
      {children}
    </Button>
  )
}
