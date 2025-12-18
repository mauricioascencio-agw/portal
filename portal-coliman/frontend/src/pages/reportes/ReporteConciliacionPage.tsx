import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  TextField,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  PictureAsPdf as PictureAsPdfIcon,
  TableChart as TableChartIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  AccountBalance as AccountBalanceIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingActionsIcon,
  Receipt as ReceiptIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  CreditCard as CreditCardIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Area,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReporteConciliacionData {
  titulo: string;
  periodo: {
    fecha_inicio: string;
    fecha_fin: string;
  };
  generado_en: string;
  generado_por: string;
  resumen: {
    total_facturas: number;
    total_ingresos: number;
    total_egresos: number;
    saldo_neto: number;
    facturas_validadas: number;
    facturas_pendientes: number;
    porcentaje_validacion: number;
  };
  formas_pago: Array<{
    codigo: string;
    nombre: string;
    tipo: string;
    cantidad: number;
    monto: number;
  }>;
  metodos_pago: Array<{
    codigo: string;
    nombre: string;
    cantidad: number;
    monto: number;
  }>;
  movimientos_diarios: Array<{
    fecha: string;
    num_facturas: number;
    ingresos: number;
    egresos: number;
    saldo: number;
    validadas: number;
    pendientes: number;
  }>;
  facturas_pendientes: Array<{
    uuid: string;
    tipo: string;
    serie: string;
    folio: string;
    fecha: string;
    emisor_rfc: string;
    emisor_nombre: string;
    receptor_rfc: string;
    receptor_nombre: string;
    total: number;
    dias_pendiente: number;
  }>;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('es-MX').format(value);
};

const ReporteConciliacionPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReporteConciliacionData | null>(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;

      const response = await api.get('/api/reports/conciliacion', { params });
      setData(response.data);
    } catch (err: any) {
      console.error('Error fetching report:', err);
      setError(err.response?.data?.detail || 'Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleFilter = () => {
    fetchReport();
  };

  const exportToPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Título
    doc.setFontSize(20);
    doc.setTextColor(249, 115, 22);
    doc.text('Reporte de Conciliación', pageWidth / 2, 20, { align: 'center' });

    // Período
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Período: ${data.periodo.fecha_inicio} a ${data.periodo.fecha_fin}`, pageWidth / 2, 28, { align: 'center' });

    // Resumen
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Resumen de Conciliación', 14, 45);

    const resumenData = [
      ['Total Facturas', formatNumber(data.resumen.total_facturas)],
      ['Total Ingresos', formatCurrency(data.resumen.total_ingresos)],
      ['Total Egresos', formatCurrency(data.resumen.total_egresos)],
      ['Saldo Neto', formatCurrency(data.resumen.saldo_neto)],
      ['Facturas Validadas', formatNumber(data.resumen.facturas_validadas)],
      ['Facturas Pendientes', formatNumber(data.resumen.facturas_pendientes)],
      ['% Validación', `${data.resumen.porcentaje_validacion}%`],
    ];

    (doc as any).autoTable({
      startY: 50,
      head: [['Concepto', 'Valor']],
      body: resumenData,
      theme: 'striped',
      headStyles: { fillColor: [249, 115, 22] },
    });

    // Formas de Pago
    doc.text('Formas de Pago', 14, (doc as any).lastAutoTable.finalY + 15);

    const formasData = data.formas_pago.map((f) => [
      f.nombre,
      f.tipo,
      f.cantidad.toString(),
      formatCurrency(f.monto),
    ]);

    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Forma de Pago', 'Tipo', 'Cantidad', 'Monto']],
      body: formasData,
      theme: 'striped',
      headStyles: { fillColor: [249, 115, 22] },
    });

    // Facturas Pendientes
    if (data.facturas_pendientes.length > 0) {
      doc.addPage();
      doc.text('Facturas Pendientes de Validación', 14, 20);

      const pendientesData = data.facturas_pendientes.slice(0, 20).map((f) => [
        f.folio || '-',
        f.tipo,
        f.fecha?.split('T')[0] || '-',
        f.emisor_rfc,
        formatCurrency(f.total),
        `${f.dias_pendiente} días`,
      ]);

      (doc as any).autoTable({
        startY: 25,
        head: [['Folio', 'Tipo', 'Fecha', 'Emisor', 'Total', 'Días Pend.']],
        body: pendientesData,
        theme: 'striped',
        headStyles: { fillColor: [249, 115, 22] },
        styles: { fontSize: 8 },
      });
    }

    doc.save(`reporte_conciliacion_${data.periodo.fecha_inicio}_${data.periodo.fecha_fin}.pdf`);
  };

  const exportToCSV = () => {
    if (!data) return;

    // Movimientos diarios
    const headers = ['Fecha', 'Num Facturas', 'Ingresos', 'Egresos', 'Saldo', 'Validadas', 'Pendientes'];
    const rows = data.movimientos_diarios.map((m) => [
      m.fecha,
      m.num_facturas,
      m.ingresos,
      m.egresos,
      m.saldo,
      m.validadas,
      m.pendientes,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `conciliacion_movimientos_${data.periodo.fecha_inicio}_${data.periodo.fecha_fin}.csv`;
    link.click();
  };

  return (
    <AdminLayout>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/reportes')} sx={{ bgcolor: 'rgba(249, 115, 22, 0.1)' }}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Reporte de Conciliación
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Análisis de movimientos y conciliación
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<PictureAsPdfIcon />}
              onClick={exportToPDF}
              disabled={!data}
              sx={{ bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' } }}
            >
              Exportar PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<TableChartIcon />}
              onClick={exportToCSV}
              disabled={!data}
              sx={{ borderColor: '#f97316', color: '#f97316' }}
            >
              Exportar CSV
            </Button>
          </Box>
        </Box>

        {/* Filtros */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label="Fecha Inicio"
              type="date"
              size="small"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Fecha Fin"
              type="date"
              size="small"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="contained" onClick={handleFilter} sx={{ bgcolor: '#f97316' }}>
              Generar Reporte
            </Button>
            <Button variant="outlined" onClick={() => { setFechaInicio(''); setFechaFin(''); fetchReport(); }} startIcon={<RefreshIcon />}>
              Limpiar
            </Button>
          </Box>
        </Paper>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} sx={{ color: '#f97316' }} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && data && (
          <>
            {/* Período */}
            <Box sx={{ mb: 3 }}>
              <Chip
                label={`Período: ${data.periodo.fecha_inicio} a ${data.periodo.fecha_fin}`}
                sx={{ bgcolor: '#f97316', color: 'white' }}
              />
            </Box>

            {/* Resumen Principal */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'rgba(102, 126, 234, 0.1)', border: '1px solid rgba(102, 126, 234, 0.3)' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <ReceiptIcon sx={{ fontSize: 40, color: '#667eea', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Total Facturas</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea' }}>
                      {formatNumber(data.resumen.total_facturas)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TrendingUpIcon sx={{ fontSize: 40, color: '#10b981', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Total Ingresos</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#10b981' }}>
                      {formatCurrency(data.resumen.total_ingresos)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <AccountBalanceIcon sx={{ fontSize: 40, color: '#f97316', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Total Egresos</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#f97316' }}>
                      {formatCurrency(data.resumen.total_egresos)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{
                  bgcolor: data.resumen.saldo_neto >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: data.resumen.saldo_neto >= 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <CreditCardIcon sx={{ fontSize: 40, color: data.resumen.saldo_neto >= 0 ? '#10b981' : '#ef4444', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Saldo Neto</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: data.resumen.saldo_neto >= 0 ? '#10b981' : '#ef4444' }}>
                      {formatCurrency(data.resumen.saldo_neto)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Estado de Validación */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <CheckCircleIcon sx={{ fontSize: 32, color: '#10b981' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Validadas</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#10b981' }}>
                          {formatNumber(data.resumen.facturas_validadas)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <PendingActionsIcon sx={{ fontSize: 32, color: '#f97316' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Pendientes</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#f97316' }}>
                          {formatNumber(data.resumen.facturas_pendientes)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Porcentaje de Validación
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
                      {data.resumen.porcentaje_validacion}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={data.resumen.porcentaje_validacion}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: 'rgba(102, 126, 234, 0.1)',
                        '& .MuiLinearProgress-bar': { bgcolor: '#667eea', borderRadius: 5 },
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Gráfica de Movimientos */}
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Movimientos Diarios
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={data.movimientos_diarios}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" tickFormatter={(value) => value.split('-').slice(1).join('/')} />
                  <YAxis yAxisId="left" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                  <YAxis yAxisId="right" orientation="right" />
                  <RechartsTooltip
                    formatter={(value: number, name: string) =>
                      name === 'Facturas' ? value : formatCurrency(value)
                    }
                  />
                  <Legend />
                  <Bar yAxisId="right" dataKey="num_facturas" name="Facturas" fill="#667eea" opacity={0.7} />
                  <Line yAxisId="left" type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={2} />
                  <Line yAxisId="left" type="monotone" dataKey="egresos" name="Egresos" stroke="#f97316" strokeWidth={2} />
                  <Area yAxisId="left" type="monotone" dataKey="saldo" name="Saldo" fill="rgba(102, 126, 234, 0.2)" stroke="#667eea" />
                </ComposedChart>
              </ResponsiveContainer>
            </Paper>

            {/* Formas y Métodos de Pago */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Formas de Pago
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(249, 115, 22, 0.1)' }}>
                          <TableCell>Forma</TableCell>
                          <TableCell>Tipo</TableCell>
                          <TableCell align="center">Cantidad</TableCell>
                          <TableCell align="right">Monto</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.formas_pago.map((forma, index) => (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{forma.nombre}</Typography>
                              <Typography variant="caption" color="text.secondary">Código: {forma.codigo}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={forma.tipo}
                                size="small"
                                sx={{
                                  bgcolor: forma.tipo === 'Ingreso' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                                  color: forma.tipo === 'Ingreso' ? '#10b981' : '#f97316',
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">{forma.cantidad}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(forma.monto)}</TableCell>
                          </TableRow>
                        ))}
                        {data.formas_pago.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              <Typography variant="body2" color="text.secondary">No hay datos</Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Métodos de Pago
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(249, 115, 22, 0.1)' }}>
                          <TableCell>Método</TableCell>
                          <TableCell align="center">Cantidad</TableCell>
                          <TableCell align="right">Monto</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.metodos_pago.map((metodo, index) => (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{metodo.nombre}</Typography>
                              <Typography variant="caption" color="text.secondary">Código: {metodo.codigo}</Typography>
                            </TableCell>
                            <TableCell align="center">{metodo.cantidad}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(metodo.monto)}</TableCell>
                          </TableRow>
                        ))}
                        {data.metodos_pago.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} align="center">
                              <Typography variant="body2" color="text.secondary">No hay datos</Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>

            {/* Facturas Pendientes */}
            {data.facturas_pendientes.length > 0 && (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <WarningIcon sx={{ color: '#f97316' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Facturas Pendientes de Validación ({data.facturas_pendientes.length})
                  </Typography>
                </Box>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Folio</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Emisor</TableCell>
                        <TableCell>Receptor</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="center">Días Pend.</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.facturas_pendientes.map((factura, index) => (
                        <TableRow key={index} hover sx={{
                          bgcolor: factura.dias_pendiente > 7 ? 'rgba(239, 68, 68, 0.05)' : 'inherit'
                        }}>
                          <TableCell>{factura.serie ? `${factura.serie}-${factura.folio}` : factura.folio || '-'}</TableCell>
                          <TableCell>
                            <Chip label={factura.tipo} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>{factura.fecha?.split('T')[0] || '-'}</TableCell>
                          <TableCell>
                            <Typography variant="caption" display="block">{factura.emisor_rfc}</Typography>
                            <Typography variant="caption" color="text.secondary">{factura.emisor_nombre?.substring(0, 20)}...</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" display="block">{factura.receptor_rfc}</Typography>
                            <Typography variant="caption" color="text.secondary">{factura.receptor_nombre?.substring(0, 20)}...</Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(factura.total)}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${factura.dias_pendiente} días`}
                              size="small"
                              sx={{
                                bgcolor: factura.dias_pendiente > 7 ? 'rgba(239, 68, 68, 0.1)' :
                                         factura.dias_pendiente > 3 ? 'rgba(249, 115, 22, 0.1)' :
                                         'rgba(16, 185, 129, 0.1)',
                                color: factura.dias_pendiente > 7 ? '#ef4444' :
                                       factura.dias_pendiente > 3 ? '#f97316' : '#10b981',
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </>
        )}
      </Box>
    </AdminLayout>
  );
};

export default ReporteConciliacionPage;
