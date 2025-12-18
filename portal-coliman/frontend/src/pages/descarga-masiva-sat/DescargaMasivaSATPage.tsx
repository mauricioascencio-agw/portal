import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  CallMade as CallMadeIcon,
  CallReceived as CallReceivedIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';

interface Solicitud {
  solicitud_id: string;
  tipo: 'emitidos' | 'recibidos';
  fecha_inicio: string;
  fecha_fin: string;
  estado_codigo?: number;
  estado_texto?: string;
  numero_cfdis?: number;
  paquetes?: string[];
}

const DescargaMasivaSATPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [fechaInicio, setFechaInicio] = useState<Dayjs | null>(dayjs().subtract(1, 'month'));
  const [fechaFin, setFechaFin] = useState<Dayjs | null>(dayjs());
  const [rfcEmisor, setRfcEmisor] = useState('');
  const [rfcReceptor, setRfcReceptor] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);

  const handleSolicitarEmitidos = async () => {
    if (!fechaInicio || !fechaFin) {
      setMessage({ type: 'error', text: 'Por favor selecciona las fechas' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await api.post('/api/sat-descarga-masiva/solicitar-emitidos', {
        fecha_inicio: fechaInicio.format('YYYY-MM-DD'),
        fecha_fin: fechaFin.format('YYYY-MM-DD'),
        rfc_receptor: rfcReceptor || null,
        tipo_solicitud: 'CFDI',
      });

      const nuevaSolicitud: Solicitud = {
        solicitud_id: response.data.solicitud_id,
        tipo: 'emitidos',
        fecha_inicio: fechaInicio.format('YYYY-MM-DD'),
        fecha_fin: fechaFin.format('YYYY-MM-DD'),
        estado_codigo: 1,
        estado_texto: 'Aceptada',
      };

      setSolicitudes([nuevaSolicitud, ...solicitudes]);
      setMessage({
        type: 'success',
        text: `Solicitud de CFDIs emitidos creada: ${response.data.solicitud_id}`,
      });
      setTabValue(1);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Error al solicitar descarga de emitidos',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSolicitarRecibidos = async () => {
    if (!fechaInicio || !fechaFin) {
      setMessage({ type: 'error', text: 'Por favor selecciona las fechas' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await api.post('/api/sat-descarga-masiva/solicitar-recibidos', {
        fecha_inicio: fechaInicio.format('YYYY-MM-DD'),
        fecha_fin: fechaFin.format('YYYY-MM-DD'),
        rfc_emisor: rfcEmisor || null,
        tipo_solicitud: 'CFDI',
      });

      const nuevaSolicitud: Solicitud = {
        solicitud_id: response.data.solicitud_id,
        tipo: 'recibidos',
        fecha_inicio: fechaInicio.format('YYYY-MM-DD'),
        fecha_fin: fechaFin.format('YYYY-MM-DD'),
        estado_codigo: 1,
        estado_texto: 'Aceptada',
      };

      setSolicitudes([nuevaSolicitud, ...solicitudes]);
      setMessage({
        type: 'success',
        text: `Solicitud de CFDIs recibidos creada: ${response.data.solicitud_id}`,
      });
      setTabValue(1);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Error al solicitar descarga de recibidos',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerificarSolicitud = async (solicitudId: string) => {
    setLoading(true);

    try {
      const response = await api.post('/api/sat-descarga-masiva/verificar', {
        solicitud_id: solicitudId,
      });

      setSolicitudes(
        solicitudes.map((s) =>
          s.solicitud_id === solicitudId
            ? {
                ...s,
                estado_codigo: response.data.estado_codigo,
                estado_texto: response.data.estado_texto,
                numero_cfdis: response.data.numero_cfdis,
                paquetes: response.data.paquetes,
              }
            : s
        )
      );

      setMessage({
        type: 'info',
        text: `Estado: ${response.data.estado_texto}. ${
          response.data.numero_cfdis ? `${response.data.numero_cfdis} CFDIs encontrados` : ''
        }`,
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Error al verificar solicitud',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarPaquete = async (paqueteId: string) => {
    setLoading(true);

    try {
      const response = await api.post('/api/sat-descarga-masiva/descargar-paquete', {
        paquete_id: paqueteId,
      });

      setMessage({
        type: 'success',
        text: `Paquete descargado: ${response.data.archivos_extraidos} archivos`,
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Error al descargar paquete',
      });
    } finally {
      setLoading(false);
    }
  };

  const getEstadoChip = (estadoCodigo?: number) => {
    const estados = {
      1: { label: 'Aceptada', color: 'info' as const },
      2: { label: 'En Proceso', color: 'warning' as const },
      3: { label: 'Terminada', color: 'success' as const },
      4: { label: 'Error', color: 'error' as const },
      5: { label: 'Rechazada', color: 'error' as const },
      6: { label: 'Vencida', color: 'default' as const },
    };

    const estado = estados[estadoCodigo as keyof typeof estados] || { label: 'Desconocido', color: 'default' as const };
    return <Chip label={estado.label} color={estado.color} size="small" />;
  };

  return (
    <AdminLayout>
      <Box>
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
            Descarga Masiva SAT
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Descarga masiva de CFDIs desde el servicio oficial del SAT (emitidos y recibidos)
          </Typography>
        </Box>

        {message && (
          <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}

        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Nueva Solicitud" icon={<SendIcon />} iconPosition="start" />
            <Tab label="Seguimiento" icon={<RefreshIcon />} iconPosition="start" />
            <Tab label="Información" icon={<InfoIcon />} iconPosition="start" />
          </Tabs>
        </Paper>

        {tabValue === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Solicitar Descarga de CFDIs
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                      <DatePicker
                        label="Fecha Inicio"
                        value={fechaInicio}
                        onChange={(newValue) => setFechaInicio(newValue)}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                      <DatePicker
                        label="Fecha Fin"
                        value={fechaFin}
                        onChange={(newValue) => setFechaFin(newValue)}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="RFC Emisor (opcional para recibidos)"
                      value={rfcEmisor}
                      onChange={(e) => setRfcEmisor(e.target.value.toUpperCase())}
                      placeholder="AAA010101AAA"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="RFC Receptor (opcional para emitidos)"
                      value={rfcReceptor}
                      onChange={(e) => setRfcReceptor(e.target.value.toUpperCase())}
                      placeholder="BBB020202BBB"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} /> : <CallMadeIcon />}
                        onClick={handleSolicitarEmitidos}
                        disabled={loading}
                        sx={{ flex: 1, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                      >
                        Solicitar Emitidos (Ventas)
                      </Button>

                      <Button
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} /> : <CallReceivedIcon />}
                        onClick={handleSolicitarRecibidos}
                        disabled={loading}
                        sx={{ flex: 1, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
                      >
                        Solicitar Recibidos (Compras)
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: '#f8fafc' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    ¿Qué descargar?
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CallMadeIcon sx={{ mr: 1, color: '#667eea' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        CFDIs Emitidos
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Facturas que TÚ emitiste (ventas)
                    </Typography>
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CallReceivedIcon sx={{ mr: 1, color: '#f5576c' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        CFDIs Recibidos
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Facturas que recibiste (compras)
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {tabValue === 1 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Solicitudes
            </Typography>

            {solicitudes.length === 0 ? (
              <Alert severity="info">
                No hay solicitudes. Crea una en la pestaña "Nueva Solicitud".
              </Alert>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Período</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>CFDIs</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {solicitudes.map((solicitud) => (
                    <TableRow key={solicitud.solicitud_id}>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {solicitud.solicitud_id.substring(0, 20)}...
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={solicitud.tipo}
                          size="small"
                          color={solicitud.tipo === 'emitidos' ? 'primary' : 'secondary'}
                        />
                      </TableCell>
                      <TableCell>
                        {solicitud.fecha_inicio} - {solicitud.fecha_fin}
                      </TableCell>
                      <TableCell>{getEstadoChip(solicitud.estado_codigo)}</TableCell>
                      <TableCell>{solicitud.numero_cfdis || '-'}</TableCell>
                      <TableCell>
                        <Tooltip title="Verificar">
                          <IconButton
                            size="small"
                            onClick={() => handleVerificarSolicitud(solicitud.solicitud_id)}
                          >
                            <RefreshIcon />
                          </IconButton>
                        </Tooltip>
                        {solicitud.estado_codigo === 3 && solicitud.paquetes && solicitud.paquetes.length > 0 && (
                          <Tooltip title="Descargar">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleDescargarPaquete(solicitud.paquetes![0])}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        )}

        {tabValue === 2 && (
          <Paper sx={{ p: 3 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              ✅ Servicio funcional con satcfdi. Configura tu e.firma en Configuración {'>'} e.firma (FIEL) SAT
            </Alert>
          </Paper>
        )}
      </Box>
    </AdminLayout>
  );
};

export default DescargaMasivaSATPage;
