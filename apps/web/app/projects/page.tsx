'use client';

import {
  Box,
  Container,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button
} from '@mui/material';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';

interface Project {
  id: string;
  name: string;
  budget?: number;
  timeEntries: any[];
  company?: any;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/projects');
        if (!res.ok) throw new Error('Failed to load projects');
        const data = await res.json();
        setProjects(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  if (loading) return <div>Loading projects...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Box>
      <Navigation />
      <Container
        maxWidth="lg"
        sx={{ mt: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography variant="h4" gutterBottom>
          Projects
        </Typography>
        <Box>
          <Link href="/projects/new" style={{ textDecoration: 'none' }}>
            <Button variant="contained">Create Project</Button>
          </Link>
        </Box>
        <Paper sx={{ p: 2 }}>
          <List>
            {projects.map((p) => (
              <ListItem key={p.id} divider>
                <ListItemText
                  primary={p.name}
                  secondary={`Budget: $${p.budget ?? 0} — Time Entries: ${p.timeEntries?.length ?? 0}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Container>
    </Box>
  );
}
