import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';

interface CFDIConcepto {
  clave_prod_serv: string;
  cantidad: number;
  clave_unidad: string;
  unidad: string;
  descripcion: string;
  valor_unitario: number;
  importe: number;
  descuento: number;
}

interface CFDIDetail {
  id: number;
  uuid: string;
  fecha: string;
  tipo_comprobante: string;
  emisor_rfc: string;
  emisor_nombre: string;
  emisor_regimen: string;
  receptor_rfc: string;
  receptor_nombre: string;
  receptor_uso_cfdi: string;
  subtotal: number;
  total: number;
  moneda: string;
  tipo_cambio: number;
  metodo_pago: string;
  forma_pago: string;
  total_impuestos_trasladados: number;
  total_impuestos_retenidos: number;
  estatus_validacion: string;
  xml_path: string;
  created_at: string;
  conceptos?: CFDIConcepto[];
}

const CFDIDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [cfdi, setCfdi] = useState<CFDIDetail | null>(location.state?.cfdi || null);
  const [loading, setLoading] = useState(!cfdi);

  useEffect(() => {
    if (!cfdi && id) {
      fetchCFDIDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCFDIDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/cfdis/${id}`);
      setCfdi(response.data);
    } catch (error) {
      console.error('Error fetching CFDI detail:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography>Cargando...</Typography>
        </Box>
      </AdminLayout>
    );
  }

  if (!cfdi) {
    return (
      <AdminLayout>
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography>CFDI no encontrado</Typography>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/cfdis')} sx={{ mt: 2 }}>
            Volver al Listado
          </Button>
        </Box>
      </AdminLayout>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valido':
        return <CheckCircleIcon color="success" />;
      case 'rechazado':
        return <ErrorIcon color="error" />;
      case 'revisión':
        return <WarningIcon color="warning" />;
      default:
        return <DescriptionIcon color="action" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valido':
        return 'success';
      case 'rechazado':
        return 'error';
      case 'revisión':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTipoComprobanteLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      I: 'Ingreso',
      E: 'Egreso',
      T: 'Traslado',
      N: 'Nómina',
      P: 'Pago',
    };
    return tipos[tipo] || tipo;
  };

  return (
    <AdminLayout>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/cfdis')}
              sx={{ mb: 2 }}
            >
              Volver al Listado
            </Button>
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
              Detalle de CFDI
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
              UUID: {cfdi.uuid}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {getStatusIcon(cfdi.estatus_validacion)}
            <Chip
              label={cfdi.estatus_validacion.toUpperCase()}
              color={getStatusColor(cfdi.estatus_validacion)}
              size="medium"
              sx={{ fontSize: '1rem', py: 2.5 }}
            />
          </Box>
        </Box>

        {/* Información General */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon /> Información General
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Tipo de Comprobante</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {getTipoComprobanteLabel(cfdi.tipo_comprobante)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Fecha</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {new Date(cfdi.fecha).toLocaleString('es-MX')}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Moneda</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {cfdi.moneda} {cfdi.tipo_cambio !== 1 && `(TC: ${cfdi.tipo_cambio})`}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Método de Pago</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {cfdi.metodo_pago || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Forma de Pago</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {cfdi.forma_pago || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Uso CFDI</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {cfdi.receptor_uso_cfdi || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Archivo XML</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {cfdi.xml_path}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Fecha de Registro</Typography>
              <Typography variant="body2">
                {new Date(cfdi.created_at).toLocaleString('es-MX')}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Emisor y Receptor */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Emisor (Proveedor)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">RFC</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                    {cfdi.emisor_rfc}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">Razón Social</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {cfdi.emisor_nombre}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Régimen Fiscal</Typography>
                  <Typography variant="body2">
                    {cfdi.emisor_regimen || 'N/A'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="secondary">
                  Receptor (Cliente)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">RFC</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                    {cfdi.receptor_rfc}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">Razón Social</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {cfdi.receptor_nombre}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Uso CFDI</Typography>
                  <Typography variant="body2">
                    {cfdi.receptor_uso_cfdi || 'N/A'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Conceptos */}
        {cfdi.conceptos && cfdi.conceptos.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Conceptos ({cfdi.conceptos.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell>Clave</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell>Unidad</TableCell>
                    <TableCell align="right">Valor Unitario</TableCell>
                    <TableCell align="right">Importe</TableCell>
                    <TableCell align="right">Descuento</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cfdi.conceptos.map((concepto, index) => (
                    <TableRow key={index} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {concepto.clave_prod_serv}
                      </TableCell>
                      <TableCell>{concepto.descripcion}</TableCell>
                      <TableCell align="right">{concepto.cantidad}</TableCell>
                      <TableCell>{concepto.clave_unidad}</TableCell>
                      <TableCell align="right">
                        ${concepto.valor_unitario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right">
                        ${concepto.importe.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right">
                        ${concepto.descuento.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Totales */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Resumen de Importes
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ maxWidth: 400, ml: 'auto' }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1" align="right" sx={{ fontWeight: 600 }}>
                  ${cfdi.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </Typography>
              </Grid>

              {cfdi.total_impuestos_trasladados > 0 && (
                <>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Impuestos Trasladados:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1" align="right">
                      ${cfdi.total_impuestos_trasladados.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Grid>
                </>
              )}

              {cfdi.total_impuestos_retenidos > 0 && (
                <>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Impuestos Retenidos:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1" align="right" color="error">
                      -${cfdi.total_impuestos_retenidos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={6}>
                <Typography variant="h6">Total:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography
                  variant="h6"
                  align="right"
                  sx={{
                    fontWeight: 700,
                    color: 'primary.main',
                  }}
                >
                  ${cfdi.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {cfdi.moneda}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </AdminLayout>
  );
};

export default CFDIDetailPage;
