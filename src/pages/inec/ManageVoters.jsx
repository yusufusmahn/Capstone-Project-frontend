import { useEffect, useState, useMemo } from 'react'
import { Container, Typography, Box, Paper, Table, TableHead, TableRow, TableCell, TableBody, TextField, MenuItem, FormControl, InputLabel, Select, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, TableContainer, TablePagination } from '@mui/material'
import { Layout } from '../../components/layout/Layout'
import { Search } from '@mui/icons-material'
import { authAPI } from '../../services/api'
import ActionButton from '../../components/common/ActionButton'
import { Refresh } from '@mui/icons-material'
import { Chip, CircularProgress, List, ListItem, ListItemText } from '@mui/material'

const ManageVoters = () => {
  const [voters, setVoters] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedVoter, setSelectedVoter] = useState(null)

  const fetchVoters = async (q = '', verified = 'all') => {
    setLoading(true)
    try {
      // build query params
      const params = {}
      if (q) params.search = q
      if (verified === 'verified') params.registration_verified = true
      if (verified === 'unverified') params.registration_verified = false
      // pagination params (assume backend uses 1-indexed page)
      params.page = page + 1
      params.page_size = rowsPerPage

      const resp = await authAPI.getVoters(params)
      // authAPI.getVoters returns { data, meta } when paginated
      const data = (resp && resp.data) || []
      const meta = resp && resp.meta ? resp.meta : null
      setVoters(data)
  // Normalize total count: prefer meta.count -> meta.total -> resp.meta.count -> fallback to data.length
  let count = 0
  if (meta && typeof meta.count !== 'undefined') count = meta.count
  else if (meta && typeof meta.total !== 'undefined') count = meta.total
  else if (resp && resp.meta && typeof resp.meta.count !== 'undefined') count = resp.meta.count
  else count = data.length
  setTotalCount(Number(count || 0))
    } catch (err) {
      console.error('Failed to load voters', err)
      setVoters([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVoters()
  }, [])

  // simple debounced search effect
  useEffect(() => {
    const t = setTimeout(() => fetchVoters(search, verifiedFilter), 400)
    return () => clearTimeout(t)
  }, [search, verifiedFilter])

  const rows = useMemo(() => voters || [], [voters])

  const loadVoterDetails = async (voter) => {
    // fetch history
    setSelectedVoter({ ...voter, history: null, loadingHistory: true })
    try {
      const history = await authAPI.getVoterHistory(voter.voter_id)
      setSelectedVoter(prev => ({ ...prev, history }))
    } catch (err) {
      console.error('Failed to load voter history', err)
      setSelectedVoter(prev => ({ ...prev, history: [] }))
    } finally {
      setSelectedVoter(prev => ({ ...prev, loadingHistory: false }))
    }
  }

  return (
    <Layout>
      <Box sx={{ minHeight: '100vh', pt: 2, pb: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" gutterBottom sx={{ color: '#008751', fontWeight: 'bold' }}>
            Manage Voters
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ color: '#666' }}>{totalCount} registered voters</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton aria-label="refresh" size="small" onClick={() => fetchVoters()} sx={{ color: '#008751' }}>
                <Refresh />
              </IconButton>
              {loading && <CircularProgress size={20} />}
            </Box>
          </Box>

          <Paper sx={{ mt: 1, p: 2, borderRadius: 2, boxShadow: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Search by name or voter id"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <Search sx={{ mr: 1 }} /> }}
                sx={{ minWidth: 320 }}
              />

              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="verified-filter-label">Verified</InputLabel>
                <Select
                  labelId="verified-filter-label"
                  value={verifiedFilter}
                  label="Verified"
                  onChange={(e) => setVerifiedFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="verified">Verified</MenuItem>
                  <MenuItem value="unverified">Unverified</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TableContainer sx={{ borderRadius: 1, overflow: 'hidden', bgcolor: 'background.paper' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Voter ID</TableCell>
                    <TableCell>Verified</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map(v => (
                    <TableRow key={v.user?.id || v.voter_id || Math.random()} hover>
                      <TableCell>{v.user?.name || v.name || '-'}</TableCell>
                      <TableCell>{v.voter_id || v.voters_card_id || '-'}</TableCell>
                      <TableCell>
                        <Chip label={v.registration_verified ? 'Verified' : 'Unverified'} color={v.registration_verified ? 'success' : 'default'} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <ActionButton variant="text" scheme="neutral" onClick={() => loadVoterDetails(v)} sx={{ fontWeight: 600 }}>View</ActionButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            />
          </Paper>

          {/* Details dialog (read-only) */}
          <Dialog open={Boolean(selectedVoter)} onClose={() => setSelectedVoter(null)} fullWidth maxWidth="sm">
            <DialogTitle>Voter Details</DialogTitle>
            <DialogContent>
              {selectedVoter && (
                <Box sx={{ display: 'grid', gap: 1 }}>
                  <Typography><strong>Name:</strong> {selectedVoter.user?.name || '-'}</Typography>
                  <Typography><strong>Phone:</strong> {selectedVoter.user?.phone_number || '-'}</Typography>
                  <Typography><strong>Email:</strong> {selectedVoter.user?.email || '-'}</Typography>
                  <Typography><strong>Voter ID:</strong> {selectedVoter.voter_id || '-'}</Typography>
                  <Typography><strong>Voter Card ID:</strong> {selectedVoter.voters_card_id || '-'}</Typography>
                  <Typography><strong>Verified:</strong> {selectedVoter.registration_verified ? 'Yes' : 'No'}</Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedVoter(null)}>Close</Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </Layout>
  )
}

export default ManageVoters
