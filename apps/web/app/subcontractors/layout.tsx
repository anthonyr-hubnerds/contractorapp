import { Container, Box } from '@mui/material';
import Navigation from '../components/Navigation';

export default function SubcontractorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Navigation />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {children}
      </Container>
    </Box>
  );
}