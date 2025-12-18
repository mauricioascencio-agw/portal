import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  BarChart as BarChartIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useAppConfig } from '../contexts/AppConfigContext';
import AdminLayout from '../layouts/AdminLayout';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { companyName, version } = useAppConfig();

  const stats = [
    {
      title: 'CFDIs Validados',
      value: '0',
      icon: <DescriptionIcon sx={{ fontSize: 40 }} />,
      color: '#667eea',
      bgColor: 'rgba(102, 126, 234, 0.1)',
    },
    {
      title: 'Reportes Generados',
      value: '0',
      icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    {
      title: 'KPIs Activos',
      value: '0',
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: '#f97316',
      bgColor: 'rgba(249, 115, 22, 0.1)',
    },
    {
      title: 'Gráficas',
      value: '0',
      icon: <BarChartIcon sx={{ fontSize: 40 }} />,
      color: '#0ea5e9',
      bgColor: 'rgba(14, 165, 233, 0.1)',
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
            ¡Bienvenido, {user?.full_name}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Panel de control - {companyName}
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  background: '#fff',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {stat.title}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                        {stat.value}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: stat.bgColor,
                        color: stat.color,
                      }}
                    >
                      {stat.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Información del Usuario */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Información del Usuario
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                    {user?.email}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Rol
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                    {user?.role}
                  </Typography>
                </Grid>
                {user?.company && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Empresa
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                      {user?.company}
                    </Typography>
                  </Grid>
                )}
                {user?.position && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Puesto
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                      {user?.position}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
              }}
            >
              <DashboardIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                {companyName}
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
                Sistema de validación de CFDIs con autenticación completa
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Versión {version} - © {new Date().getFullYear()}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Accesos Rápidos */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Accesos Rápidos
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <DescriptionIcon sx={{ fontSize: 32, color: '#667eea', mb: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    CFDIs
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Validación de comprobantes
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" disabled>
                    Próximamente
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <AssessmentIcon sx={{ fontSize: 32, color: '#10b981', mb: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Reportes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Generar reportes fiscales
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" disabled>
                    Próximamente
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <TrendingUpIcon sx={{ fontSize: 32, color: '#f97316', mb: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    KPIs
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Indicadores clave
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" disabled>
                    Próximamente
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <BarChartIcon sx={{ fontSize: 32, color: '#0ea5e9', mb: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Gráficas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Visualización de datos
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" disabled>
                    Próximamente
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </AdminLayout>
  );
};

export default Dashboard;
