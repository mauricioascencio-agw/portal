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
} from '@mui/material';
import {
  PictureAsPdf as PictureAsPdfIcon,
  TableChart as TableChartIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Receipt as ReceiptIcon,
  AttachMoney as AttachMoneyIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  ShowChart as ShowChartIcon,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReporteEjecutivoData {
  titulo: string;
  periodo: {
    actual: {
      fecha_inicio: string;
      fecha_fin: string;
    };
    anterior: {
      fecha_inicio: string;
      fecha_fin: string;
    };
  };
  generado_en: string;
  generado_por: string;
  kpis: {
    total_cfdis: { valor: number; anterior: number; variacion: number };
    ingresos: { valor: number; anterior: number; variacion: number };
    egresos: { valor: number; anterior: number; variacion: number };
    utilidad: { valor: number; anterior: number; variacion: number };
    ticket_promedio: { valor: number };
    clientes_unicos: { valor: number };
    proveedores_unicos: { valor: number };
  };
  tendencia_diaria: Array<{
    fecha: string;
    ingresos: number;
    egresos: number;
    cantidad: number;
  }>;
  top_clientes: Array<{
    rfc: string;
    nombre: string;
    num_facturas: number;
    total: number;
    promedio: number;
  }>;
  estado_validacion: Array<{
    estado: string;
    cantidad: number;
    monto: number;
  }>;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('es-MX').format(value);
};

const ReporteEjecutivoPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReporteEjecutivoData | null>(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;

      const response = await api.get('/api/reports/ejecutivo', { params });
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
    doc.setTextColor(16, 185, 129);
    doc.text('Reporte Ejecutivo', pageWidth / 2, 20, { align: 'center' });

    // Período
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Período: ${data.periodo.actual.fecha_inicio} a ${data.periodo.actual.fecha_fin}`, pageWidth / 2, 28, { align: 'center' });

    // KPIs
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Indicadores Clave', 14, 45);

    const kpisData = [
      ['Total CFDIs', formatNumber(data.kpis.total_cfdis.valor), `${data.kpis.total_cfdis.variacion}%`],
      ['Ingresos', formatCurrency(data.kpis.ingresos.valor), `${data.kpis.ingresos.variacion}%`],
      ['Egresos', formatCurrency(data.kpis.egresos.valor), `${data.kpis.egresos.variacion}%`],
      ['Utilidad', formatCurrency(data.kpis.utilidad.valor), `${data.kpis.utilidad.variacion}%`],
      ['Ticket Promedio', formatCurrency(data.kpis.ticket_promedio.valor), '-'],
      ['Clientes Únicos', formatNumber(data.kpis.clientes_unicos.valor), '-'],
    ];

    (doc as any).autoTable({
      startY: 50,
      head: [['KPI', 'Valor', 'Variación']],
      body: kpisData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
    });

    // Top Clientes
    doc.text('Top 10 Clientes', 14, (doc as any).lastAutoTable.finalY + 15);

    const clientesData = data.top_clientes.map((c) => [
      c.nombre?.substring(0, 30) || c.rfc,
      c.num_facturas.toString(),
      formatCurrency(c.total),
      formatCurrency(c.promedio),
    ]);

    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Cliente', 'Facturas', 'Total', 'Promedio']],
      body: clientesData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
    });

    doc.save(`reporte_ejecutivo_${data.periodo.actual.fecha_inicio}_${data.periodo.actual.fecha_fin}.pdf`);
  };

  const KPICard = ({
    title,
    value,
    previousValue,
    variation,
    icon,
    color,
    isCurrency = false,
  }: {
    title: string;
    value: number;
    previousValue?: number;
    variation?: number;
    icon: React.ReactNode;
    color: string;
    isCurrency?: boolean;
  }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${color}15`, color }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color, mb: 1 }}>
          {isCurrency ? formatCurrency(value) : formatNumber(value)}
        </Typography>
        {variation !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {variation >= 0 ? (
              <TrendingUpIcon sx={{ color: '#10b981', fontSize: 20 }} />
            ) : (
              <TrendingDownIcon sx={{ color: '#ef4444', fontSize: 20 }} />
            )}
            <Typography
              variant="body2"
              sx={{ color: variation >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}
            >
              {variation >= 0 ? '+' : ''}{variation}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              vs período anterior
            </Typography>
          </Box>
        )}
        {previousValue !== undefined && variation !== undefined && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            Anterior: {isCurrency ? formatCurrency(previousValue) : formatNumber(previousValue)}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/reportes')} sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)' }}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Reporte Ejecutivo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Resumen ejecutivo con KPIs y comparativas
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<PictureAsPdfIcon />}
              onClick={exportToPDF}
              disabled={!data}
              sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
            >
              Exportar PDF
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
            <Button variant="contained" onClick={handleFilter} sx={{ bgcolor: '#10b981' }}>
              Generar Reporte
            </Button>
            <Button variant="outlined" onClick={() => { setFechaInicio(''); setFechaFin(''); fetchReport(); }} startIcon={<RefreshIcon />}>
              Limpiar
            </Button>
          </Box>
        </Paper>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} sx={{ color: '#10b981' }} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && data && (
          <>
            {/* Períodos */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                label={`Actual: ${data.periodo.actual.fecha_inicio} a ${data.periodo.actual.fecha_fin}`}
                color="success"
              />
              <Chip
                label={`Anterior: ${data.periodo.anterior.fecha_inicio} a ${data.periodo.anterior.fecha_fin}`}
                variant="outlined"
              />
            </Box>

            {/* KPIs Principales */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <KPICard
                  title="Total CFDIs"
                  value={data.kpis.total_cfdis.valor}
                  previousValue={data.kpis.total_cfdis.anterior}
                  variation={data.kpis.total_cfdis.variacion}
                  icon={<ReceiptIcon />}
                  color="#667eea"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KPICard
                  title="Ingresos"
                  value={data.kpis.ingresos.valor}
                  previousValue={data.kpis.ingresos.anterior}
                  variation={data.kpis.ingresos.variacion}
                  icon={<AttachMoneyIcon />}
                  color="#10b981"
                  isCurrency
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KPICard
                  title="Egresos"
                  value={data.kpis.egresos.valor}
                  previousValue={data.kpis.egresos.anterior}
                  variation={data.kpis.egresos.variacion}
                  icon={<ShowChartIcon />}
                  color="#f97316"
                  isCurrency
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KPICard
                  title="Utilidad"
                  value={data.kpis.utilidad.valor}
                  previousValue={data.kpis.utilidad.anterior}
                  variation={data.kpis.utilidad.variacion}
                  icon={<TrendingUpIcon />}
                  color={data.kpis.utilidad.valor >= 0 ? '#10b981' : '#ef4444'}
                  isCurrency
                />
              </Grid>
            </Grid>

            {/* KPIs Secundarios */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <AttachMoneyIcon sx={{ fontSize: 40, color: '#0ea5e9', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Ticket Promedio</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#0ea5e9' }}>
                      {formatCurrency(data.kpis.ticket_promedio.valor)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <PeopleIcon sx={{ fontSize: 40, color: '#8b5cf6', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Clientes Únicos</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#8b5cf6' }}>
                      {formatNumber(data.kpis.clientes_unicos.valor)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <BusinessIcon sx={{ fontSize: 40, color: '#ec4899', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Proveedores Únicos</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#ec4899' }}>
                      {formatNumber(data.kpis.proveedores_unicos.valor)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Gráfica de Tendencia */}
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Tendencia Diaria del Período
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={data.tendencia_diaria}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" tickFormatter={(value) => value.split('-').slice(1).join('/')} />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                  <RechartsTooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="ingresos"
                    name="Ingresos"
                    stroke="#10b981"
                    fill="rgba(16, 185, 129, 0.3)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="egresos"
                    name="Egresos"
                    stroke="#f97316"
                    fill="rgba(249, 115, 22, 0.3)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>

            {/* Top Clientes */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Top 10 Clientes
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)' }}>
                          <TableCell>#</TableCell>
                          <TableCell>Cliente</TableCell>
                          <TableCell align="center">Facturas</TableCell>
                          <TableCell align="right">Total</TableCell>
                          <TableCell align="right">Promedio</TableCell>
                          <TableCell>Participación</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.top_clientes.map((cliente, index) => {
                          const maxTotal = data.top_clientes[0]?.total || 1;
                          const participation = (cliente.total / maxTotal) * 100;
                          return (
                            <TableRow key={index} hover>
                              <TableCell>
                                <Chip
                                  label={index + 1}
                                  size="small"
                                  sx={{
                                    bgcolor: index < 3 ? '#10b981' : 'grey.300',
                                    color: index < 3 ? 'white' : 'text.primary',
                                    fontWeight: 600,
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {cliente.nombre || 'Sin nombre'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {cliente.rfc}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">{cliente.num_facturas}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, color: '#10b981' }}>
                                {formatCurrency(cliente.total)}
                              </TableCell>
                              <TableCell align="right">{formatCurrency(cliente.promedio)}</TableCell>
                              <TableCell sx={{ minWidth: 120 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={participation}
                                    sx={{
                                      flex: 1,
                                      height: 8,
                                      borderRadius: 4,
                                      bgcolor: 'rgba(16, 185, 129, 0.1)',
                                      '& .MuiLinearProgress-bar': { bgcolor: '#10b981' },
                                    }}
                                  />
                                  <Typography variant="caption" sx={{ minWidth: 35 }}>
                                    {participation.toFixed(0)}%
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              {/* Estado de Validación */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Estado de Validación
                  </Typography>
                  {data.estado_validacion.map((estado, index) => {
                    const total = data.estado_validacion.reduce((acc, e) => acc + e.cantidad, 0);
                    const percentage = total > 0 ? (estado.cantidad / total) * 100 : 0;
                    const colors: Record<string, string> = {
                      pendiente: '#f97316',
                      valido: '#10b981',
                      rechazado: '#ef4444',
                      revision: '#0ea5e9',
                    };
                    const labels: Record<string, string> = {
                      pendiente: 'Pendiente',
                      valido: 'Válido',
                      rechazado: 'Rechazado',
                      revision: 'En Revisión',
                    };
                    return (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">{labels[estado.estado] || estado.estado}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {estado.cantidad} ({percentage.toFixed(0)}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            height: 10,
                            borderRadius: 5,
                            bgcolor: `${colors[estado.estado] || '#94a3b8'}20`,
                            '& .MuiLinearProgress-bar': {
                              bgcolor: colors[estado.estado] || '#94a3b8',
                              borderRadius: 5,
                            },
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Monto: {formatCurrency(estado.monto)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </AdminLayout>
  );
};

export default ReporteEjecutivoPage;
