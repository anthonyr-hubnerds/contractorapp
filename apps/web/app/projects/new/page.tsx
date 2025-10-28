'use client';

import { Box, Button, Container, Paper, TextField, Typography, MenuItem } from '@mui/material';
import { useEffect, useState } from 'react';
import Navigation from '../../components/Navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewProjectPage() {
  const [name, setName] = useState('');
  const [budget, setBudget] = useState<number | ''>('');
  const [companyId, setCompanyId] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/companies');
        const data = await res.json();
        if (Array.isArray(data) && data.length) {
          setCompanies(data);
          setCompanyId(data[0].id);
        }
      } catch (err) {
        // ignore
      }
    };
    fetchCompanies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:4000/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, budget: budget === '' ? null : Number(budget), companyId }),
      });
      if (!res.ok) throw new Error('Failed to create project');
      router.push('/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Navigation />
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>Create Project</Typography>
        <Paper sx={{ p: 2 }}>
          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Name" value={name} onChange={e => setName(e.target.value)} sx={{ mb: 2 }} required />
            <TextField fullWidth label="Budget" type="number" value={budget} onChange={e => setBudget(e.target.value === '' ? '' : Number(e.target.value))} sx={{ mb: 2 }} />
            <TextField select fullWidth label="Company" value={companyId} onChange={e => setCompanyId(e.target.value)} sx={{ mb: 2 }}>
              {companies.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </TextField>
            {error && <Typography color="error">{error}</Typography>}
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button variant="contained" type="submit" disabled={loading}>Create</Button>
              <Link href="/projects" style={{ textDecoration: 'none' }}>
                <Button variant="outlined">Cancel</Button>
              </Link>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}