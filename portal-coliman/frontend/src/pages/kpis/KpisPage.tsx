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
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  RemoveCircleOutline as RemoveCircleOutlineIcon,
  Receipt as ReceiptIcon,
  AttachMoney as AttachMoneyIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon,
  PendingActions as PendingActionsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';

interface KPIData {
  periodo: {
    fecha_inicio: string;
    fecha_fin: string;
  };
  resumen_general: {
    total_cfdis: number;
    total_ingresos: number;
    promedio_ingresos: number;
    total_egresos: number;
    promedio_egresos: number;
    utilidad: number;
  };
  distribucion_tipos: Array<{
    tipo: string;
    codigo: string;
    cantidad: number;
    monto: number;
  }>;
  top_clientes: Array<{
    rfc: string;
    nombre: string;
    num_facturas: number;
    total: number;
  }>;
  top_proveedores: Array<{
    rfc: string;
    nombre: string;
    num_facturas: number;
    total: number;
  }>;
  tendencia_mensual: Array<{
    mes: string;
    ingresos: number;
    egresos: number;
    cantidad_ingresos: number;
    cantidad_egresos: number;
  }>;
  estado_validacion: Array<{
    estado: string;
    cantidad: number;
  }>;
  formas_pago: Array<{
    forma_pago: string;
    cantidad: number;
    monto_total: number;
  }>;
}

const COLORS = ['#667eea', '#10b981', '#f97316', '#0ea5e9', '#8b5cf6', '#ec4899'];

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

const getEstadoLabel = (estado: string) => {
  const labels: Record<string, string> = {
    pendiente: 'Pendiente',
    valido: 'Válido',
    rechazado: 'Rechazado',
    revision: 'En Revisión',
  };
  return labels[estado] || estado;
};

const getEstadoColor = (estado: string) => {
  const colors: Record<string, string> = {
    pendiente: '#f97316',
    valido: '#10b981',
    rechazado: '#ef4444',
    revision: '#0ea5e9',
  };
  return colors[estado] || '#94a3b8';
};

const KpisPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const fetchKPIs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;

      const response = await api.get('/api/kpis/dashboard', { params });
      setKpiData(response.data);
    } catch (err: any) {
      console.error('Error fetching KPIs:', err);
      setError(err.response?.data?.detail || 'Error al cargar los KPIs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, []);

  const handleFilter = () => {
    fetchKPIs();
  };

  const handleClearFilter = () => {
    setFechaInicio('');
    setFechaFin('');
    fetchKPIs();
  };

  // Prepare chart data
  const validacionData = kpiData?.estado_validacion.map((item) => ({
    name: getEstadoLabel(item.estado),
    value: item.cantidad,
    color: getEstadoColor(item.estado),
  })) || [];

  const tiposData = kpiData?.distribucion_tipos.map((item) => ({
    name: item.tipo,
    cantidad: item.cantidad,
    monto: item.monto,
  })) || [];

  const tendenciaData = kpiData?.tendencia_mensual.map((item) => ({
    mes: item.mes,
    Ingresos: item.ingresos,
    Egresos: item.egresos,
    'Cantidad Ingresos': item.cantidad_ingresos,
    'Cantidad Egresos': item.cantidad_egresos,
  })) || [];

  // Calculate pending PDFs (CFDIs without pdf_path)
  const totalPendientes = kpiData?.estado_validacion.find(
    (v) => v.estado === 'pendiente'
  )?.cantidad || 0;

  const totalValidados = kpiData?.estado_validacion.find(
    (v) => v.estado === 'valido'
  )?.cantidad || 0;

  const totalRechazados = kpiData?.estado_validacion.find(
    (v) => v.estado === 'rechazado'
  )?.cantidad || 0;

  const kpiCards = [
    {
      title: 'Total CFDIs',
      value: formatNumber(kpiData?.resumen_general.total_cfdis || 0),
      icon: <ReceiptIcon sx={{ fontSize: 32 }} />,
      color: '#667eea',
      bgColor: 'rgba(102, 126, 234, 0.1)',
    },
    {
      title: 'Total Ingresos',
      value: formatCurrency(kpiData?.resumen_general.total_ingresos || 0),
      icon: <AttachMoneyIcon sx={{ fontSize: 32 }} />,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    {
      title: 'Total Egresos',
      value: formatCurrency(kpiData?.resumen_general.total_egresos || 0),
      icon: <AccountBalanceIcon sx={{ fontSize: 32 }} />,
      color: '#f97316',
      bgColor: 'rgba(249, 115, 22, 0.1)',
    },
    {
      title: 'Utilidad',
      value: formatCurrency(kpiData?.resumen_general.utilidad || 0),
      icon: <AssessmentIcon sx={{ fontSize: 32 }} />,
      color: (kpiData?.resumen_general.utilidad || 0) >= 0 ? '#10b981' : '#ef4444',
      bgColor:
        (kpiData?.resumen_general.utilidad || 0) >= 0
          ? 'rgba(16, 185, 129, 0.1)'
          : 'rgba(239, 68, 68, 0.1)',
    },
  ];

  const statusCards = [
    {
      title: 'Pendientes',
      value: formatNumber(totalPendientes),
      icon: <PendingActionsIcon sx={{ fontSize: 28 }} />,
      color: '#f97316',
      bgColor: 'rgba(249, 115, 22, 0.1)',
    },
    {
      title: 'Validados',
      value: formatNumber(totalValidados),
      icon: <CheckCircleIcon sx={{ fontSize: 28 }} />,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    {
      title: 'Rechazados',
      value: formatNumber(totalRechazados),
      icon: <CancelIcon sx={{ fontSize: 28 }} />,
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
    },
    {
      title: 'Promedio/Factura',
      value: formatCurrency(kpiData?.resumen_general.promedio_ingresos || 0),
      icon: <TrendingUpIcon sx={{ fontSize: 28 }} />,
      color: '#0ea5e9',
      bgColor: 'rgba(14, 165, 233, 0.1)',
    },
  ];

  return (
    <AdminLayout>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
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
              Dashboard de KPIs
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Indicadores clave de rendimiento en tiempo real
            </Typography>
          </Box>

          {/* Filtros de fecha */}
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
            <Button
              variant="contained"
              onClick={handleFilter}
              sx={{
                bgcolor: '#667eea',
                '&:hover': { bgcolor: '#5a6fd6' },
              }}
            >
              Filtrar
            </Button>
            <Button variant="outlined" onClick={handleClearFilter} startIcon={<RefreshIcon />}>
              Limpiar
            </Button>
          </Box>
        </Box>

        {/* Período actual */}
        {kpiData && (
          <Box sx={{ mb: 3 }}>
            <Chip
              label={`Período: ${kpiData.periodo.fecha_inicio} a ${kpiData.periodo.fecha_fin}`}
              color="primary"
              variant="outlined"
            />
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && kpiData && (
          <>
            {/* KPI Cards principales */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {kpiCards.map((kpi, index) => (
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
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {kpi.title}
                        </Typography>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor: kpi.bgColor,
                            color: kpi.color,
                          }}
                        >
                          {kpi.icon}
                        </Box>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: kpi.color }}>
                        {kpi.value}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Status Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {statusCards.map((card, index) => (
                <Grid item xs={6} sm={3} key={index}>
                  <Card
                    sx={{
                      background: '#fff',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-2px)' },
                    }}
                  >
                    <CardContent sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor: card.bgColor,
                            color: card.color,
                          }}
                        >
                          {card.icon}
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {card.title}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: card.color }}>
                            {card.value}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Gráficas */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Gráfica de Tendencia */}
              <Grid item xs={12} lg={8}>
                <Paper sx={{ p: 3, height: 400 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Tendencia Mensual
                  </Typography>
                  <ResponsiveContainer width="100%" height="85%">
                    <AreaChart data={tendenciaData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label) => `Mes: ${label}`}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="Ingresos"
                        stroke="#10b981"
                        fill="rgba(16, 185, 129, 0.3)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="Egresos"
                        stroke="#f97316"
                        fill="rgba(249, 115, 22, 0.3)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Gráfica de Estado de Validación */}
              <Grid item xs={12} lg={4}>
                <Paper sx={{ p: 3, height: 400 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Estado de Validación
                  </Typography>
                  <ResponsiveContainer width="100%" height="85%">
                    <PieChart>
                      <Pie
                        data={validacionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {validacionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>

            {/* Distribución por Tipo */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: 350 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Distribución por Tipo de Comprobante
                  </Typography>
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={tiposData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="cantidad" name="Cantidad" fill="#667eea" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: 350 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Monto por Tipo de Comprobante
                  </Typography>
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={tiposData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="monto" name="Monto" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>

            {/* Tablas de Top Clientes/Proveedores */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Top 5 Clientes (Mayor Facturación)
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Cliente</TableCell>
                          <TableCell align="center">Facturas</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {kpiData.top_clientes.length > 0 ? (
                          kpiData.top_clientes.map((cliente, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {cliente.nombre || 'Sin nombre'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {cliente.rfc}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={cliente.num_facturas}
                                  size="small"
                                  sx={{ bgcolor: 'rgba(102, 126, 234, 0.1)', color: '#667eea' }}
                                />
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, color: '#10b981' }}>
                                {formatCurrency(cliente.total)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center">
                              <Typography variant="body2" color="text.secondary">
                                No hay datos de clientes
                              </Typography>
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
                    Top 5 Proveedores (Mayor Gasto)
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Proveedor</TableCell>
                          <TableCell align="center">Facturas</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {kpiData.top_proveedores.length > 0 ? (
                          kpiData.top_proveedores.map((proveedor, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {proveedor.nombre || 'Sin nombre'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {proveedor.rfc}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={proveedor.num_facturas}
                                  size="small"
                                  sx={{ bgcolor: 'rgba(249, 115, 22, 0.1)', color: '#f97316' }}
                                />
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, color: '#f97316' }}>
                                {formatCurrency(proveedor.total)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center">
                              <Typography variant="body2" color="text.secondary">
                                No hay datos de proveedores
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </AdminLayout>
  );
};

export default KpisPage;
