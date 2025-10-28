import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import Link from 'next/link';

const Navigation = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          BuildSync
        </Typography>
        <Box>
          <Link href="/" passHref style={{ textDecoration: 'none' }}>
            <Button color="inherit">Dashboard</Button>
          </Link>
          <Link href="/projects" passHref style={{ textDecoration: 'none' }}>
            <Button color="inherit">Projects</Button>
          </Link>
          <Link href="/subcontractors" passHref style={{ textDecoration: 'none' }}>
            <Button color="inherit">Subcontractors</Button>
          </Link>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
