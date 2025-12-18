import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Box,
  Divider,
  Chip,
} from '@mui/material';
import {
  Upload as UploadIcon,
  CheckCircle as CheckIcon,
  Description as DescriptionIcon,
  Business as BusinessIcon,
  Home as HomeIcon,
  Assignment as AssignmentIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';

interface ConstanciaData {
  id: number;
  rfc: string;
  razon_social: string;
  nombre_comercial?: string;
  regimen_capital?: string;
  fecha_inicio_operaciones?: string;
  estatus_padron?: string;
  domicilio: {
    codigo_postal?: string;
    tipo_vialidad?: string;
    nombre_vialidad?: string;
    numero_exterior?: string;
    numero_interior?: string;
    colonia?: string;
    localidad?: string;
    municipio?: string;
    entidad?: string;
  };
  actividades: Array<{
    orden: number;
    actividad: string;
    porcentaje: number;
  }>;
  regimenes: Array<{
    regimen: string;
    fecha_inicio?: string;
    fecha_fin?: string;
  }>;
  obligaciones: Array<{
    descripcion: string;
  }>;
  fecha_emision?: string;
  created_at?: string;
}

const ConstanciaFiscalPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [data, setData] = useState<ConstanciaData | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConstancia();
  }, []);

  const loadConstancia = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/constancia-fiscal/');
      if (response.data.data) {
        setData(response.data.data);
      }
    } catch (err: any) {
      console.error('Error al cargar constancia:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      if (!selectedFile.name.endsWith('.pdf')) {
        setError('Solo se permiten archivos PDF');
        return;
      }

      setFile(selectedFile);
      setError(null);
      setUploadSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/constancia-fiscal/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadSuccess(true);
      setFile(null);

      // Recargar datos
      await loadConstancia();

      alert(response.data.message || '✅ Constancia Fiscal importada correctamente');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Error al procesar la constancia fiscal';
      setError(errorMsg);
      alert('Error: ' + errorMsg);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DescriptionIcon fontSize="large" />
        Constancia de Situación Fiscal
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Sube tu Constancia de Situación Fiscal del SAT (PDF) para extraer y almacenar tus datos fiscales
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* Sección de carga */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📄 Adjuntar Constancia Fiscal
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            sx={{ alignSelf: 'flex-start' }}
          >
            Seleccionar archivo PDF
            <input
              type="file"
              hidden
              accept=".pdf"
              onChange={handleFileSelect}
            />
          </Button>

          {file && (
            <Alert severity="info">
              Archivo seleccionado: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
            </Alert>
          )}

          {error && <Alert severity="error">{error}</Alert>}

          {uploadSuccess && (
            <Alert severity="success" icon={<CheckIcon />}>
              ✅ Constancia Fiscal importada correctamente
            </Alert>
          )}

          {file && (
            <Button
              variant="contained"
              color="primary"
              startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
              onClick={handleUpload}
              disabled={uploading}
              sx={{ alignSelf: 'flex-start' }}
            >
              {uploading ? 'Procesando...' : 'Confirmar Importación'}
            </Button>
          )}
        </Box>
      </Paper>

      {/* Mostrar datos si existen */}
      {data && (
        <>
          {/* Datos del Contribuyente */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon /> Datos del Contribuyente
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">RFC</Typography>
                      <Typography variant="body1"><strong>{data.rfc}</strong></Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">Razón Social</Typography>
                      <Typography variant="body1">{data.razon_social}</Typography>
                    </Box>

                    {data.nombre_comercial && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Nombre Comercial</Typography>
                        <Typography variant="body1">{data.nombre_comercial}</Typography>
                      </Box>
                    )}

                    {data.regimen_capital && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Régimen Capital</Typography>
                        <Typography variant="body1">{data.regimen_capital}</Typography>
                      </Box>
                    )}

                    {data.estatus_padron && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Estatus en el Padrón</Typography>
                        <Chip
                          label={data.estatus_padron}
                          color={data.estatus_padron === 'ACTIVO' ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                    )}

                    {data.fecha_inicio_operaciones && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Fecha Inicio de Operaciones</Typography>
                        <Typography variant="body1">{new Date(data.fecha_inicio_operaciones).toLocaleDateString()}</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Domicilio Fiscal */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HomeIcon /> Domicilio Fiscal
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Calle</Typography>
                      <Typography variant="body1">
                        {data.domicilio.tipo_vialidad} {data.domicilio.nombre_vialidad} #{data.domicilio.numero_exterior}
                        {data.domicilio.numero_interior && ` Int. ${data.domicilio.numero_interior}`}
                      </Typography>
                    </Box>

                    {data.domicilio.colonia && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Colonia</Typography>
                        <Typography variant="body1">{data.domicilio.colonia}</Typography>
                      </Box>
                    )}

                    <Box>
                      <Typography variant="caption" color="text.secondary">Municipio / Ciudad</Typography>
                      <Typography variant="body1">{data.domicilio.municipio || data.domicilio.localidad}</Typography>
                    </Box>

                    {data.domicilio.entidad && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Estado</Typography>
                        <Typography variant="body1">{data.domicilio.entidad}</Typography>
                      </Box>
                    )}

                    {data.domicilio.codigo_postal && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Código Postal</Typography>
                        <Typography variant="body1">{data.domicilio.codigo_postal}</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Actividades Económicas */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentIcon /> Actividades Económicas
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  {data.actividades && data.actividades.length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Orden</strong></TableCell>
                            <TableCell><strong>Actividad</strong></TableCell>
                            <TableCell align="right"><strong>Porcentaje</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.actividades.map((act, index) => (
                            <TableRow key={index}>
                              <TableCell>{act.orden}</TableCell>
                              <TableCell>{act.actividad}</TableCell>
                              <TableCell align="right">{act.porcentaje}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No se encontraron actividades económicas
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Regímenes Fiscales */}
            {data.regimenes && data.regimenes.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Régimen Fiscal
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {data.regimenes.map((reg, index) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Typography variant="body2">{reg.regimen}</Typography>
                        {reg.fecha_inicio && (
                          <Typography variant="caption" color="text.secondary">
                            Desde: {reg.fecha_inicio}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Obligaciones Fiscales */}
            {data.obligaciones && data.obligaciones.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Obligaciones Fiscales
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                      {data.obligaciones.map((oblig, index) => (
                        <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                          • {oblig.descripcion}
                        </Typography>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>

          {/* Información de importación */}
          {data.created_at && (
            <Box sx={{ mt: 3 }}>
              <Alert severity="info">
                Constancia importada el {new Date(data.created_at).toLocaleString()}
              </Alert>
            </Box>
          )}
        </>
      )}

      {/* Mensaje si no hay datos */}
      {!data && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <DescriptionIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay constancia fiscal registrada
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sube tu constancia fiscal para comenzar
          </Typography>
        </Paper>
      )}
      </Box>
    </AdminLayout>
  );
};

export default ConstanciaFiscalPage;
