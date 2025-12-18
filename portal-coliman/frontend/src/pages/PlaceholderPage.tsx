import React from 'react';
import { Box, Paper, Typography, Container } from '@mui/material';
import { Construction as ConstructionIcon } from '@mui/icons-material';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper
        sx={{
          p: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '400px',
          justifyContent: 'center',
        }}
      >
        <ConstructionIcon sx={{ fontSize: 80, color: 'warning.main', mb: 3 }} />
        <Typography variant="h4" gutterBottom align="center">
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 2 }}>
          {description || 'Esta funcionalidad está en desarrollo y estará disponible próximamente.'}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          Mientras tanto, puedes explorar las demás funcionalidades del sistema.
        </Typography>
      </Paper>
    </Container>
  );
};

export default PlaceholderPage;
