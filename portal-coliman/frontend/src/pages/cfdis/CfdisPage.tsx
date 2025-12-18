import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Alert,
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  VerifiedUser as VerifiedUserIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AdminLayout from '../../layouts/AdminLayout';
import CFDIUpload from '../../components/CFDIUpload';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

dayjs.locale('es');

interface CFDI {
  id: number;
  uuid: string;
  fecha: string;
  tipo_comprobante: string;
  emisor_rfc: string;
  emisor_nombre: string;
  receptor_rfc: string;
  receptor_nombre: string;
  subtotal: number;
  total: number;
  moneda: string;
  estatus_validacion: string;
  created_at: string;
}

const CfdisPage: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [cfdis, setCfdis] = useState<CFDI[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    emisor_rfc: '',
    receptor_rfc: '',
    tipo_comprobante: '',
    estatus_validacion: '',
  });

  const [fechaInicio, setFechaInicio] = useState<Dayjs | null>(null);
  const [fechaFin, setFechaFin] = useState<Dayjs | null>(null);
  const [validatingCfdis, setValidatingCfdis] = useState<Set<number>>(new Set());

  const fetchCfdis = async () => {
    setLoading(true);
    try {
      console.log('Fetching CFDIs with params:', { skip: page * rowsPerPage, limit: rowsPerPage });
      const response = await api.get('/api/cfdis/list', {
        params: {
          skip: page * rowsPerPage,
          limit: rowsPerPage,
        },
      });
      console.log('CFDIs response:', response.data);
      setCfdis(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error: any) {
      console.error('Error fetching CFDIs:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = typeof error.response?.data?.detail === 'string'
        ? error.response.data.detail
        : typeof error.response?.data?.detail === 'object'
        ? JSON.stringify(error.response.data.detail)
        : error.message || 'Error desconocido';
      alert(`Error al cargar CFDIs: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tabValue === 1) {
      fetchCfdis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabValue, page, rowsPerPage]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleUploadComplete = () => {
    // Always fetch latest CFDIs
    fetchCfdis();
    // Switch to list tab to show results
    if (tabValue !== 1) {
      setTabValue(1);
    }
  };

  const handleViewDetail = (cfdi: CFDI) => {
    navigate(`/cfdis-detalle/${cfdi.id}`, { state: { cfdi } });
  };

  const handleValidateCFDI = async (cfdi: CFDI) => {
    // Agregar a conjunto de validaciones en progreso
    setValidatingCfdis((prev) => new Set(prev).add(cfdi.id));

    try {
      const response = await api.post('/api/cfdis/validate', {
        uuid: cfdi.uuid,
        rfc_emisor: cfdi.emisor_rfc,
        rfc_receptor: cfdi.receptor_rfc,
        total: cfdi.total,
      });

      // Actualizar el CFDI en la lista local con el nuevo estatus
      setCfdis((prevCfdis) =>
        prevCfdis.map((c) =>
          c.id === cfdi.id
            ? { ...c, estatus_validacion: response.data.estado }
            : c
        )
      );

      // Mostrar resultado
      const mensaje = response.data.estado === 'Vigente'
        ? '✅ CFDI Vigente en el SAT'
        : response.data.estado === 'Cancelado'
        ? '❌ CFDI Cancelado en el SAT'
        : `Estado: ${response.data.estado}`;

      alert(`${mensaje}\n\n${response.data.es_cancelable ? 'Es cancelable' : 'No es cancelable'}\nEstatus: ${response.data.estatus_cancelacion || 'N/A'}`);
    } catch (error: any) {
      console.error('Error validating CFDI:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Error desconocido';
      alert(`Error al validar CFDI: ${errorMessage}`);
    } finally {
      // Remover de conjunto de validaciones en progreso
      setValidatingCfdis((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cfdi.id);
        return newSet;
      });
    }
  };

  const getFilteredCfdis = () => {
    return cfdis.filter((cfdi) => {
      if (filters.emisor_rfc && !cfdi.emisor_rfc.toLowerCase().includes(filters.emisor_rfc.toLowerCase())) {
        return false;
      }
      if (filters.receptor_rfc && !cfdi.receptor_rfc.toLowerCase().includes(filters.receptor_rfc.toLowerCase())) {
        return false;
      }
      if (filters.tipo_comprobante && cfdi.tipo_comprobante !== filters.tipo_comprobante) {
        return false;
      }
      if (filters.estatus_validacion && cfdi.estatus_validacion !== filters.estatus_validacion) {
        return false;
      }
      if (fechaInicio && dayjs(cfdi.fecha).isBefore(fechaInicio, 'day')) {
        return false;
      }
      if (fechaFin && dayjs(cfdi.fecha).isAfter(fechaFin, 'day')) {
        return false;
      }
      return true;
    });
  };

  const filteredCfdis = getFilteredCfdis();

  const exportToExcel = () => {
    const data = filteredCfdis.map((cfdi) => ({
      UUID: cfdi.uuid,
      Fecha: new Date(cfdi.fecha).toLocaleDateString('es-MX'),
      Tipo: getTipoComprobanteLabel(cfdi.tipo_comprobante),
      'RFC Emisor': cfdi.emisor_rfc,
      'Nombre Emisor': cfdi.emisor_nombre || '',
      'RFC Receptor': cfdi.receptor_rfc,
      'Nombre Receptor': cfdi.receptor_nombre || '',
      Subtotal: cfdi.subtotal,
      Total: cfdi.total,
      Moneda: cfdi.moneda,
      Estatus: cfdi.estatus_validacion,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CFDIs');

    const wscols = [
      { wch: 38 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 30 },
      { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 12 },
    ];
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, `CFDIs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(16);
    doc.text('Reporte de CFDIs', 14, 15);
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleString('es-MX')}`, 14, 22);
    doc.text(`Total: ${filteredCfdis.length}`, 14, 27);

    const tableData = filteredCfdis.map((cfdi) => [
      cfdi.uuid.substring(0, 8) + '...',
      new Date(cfdi.fecha).toLocaleDateString('es-MX'),
      getTipoComprobanteLabel(cfdi.tipo_comprobante),
      cfdi.emisor_rfc,
      cfdi.emisor_nombre || '',
      cfdi.receptor_rfc,
      cfdi.receptor_nombre || '',
      `$${cfdi.subtotal.toFixed(2)}`,
      `$${cfdi.total.toFixed(2)}`,
      cfdi.estatus_validacion,
    ]);

    autoTable(doc, {
      head: [['UUID', 'Fecha', 'Tipo', 'RFC Emisor', 'Emisor', 'RFC Receptor', 'Receptor', 'Subtotal', 'Total', 'Estatus']],
      body: tableData,
      startY: 32,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [102, 126, 234], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(`CFDIs_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(filteredCfdis, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `CFDIs_${new Date().toISOString().split('T')[0]}.json`);
    link.click();
  };

  const exportToCSV = () => {
    if (filteredCfdis.length === 0) return;
    const headers = ['UUID', 'Fecha', 'Tipo', 'RFC Emisor', 'Nombre Emisor', 'RFC Receptor', 'Nombre Receptor', 'Subtotal', 'Total', 'Moneda', 'Estatus'];
    const rows = filteredCfdis.map((cfdi) => [
      cfdi.uuid,
      new Date(cfdi.fecha).toLocaleDateString('es-MX'),
      getTipoComprobanteLabel(cfdi.tipo_comprobante),
      cfdi.emisor_rfc,
      cfdi.emisor_nombre || '',
      cfdi.receptor_rfc,
      cfdi.receptor_nombre || '',
      cfdi.subtotal,
      cfdi.total,
      cfdi.moneda,
      cfdi.estatus_validacion,
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const dataUri = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `CFDIs_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valido': return 'success';
      case 'rechazado': return 'error';
      case 'revisión': return 'warning';
      default: return 'default';
    }
  };

  const getTipoComprobanteLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      I: 'Ingreso', E: 'Egreso', T: 'Traslado', N: 'Nómina', P: 'Pago',
    };
    return tipos[tipo] || tipo;
  };

  const clearFilters = () => {
    setFilters({ emisor_rfc: '', receptor_rfc: '', tipo_comprobante: '', estatus_validacion: '' });
    setFechaInicio(null);
    setFechaFin(null);
  };

  return (
    <AdminLayout>
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 1 }}>
            CFDIs
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestión de Comprobantes Fiscales Digitales por Internet
          </Typography>
        </Box>
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Subir XMLs" />
            <Tab label="Listado de CFDIs" />
            <Tab label="Panel MCP/IA" />
          </Tabs>
        </Paper>

        {tabValue === 0 && <Box><CFDIUpload onUploadComplete={handleUploadComplete} /></Box>}

        {tabValue === 1 && (
          <Box>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FilterListIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Filtros</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={2.5}>
                  <TextField fullWidth size="small" label="RFC Emisor (Proveedor)" value={filters.emisor_rfc} onChange={(e) => setFilters({ ...filters, emisor_rfc: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6} md={2.5}>
                  <TextField fullWidth size="small" label="RFC Receptor (Cliente)" value={filters.receptor_rfc} onChange={(e) => setFilters({ ...filters, receptor_rfc: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6} md={1.5}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo</InputLabel>
                    <Select value={filters.tipo_comprobante} label="Tipo" onChange={(e) => setFilters({ ...filters, tipo_comprobante: e.target.value })}>
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="I">Ingreso</MenuItem>
                      <MenuItem value="E">Egreso</MenuItem>
                      <MenuItem value="T">Traslado</MenuItem>
                      <MenuItem value="N">Nómina</MenuItem>
                      <MenuItem value="P">Pago</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={1.5}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Estatus</InputLabel>
                    <Select value={filters.estatus_validacion} label="Estatus" onChange={(e) => setFilters({ ...filters, estatus_validacion: e.target.value })}>
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="pendiente">Pendiente</MenuItem>
                      <MenuItem value="valido">Válido</MenuItem>
                      <MenuItem value="rechazado">Rechazado</MenuItem>
                      <MenuItem value="revisión">Revisión</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                    <DatePicker label="Fecha Inicio" value={fechaInicio} onChange={(newValue) => setFechaInicio(newValue)} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                    <DatePicker label="Fecha Fin" value={fechaFin} onChange={(newValue) => setFechaFin(newValue)} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
                  </LocalizationProvider>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={fetchCfdis}>Actualizar</Button>
                <Button size="small" variant="outlined" onClick={clearFilters}>Limpiar Filtros</Button>
              </Box>
            </Paper>

            {filteredCfdis.length !== cfdis.length && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Mostrando {filteredCfdis.length} de {cfdis.length} registros después de aplicar filtros
              </Alert>
            )}

            <Box sx={{ mb: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button size="small" variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportToExcel} color="success">Excel</Button>
              <Button size="small" variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportToPDF} color="error">PDF</Button>
              <Button size="small" variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportToJSON}>JSON</Button>
              <Button size="small" variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportToCSV}>CSV</Button>
            </Box>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell>UUID</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Emisor (Proveedor)</TableCell>
                    <TableCell>Receptor (Cliente)</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Estatus</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={9} align="center">Cargando...</TableCell></TableRow>
                  ) : filteredCfdis.length === 0 ? (
                    <TableRow><TableCell colSpan={9} align="center">No hay CFDIs que coincidan con los filtros</TableCell></TableRow>
                  ) : (
                    filteredCfdis.map((cfdi) => (
                      <TableRow key={cfdi.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                            {cfdi.uuid.substring(0, 8)}...
                          </Typography>
                        </TableCell>
                        <TableCell>{new Date(cfdi.fecha).toLocaleDateString('es-MX')}</TableCell>
                        <TableCell>{getTipoComprobanteLabel(cfdi.tipo_comprobante)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{cfdi.emisor_nombre || cfdi.emisor_rfc}</Typography>
                          <Typography variant="caption" color="text.secondary">{cfdi.emisor_rfc}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{cfdi.receptor_nombre || cfdi.receptor_rfc}</Typography>
                          <Typography variant="caption" color="text.secondary">{cfdi.receptor_rfc}</Typography>
                        </TableCell>
                        <TableCell align="right">${cfdi.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell align="right"><strong>${cfdi.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></TableCell>
                        <TableCell><Chip label={cfdi.estatus_validacion} color={getStatusColor(cfdi.estatus_validacion)} size="small" /></TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewDetail(cfdi)}
                            title="Ver detalle"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleValidateCFDI(cfdi)}
                            disabled={validatingCfdis.has(cfdi.id)}
                            title="Validar en SAT"
                          >
                            <VerifiedUserIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination component="div" count={total} page={page} onPageChange={handleChangePage} rowsPerPage={rowsPerPage} onRowsPerPageChange={handleChangeRowsPerPage} rowsPerPageOptions={[10, 25, 50, 100]} labelRowsPerPage="Filas por página:" labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`} />
            </TableContainer>
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2, minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Panel MCP/IA - Sugerencias de KPIs</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600 }}>
                En este panel, la inteligencia artificial analizará tus datos de CFDIs y sugerirá indicadores clave de rendimiento (KPIs) relevantes para tu negocio.
              </Typography>
              <Alert severity="info" sx={{ maxWidth: 600 }}>
                <Typography variant="body2"><strong>Próximamente:</strong> Integración con Claude MCP para análisis automático de datos y sugerencias inteligentes de métricas.</Typography>
              </Alert>
            </Paper>
          </Box>
        )}
      </Box>
    </AdminLayout>
  );
};

export default CfdisPage;
