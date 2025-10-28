'use client';

import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  MenuItem,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  Rating,
  FormHelperText,
  Alert,
  Divider,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';

const businessTypes = ['LLC', 'Corporation', 'Sole Proprietorship', 'Partnership'];
const statuses = ['active', 'inactive', 'suspended'];

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  email: Yup.string().email('Invalid email address'),
  phone: Yup.string().matches(/^[0-9-+().\s]*$/, 'Invalid phone number'),
  address: Yup.string(),
  taxId: Yup.string(),
  businessType: Yup.string().oneOf(businessTypes, 'Invalid business type'),
  rating: Yup.number().min(0).max(5),
  status: Yup.string().oneOf(statuses, 'Invalid status').required('Status is required'),
  specialties: Yup.array().of(Yup.string()).min(1, 'At least one specialty is required'),
  companyId: Yup.string().required('Company is required'),
});

export default function NewSubcontractorPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [specialty, setSpecialty] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/companies');
        const data = await res.json();
        if (Array.isArray(data) && data.length) {
          setCompanies(data);
          formik.setFieldValue('companyId', data[0].id);
        }
      } catch (err) {
        setError('Failed to load companies');
      }
    };
    fetchCompanies();
  }, []);

  interface FormValues {
    name: string;
    email: string;
    phone: string;
    address: string;
    taxId: string;
    businessType: string;
    rating: number;
    status: string;
    specialties: string[];
    companyId: string;
  }

  const formik = useFormik<FormValues>({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      taxId: '',
      businessType: '',
      rating: 0,
      status: 'active',
      specialties: [],
      companyId: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:4000/api/subcontractors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        if (!res.ok) throw new Error('Failed to create subcontractor');
        router.push('/subcontractors');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
  });

  const handleAddSpecialty = () => {
    if (specialty && !formik.values.specialties.includes(specialty)) {
      formik.setFieldValue('specialties', [...formik.values.specialties, specialty]);
      setSpecialty('');
    }
  };

  const handleRemoveSpecialty = (specialtyToRemove: string) => {
    formik.setFieldValue(
      'specialties',
      formik.values.specialties.filter((s: string) => s !== specialtyToRemove)
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>Create Subcontractor</Typography>
        <Typography variant="body2" color="text.secondary">
          Add a new subcontractor with their business details and specialties
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3 }}>
        <form onSubmit={formik.handleSubmit}>
          <Stack spacing={3}>
            {error && <Alert severity="error">{error}</Alert>}
            
            <Typography variant="h6">Basic Information</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                name="name"
                label="Business Name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                required
              />
              <FormControl fullWidth>
                <InputLabel>Company</InputLabel>
                <Select
                  name="companyId"
                  value={formik.values.companyId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.companyId && Boolean(formik.errors.companyId)}
                  label="Company"
                  required
                >
                  {companies.map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
                {formik.touched.companyId && formik.errors.companyId && (
                  <FormHelperText error>{formik.errors.companyId}</FormHelperText>
                )}
              </FormControl>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                name="email"
                label="Email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
              />
              <TextField
                fullWidth
                name="phone"
                label="Phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.phone && Boolean(formik.errors.phone)}
                helperText={formik.touched.phone && formik.errors.phone}
              />
            </Stack>

            <Divider />
            <Typography variant="h6">Business Details</Typography>

            <TextField
              fullWidth
              name="address"
              label="Business Address"
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.address && Boolean(formik.errors.address)}
              helperText={formik.touched.address && formik.errors.address}
              multiline
              rows={2}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                name="taxId"
                label="Tax ID"
                value={formik.values.taxId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.taxId && Boolean(formik.errors.taxId)}
                helperText={formik.touched.taxId && formik.errors.taxId}
              />
              <FormControl fullWidth>
                <InputLabel>Business Type</InputLabel>
                <Select
                  name="businessType"
                  value={formik.values.businessType}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.businessType && Boolean(formik.errors.businessType)}
                  label="Business Type"
                >
                  {businessTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
                {formik.touched.businessType && formik.errors.businessType && (
                  <FormHelperText error>{formik.errors.businessType}</FormHelperText>
                )}
              </FormControl>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formik.values.status}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.status && Boolean(formik.errors.status)}
                  label="Status"
                  required
                >
                  {statuses.map(status => (
                    <MenuItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</MenuItem>
                  ))}
                </Select>
                {formik.touched.status && formik.errors.status && (
                  <FormHelperText error>{formik.errors.status}</FormHelperText>
                )}
              </FormControl>

              <Box sx={{ textAlign: 'center' }}>
                <Typography component="legend">Rating</Typography>
                <Rating
                  name="rating"
                  value={formik.values.rating}
                  onChange={(_, value) => formik.setFieldValue('rating', value)}
                  precision={0.5}
                />
              </Box>
            </Stack>

            <Divider />
            <Typography variant="h6">Specialties</Typography>

            <Box>
              <TextField
                fullWidth
                label="Add Specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSpecialty();
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleAddSpecialty} edge="end">
                        <AddIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {formik.touched.specialties && formik.errors.specialties && (
                <FormHelperText error>{formik.errors.specialties}</FormHelperText>
              )}
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formik.values.specialties.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    onDelete={() => handleRemoveSpecialty(s)}
                    color="primary"
                  />
                ))}
              </Box>
            </Box>

            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Link href="/subcontractors" style={{ textDecoration: 'none' }}>
                <Button variant="outlined" disabled={loading}>
                  Cancel
                </Button>
              </Link>
              <Button
                variant="contained"
                type="submit"
                disabled={loading || !formik.isValid}
              >
                Create Subcontractor
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}