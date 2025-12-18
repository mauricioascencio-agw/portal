import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon,
  DonutLarge as DonutLargeIcon,
} from '@mui/icons-material';
import AdminLayout from '../../layouts/AdminLayout';

const ChartsPage: React.FC = () => {
  const chartTypes = [
    {
      title: 'Gráfica de Barras',
      description: 'Comparación de valores por categorías',
      icon: <BarChartIcon sx={{ fontSize: 64, color: '#667eea' }} />,
      color: '#667eea',
    },
    {
      title: 'Gráfica de Líneas',
      description: 'Tendencias y evolución temporal',
      icon: <ShowChartIcon sx={{ fontSize: 64, color: '#10b981' }} />,
      color: '#10b981',
    },
    {
      title: 'Gráfica Circular',
      description: 'Distribución porcentual',
      icon: <PieChartIcon sx={{ fontSize: 64, color: '#f97316' }} />,
      color: '#f97316',
    },
    {
      title: 'Gráfica de Dona',
      description: 'Proporciones con detalle central',
      icon: <DonutLargeIcon sx={{ fontSize: 64, color: '#0ea5e9' }} />,
      color: '#0ea5e9',
    },
  ];

  return (
    <AdminLayout>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            Gráficas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Visualización de datos con gráficas interactivas
          </Typography>
        </Box>

        {/* Tipos de Gráficas */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {chartTypes.map((chart, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      mb: 2,
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    {chart.icon}
                  </Box>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    {chart.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {chart.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Área de Visualización */}
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 2,
            minHeight: 500,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          }}
        >
          <BarChartIcon sx={{ fontSize: 140, color: '#667eea', mb: 3, opacity: 0.3 }} />
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Dashboard de Gráficas
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 700 }}>
            Visualiza tus datos con gráficas interactivas usando Recharts. Soporta gráficas de
            líneas, barras, áreas, circulares (pie), donas, barras apiladas, radar y scatter.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Line', 'Bar', 'Area', 'Pie', 'Donut', 'Stacked Bar', 'Radar', 'Scatter'].map(
              (type) => (
                <Box
                  key={type}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: 'rgba(102, 126, 234, 0.1)',
                    color: '#667eea',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  {type}
                </Box>
              )
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
            Funcionalidad disponible próximamente
          </Typography>
        </Paper>
      </Box>
    </AdminLayout>
  );
};

export default ChartsPage;
