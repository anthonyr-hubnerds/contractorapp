'use client';

import { Box, Container, Paper, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import Navigation from './components/Navigation';

interface Company {
  id: string;
  name: string;
  projects: Project[];
  subcontractors: Subcontractor[];
}

interface Project {
  id: string;
  name: string;
  budget: number;
  timeEntries: TimeEntry[];
}

interface Subcontractor {
  id: string;
  name: string;
  docs: ComplianceDocument[];
}

interface TimeEntry {
  id: string;
  hours: number;
  status: string;
}

interface ComplianceDocument {
  id: string;
  type: string;
  status: string;
  expiresAt: string;
}

export default function Home() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/companies', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch company data');
        }
        const companies = await response.json();
        if (companies && companies.length > 0) {
          setCompany(companies[0]); // Using the first company for now
        } else {
          throw new Error('No company data found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!company) return <div>No company data found</div>;

  return (
    <Box>
      <Navigation />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {company.name} Dashboard
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { md: '1fr 1fr' }, gap: 3 }}>
          {/* Projects Summary */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Active Projects ({company.projects.length})
            </Typography>
            {company.projects.map((project) => (
              <Box key={project.id} sx={{ mb: 2 }}>
                <Typography variant="subtitle1">{project.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Budget: ${project.budget.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Time Entries: {project.timeEntries.length}
                </Typography>
              </Box>
            ))}
          </Paper>

          {/* Subcontractors Summary */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Subcontractors ({company.subcontractors.length})
            </Typography>
            {company.subcontractors.map((sub) => (
              <Box key={sub.id} sx={{ mb: 2 }}>
                <Typography variant="subtitle1">{sub.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Documents: {sub.docs.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Compliance Status:{' '}
                  {sub.docs.some((doc) => doc.status === 'approved') ? '✅ Approved' : '⚠️ Pending'}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
