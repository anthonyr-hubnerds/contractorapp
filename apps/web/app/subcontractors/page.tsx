'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import Link from 'next/link';
import BusinessIcon from '@mui/icons-material/Business';
import SubcontractorCard from '../components/SubcontractorCard';
import { useSubcontractors } from '../hooks/useSubcontractors';

export default function SubcontractorsPage() {
  const { subcontractors, loading, error } = useSubcontractors();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Subcontractors
        </Typography>
        <Link href="/subcontractors/new" style={{ textDecoration: 'none' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<BusinessIcon />}
            sx={{ textTransform: 'none' }}
          >
            Add Subcontractor
          </Button>
        </Link>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {subcontractors.map((sub) => (
          <SubcontractorCard key={sub.id} subcontractor={sub} />
        ))}
      </Box>
    </Box>
  );
}