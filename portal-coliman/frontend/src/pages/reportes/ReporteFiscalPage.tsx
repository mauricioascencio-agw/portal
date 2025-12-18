import React, { useState, useEffect, useRef } from 'react';
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
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PictureAsPdf as PictureAsPdfIcon,
  TableChart as TableChartIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  AttachMoney as AttachMoneyIcon,
  AccountBalance as AccountBalanceIcon,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReporteFiscalData {
  titulo: string;
  periodo: {
    fecha_inicio: string;
    fecha_fin: string;
  };
  generado_en: string;
  generado_por: string;
  resumen_general: {
    total_ingresos: number;
    total_egresos: number;
    utilidad_bruta: number;
    total_iva_trasladado: number;
    total_isr_retenido: number;
  };
  resumen_por_tipo: Array<{
    tipo: string;
    codigo: string;
    cantidad: number;
    subtotal: number;
    descuento: number;
    total: number;
    iva_trasladado: number;
    isr_retenido: number;
  }>;
  desglose_emisores: Array<{
    rfc: string;
    nombre: string;
    regimen: string;
    num_facturas: number;
    subtotal: number;
    total: number;
    iva: number;
  }>;
  desglose_receptores: Array<{
    rfc: string;
    nombre: string;
    uso_cfdi: string;
    num_facturas: number;
    subtotal: number;
    total: number;
    iva: number;
  }>;
  facturas: Array<{
    uuid: string;
    tipo: string;
    serie: string;
    folio: string;
    fecha: string;
    emisor_rfc: string;
    emisor_nombre: string;
    receptor_rfc: string;
    receptor_nombre: string;
    subtotal: number;
    descuento: number;
    total: number;
    iva: number;
    isr: number;
    moneda: string;
    metodo_pago: string;
    forma_pago: string;
    estatus: string;
  }>;
}

const COLORS = ['#667eea', '#10b981', '#f97316', '#0ea5e9', '#8b5cf6'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value);
};

const ReporteFiscalPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReporteFiscalData | null>(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;

      const response = await api.get('/api/reports/fiscal', { params });
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
    doc.setTextColor(102, 126, 234);
    doc.text('Reporte Fiscal', pageWidth / 2, 20, { align: 'center' });

    // Período
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Período: ${data.periodo.fecha_inicio} a ${data.periodo.fecha_fin}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Generado: ${new Date(data.generado_en).toLocaleString('es-MX')}`, pageWidth / 2, 34, { align: 'center' });

    // Resumen General
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Resumen General', 14, 48);

    const resumenData = [
      ['Total Ingresos', formatCurrency(data.resumen_general.total_ingresos)],
      ['Total Egresos', formatCurrency(data.resumen_general.total_egresos)],
      ['Utilidad Bruta', formatCurrency(data.resumen_general.utilidad_bruta)],
      ['IVA Trasladado', formatCurrency(data.resumen_general.total_iva_trasladado)],
      ['ISR Retenido', formatCurrency(data.resumen_general.total_isr_retenido)],
    ];

    (doc as any).autoTable({
      startY: 52,
      head: [['Concepto', 'Monto']],
      body: resumenData,
      theme: 'striped',
      headStyles: { fillColor: [102, 126, 234] },
    });

    // Resumen por Tipo
    doc.text('Resumen por Tipo de Comprobante', 14, (doc as any).lastAutoTable.finalY + 15);

    const tiposData = data.resumen_por_tipo.map((t) => [
      t.tipo,
      t.cantidad.toString(),
      formatCurrency(t.subtotal),
      formatCurrency(t.total),
      formatCurrency(t.iva_trasladado),
    ]);

    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 19,
      head: [['Tipo', 'Cantidad', 'Subtotal', 'Total', 'IVA']],
      body: tiposData,
      theme: 'striped',
      headStyles: { fillColor: [102, 126, 234] },
    });

    // Facturas (primera página)
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Detalle de Facturas', 14, 20);

    const facturasData = data.facturas.slice(0, 30).map((f) => [
      f.folio || '-',
      f.tipo,
      f.fecha?.split('T')[0] || '-',
      f.emisor_rfc,
      formatCurrency(f.total),
      f.estatus,
    ]);

    (doc as any).autoTable({
      startY: 25,
      head: [['Folio', 'Tipo', 'Fecha', 'Emisor RFC', 'Total', 'Estatus']],
      body: facturasData,
      theme: 'striped',
      headStyles: { fillColor: [102, 126, 234] },
      styles: { fontSize: 8 },
    });

    doc.save(`reporte_fiscal_${data.periodo.fecha_inicio}_${data.periodo.fecha_fin}.pdf`);
  };

  const exportToCSV = () => {
    if (!data) return;

    const headers = ['UUID', 'Tipo', 'Serie', 'Folio', 'Fecha', 'Emisor RFC', 'Emisor Nombre', 'Receptor RFC', 'Receptor Nombre', 'Subtotal', 'Descuento', 'Total', 'IVA', 'ISR', 'Moneda', 'Método Pago', 'Forma Pago', 'Estatus'];
    const rows = data.facturas.map((f) => [
      f.uuid,
      f.tipo,
      f.serie || '',
      f.folio || '',
      f.fecha || '',
      f.emisor_rfc,
      f.emisor_nombre,
      f.receptor_rfc,
      f.receptor_nombre,
      f.subtotal,
      f.descuento,
      f.total,
      f.iva,
      f.isr,
      f.moneda,
      f.metodo_pago || '',
      f.forma_pago || '',
      f.estatus,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_fiscal_${data.periodo.fecha_inicio}_${data.periodo.fecha_fin}.csv`;
    link.click();
  };

  const tiposChartData = data?.resumen_por_tipo.map((t) => ({
    name: t.tipo,
    cantidad: t.cantidad,
    total: t.total,
  })) || [];

  return (
    <AdminLayout>
      <Box ref={reportRef}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/reportes')} sx={{ bgcolor: 'rgba(102, 126, 234, 0.1)' }}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Reporte Fiscal
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Análisis detallado de comprobantes fiscales
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<PictureAsPdfIcon />}
              onClick={exportToPDF}
              disabled={!data}
              sx={{ bgcolor: '#667eea' }}
            >
              Exportar PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<TableChartIcon />}
              onClick={exportToCSV}
              disabled={!data}
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
            <Button variant="contained" onClick={handleFilter} sx={{ bgcolor: '#667eea' }}>
              Generar Reporte
            </Button>
            <Button variant="outlined" onClick={() => { setFechaInicio(''); setFechaFin(''); fetchReport(); }} startIcon={<RefreshIcon />}>
              Limpiar
            </Button>
          </Box>
        </Paper>

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

        {!loading && !error && data && (
          <>
            {/* Período */}
            <Box sx={{ mb: 3 }}>
              <Chip
                label={`Período: ${data.periodo.fecha_inicio} a ${data.periodo.fecha_fin}`}
                color="primary"
                variant="outlined"
              />
            </Box>

            {/* Resumen General */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <AttachMoneyIcon sx={{ fontSize: 40, color: '#10b981' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Total Ingresos</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#10b981' }}>
                          {formatCurrency(data.resumen_general.total_ingresos)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ bgcolor: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <AccountBalanceIcon sx={{ fontSize: 40, color: '#f97316' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Total Egresos</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#f97316' }}>
                          {formatCurrency(data.resumen_general.total_egresos)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{
                  bgcolor: data.resumen_general.utilidad_bruta >= 0 ? 'rgba(102, 126, 234, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: data.resumen_general.utilidad_bruta >= 0 ? '1px solid rgba(102, 126, 234, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <ReceiptIcon sx={{ fontSize: 40, color: data.resumen_general.utilidad_bruta >= 0 ? '#667eea' : '#ef4444' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Utilidad Bruta</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: data.resumen_general.utilidad_bruta >= 0 ? '#667eea' : '#ef4444' }}>
                          {formatCurrency(data.resumen_general.utilidad_bruta)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Impuestos */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">IVA Trasladado</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#667eea' }}>
                      {formatCurrency(data.resumen_general.total_iva_trasladado)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">ISR Retenido</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#f97316' }}>
                      {formatCurrency(data.resumen_general.total_isr_retenido)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Gráficas */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: 350 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Distribución por Tipo
                  </Typography>
                  <ResponsiveContainer width="100%" height="85%">
                    <PieChart>
                      <Pie
                        data={tiposChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="cantidad"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {tiposChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: 350 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Montos por Tipo
                  </Typography>
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={tiposChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                      <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="total" fill="#667eea" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>

            {/* Tabla de Resumen por Tipo */}
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Resumen por Tipo de Comprobante
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(102, 126, 234, 0.1)' }}>
                      <TableCell>Tipo</TableCell>
                      <TableCell align="center">Cantidad</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                      <TableCell align="right">Descuento</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">IVA</TableCell>
                      <TableCell align="right">ISR</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.resumen_por_tipo.map((tipo, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Chip label={tipo.tipo} size="small" sx={{ bgcolor: COLORS[index % COLORS.length], color: 'white' }} />
                        </TableCell>
                        <TableCell align="center">{tipo.cantidad}</TableCell>
                        <TableCell align="right">{formatCurrency(tipo.subtotal)}</TableCell>
                        <TableCell align="right">{formatCurrency(tipo.descuento)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(tipo.total)}</TableCell>
                        <TableCell align="right">{formatCurrency(tipo.iva_trasladado)}</TableCell>
                        <TableCell align="right">{formatCurrency(tipo.isr_retenido)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Tabla de Facturas */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Detalle de Facturas ({data.facturas.length})
              </Typography>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Folio</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Emisor</TableCell>
                      <TableCell>Receptor</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Estatus</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.facturas.map((factura, index) => (
                      <TableRow key={index} hover>
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
                        <TableCell align="right">{formatCurrency(factura.subtotal)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(factura.total)}</TableCell>
                        <TableCell>
                          <Chip
                            label={factura.estatus}
                            size="small"
                            sx={{
                              bgcolor: factura.estatus === 'valido' ? 'rgba(16, 185, 129, 0.1)' :
                                       factura.estatus === 'pendiente' ? 'rgba(249, 115, 22, 0.1)' :
                                       'rgba(239, 68, 68, 0.1)',
                              color: factura.estatus === 'valido' ? '#10b981' :
                                     factura.estatus === 'pendiente' ? '#f97316' : '#ef4444',
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}
      </Box>
    </AdminLayout>
  );
};

export default ReporteFiscalPage;
