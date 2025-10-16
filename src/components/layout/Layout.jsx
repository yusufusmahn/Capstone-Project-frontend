import { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material'
import {
  Menu as MenuIcon,
  AccountCircle,
  Dashboard,
  HowToVote,
  BarChart,
  Report,
  Settings,
  ExitToApp
} from '@mui/icons-material'
import { Brightness4, Brightness7 } from '@mui/icons-material'
import { useThemeMode } from '../../contexts/ThemeContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'


const drawerWidth = 240

const getNavigationItems = (userRole, helpers = {}) => {
  // getNavigationItems
  const items = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/' },
  ]

  const isVoter = helpers.isVoter || userRole === 'voter'

  if (isVoter) {
    items.push(
      { text: 'Vote', icon: <HowToVote />, path: '/vote' },
      { text: 'Results', icon: <BarChart />, path: '/results' },
      { text: 'Report Incident', icon: <Report />, path: '/report-incident' }
    )
  } else if (userRole === 'admin') {
    items.push(
      { text: 'Admin Dashboard', icon: <Settings />, path: '/admin' }
    )
  }

  return items
}

export const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  
  const { user, logout, isAdmin, isInec, isVoter } = useAuth()
  const { mode, toggle } = useThemeMode()
  
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const navigationItems = getNavigationItems(user?.role, { isAdmin, isInec, isVoter })

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen)

  const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget)

  const handleProfileMenuClose = () => setAnchorEl(null)

  const handleLogout = () => {
    handleProfileMenuClose()
    logout()
    navigate('/login')
  }

  const handleNavigation = (path) => {
    navigate(path)
    if (isMobile) setMobileOpen(false)
  }

  const drawer = (
    <div>
      <Toolbar sx={{ 
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.getContrastText(theme.palette.primary.main),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: { xs: '56px', md: '64px' }
      }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          Voting System
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                backgroundColor: theme.palette.mode === 'light' ? 'transparent' : undefined,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.mode === 'light' ? 'rgba(255,255,255,0.12)' : 'rgba(0,135,81,0.1)',
                  borderRight: theme.palette.mode === 'light' ? `4px solid ${theme.palette.primary.dark || '#007a44'}` : '4px solid #008751',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'light' ? 'rgba(255,255,255,0.14)' : 'rgba(0, 135, 81, 0.2)',
                  }
                }
              }}
            >
              <ListItemIcon sx={{ 
                color: location.pathname === item.path ? (theme.palette.mode === 'light' ? theme.palette.primary.contrastText : '#008751') : (theme.palette.mode === 'light' ? theme.palette.primary.contrastText : 'inherit'),
                minWidth: '40px'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ component: 'div' }}
                sx={{ 
                  '& .MuiTypography-root': { 
                    fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                    color: location.pathname === item.path ? (theme.palette.mode === 'light' ? theme.palette.primary.contrastText : '#008751') : (theme.palette.mode === 'light' ? theme.palette.primary.contrastText : 'inherit')
                  } 
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  )

  // Rendering Layout component

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: '#008751',
          boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          opacity: 1
        }}
      >
        <Toolbar sx={{ minHeight: { xs: '56px', md: '64px' } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* spacer to keep right-side controls aligned; the drawer already shows the app name */}
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              onClick={toggle}
              sx={{ mr: 1 }}
              aria-label="toggle theme"
            >
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
            <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
              {user?.name}
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="profile-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, backgroundColor: 'white', color: '#008751', fontWeight: 'bold' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        sx={{ mt: 1 }}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <AccountCircle sx={{ mr: 1, color: '#008751' }} /> Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ExitToApp sx={{ mr: 1, color: '#f44336' }} /> Logout
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: theme.palette.mode === 'light' ? theme.palette.primary.main : undefined,
              color: theme.palette.mode === 'light' ? theme.palette.getContrastText(theme.palette.primary.main) : undefined
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: theme.palette.mode === 'light' ? theme.palette.primary.main : undefined,
              color: theme.palette.mode === 'light' ? theme.palette.getContrastText(theme.palette.primary.main) : undefined
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: 3,
          pb: 3,
          pt: { xs: '56px', md: '64px' }, // ensure content is pushed below the fixed AppBar
          width: { md: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: 'transparent',
          minHeight: '100vh'
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

export default Layout