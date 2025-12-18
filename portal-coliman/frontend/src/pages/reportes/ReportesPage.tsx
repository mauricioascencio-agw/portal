import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  PictureAsPdf as PictureAsPdfIcon,
  TableChart as TableChartIcon,
  CloudDownload as CloudDownloadIcon,
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import AdminLayout from '../../layouts/AdminLayout';

const ReportesPage: React.FC = () => {
  const navigate = useNavigate();

  const reportTypes = [
    {
      title: 'Reporte Fiscal',
      description: 'Reporte detallado de comprobantes fiscales con desglose de impuestos, ingresos y egresos',
      icon: <PictureAsPdfIcon sx={{ fontSize: 48, color: '#667eea' }} />,
      color: '#667eea',
      bgColor: 'rgba(102, 126, 234, 0.1)',
      path: '/reportes/fiscal',
    },
    {
      title: 'Reporte Ejecutivo',
      description: 'Resumen ejecutivo con KPIs principales, comparativas y análisis de tendencias',
      icon: <AssessmentIcon sx={{ fontSize: 48, color: '#10b981' }} />,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      path: '/reportes/ejecutivo',
    },
    {
      title: 'Reporte de Conciliación',
      description: 'Conciliación de movimientos, formas de pago y facturas pendientes de validación',
      icon: <TableChartIcon sx={{ fontSize: 48, color: '#f97316' }} />,
      color: '#f97316',
      bgColor: 'rgba(249, 115, 22, 0.1)',
      path: '/reportes/conciliacion',
    },
  ];

  const features = [
    { icon: <PictureAsPdfIcon />, text: 'Exportación a PDF' },
    { icon: <TableChartIcon />, text: 'Exportación a CSV/Excel' },
    { icon: <TrendingUpIcon />, text: 'Gráficas interactivas' },
    { icon: <CloudDownloadIcon />, text: 'Descarga inmediata' },
  ];

  return (
    <AdminLayout>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
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
              Reportes Ejecutivos
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Genera reportes fiscales, ejecutivos y de conciliación
            </Typography>
          </Box>
        </Box>

        {/* Tipos de Reportes */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {reportTypes.map((report, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  },
                }}
                onClick={() => navigate(report.path)}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      mb: 3,
                      display: 'flex',
                      justifyContent: 'center',
                      p: 2,
                      borderRadius: 3,
                      bgcolor: report.bgColor,
                      width: 'fit-content',
                      mx: 'auto',
                    }}
                  >
                    {report.icon}
                  </Box>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, textAlign: 'center' }}>
                    {report.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3, textAlign: 'center', minHeight: 48 }}
                  >
                    {report.description}
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      bgcolor: report.color,
                      '&:hover': {
                        bgcolor: report.color,
                        filter: 'brightness(0.9)',
                      },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(report.path);
                    }}
                  >
                    Generar Reporte
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Características */}
        <Paper
          sx={{
            p: 4,
            borderRadius: 2,
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          }}
        >
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
            Características de los Reportes
          </Typography>
          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={6} sm={3} key={index}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  }}
                >
                  <Box
                    sx={{
                      display: 'inline-flex',
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'rgba(102, 126, 234, 0.1)',
                      color: '#667eea',
                      mb: 1,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {feature.text}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Info adicional */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Todos los reportes incluyen filtros por fecha y exportación en múltiples formatos.
            Los datos se obtienen en tiempo real de la base de datos.
          </Typography>
        </Box>
      </Box>
    </AdminLayout>
  );
};

export default ReportesPage;
