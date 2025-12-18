import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Save as SaveIcon,
  Visibility,
  VisibilityOff,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import AdminLayout from '../../layouts/AdminLayout';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

interface FIELConfig {
  rfc: string;
  cer_filename: string;
  key_filename: string;
  configured_at: string;
  is_valid: boolean;
}

const FIELConfigPage: React.FC = () => {
  const [cerFile, setCerFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [rfc, setRfc] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [existingConfig, setExistingConfig] = useState<FIELConfig | null>(null);

  useEffect(() => {
    fetchExistingConfig();
  }, []);

  const fetchExistingConfig = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/api/config/fiel`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data) {
        setExistingConfig(response.data);
        setRfc(response.data.rfc || '');
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error fetching FIEL config:', error);
      }
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleCerFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.name.endsWith('.cer')) {
        setCerFile(file);
        setMessage(null);
      } else {
        setMessage({ type: 'error', text: 'Por favor selecciona un archivo .cer válido' });
      }
    }
  };

  const handleKeyFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.name.endsWith('.key')) {
        setKeyFile(file);
        setMessage(null);
      } else {
        setMessage({ type: 'error', text: 'Por favor selecciona un archivo .key válido' });
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    // Validaciones
    if (!cerFile && !existingConfig?.cer_filename) {
      setMessage({ type: 'error', text: 'Por favor selecciona el archivo de certificado (.cer)' });
      return;
    }
    if (!keyFile && !existingConfig?.key_filename) {
      setMessage({ type: 'error', text: 'Por favor selecciona el archivo de clave privada (.key)' });
      return;
    }
    if (!password) {
      setMessage({ type: 'error', text: 'Por favor ingresa la contraseña de la clave privada' });
      return;
    }
    if (!rfc || rfc.length < 12 || rfc.length > 13) {
      setMessage({ type: 'error', text: 'Por favor ingresa un RFC válido (12 o 13 caracteres)' });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      if (cerFile) formData.append('cer_file', cerFile);
      if (keyFile) formData.append('key_file', keyFile);
      formData.append('password', password);
      formData.append('rfc', rfc.toUpperCase());

      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${API_URL}/api/config/fiel`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage({ type: 'success', text: 'Configuración de e.firma guardada exitosamente' });
      setPassword(''); // Limpiar contraseña por seguridad
      setCerFile(null);
      setKeyFile(null);

      // Recargar configuración
      await fetchExistingConfig();
    } catch (error: any) {
      console.error('Error saving FIEL config:', error);
      const errorMessage = error.response?.data?.detail || 'Error al guardar la configuración de e.firma';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de eliminar la configuración de e.firma? Esta acción no se puede deshacer.')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_URL}/api/config/fiel`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage({ type: 'success', text: 'Configuración eliminada exitosamente' });
      setExistingConfig(null);
      setRfc('');
      setCerFile(null);
      setKeyFile(null);
      setPassword('');
    } catch (error: any) {
      console.error('Error deleting FIEL config:', error);
      setMessage({ type: 'error', text: 'Error al eliminar la configuración' });
    } finally {
      setLoading(false);
    }
  };

  if (loadingConfig) {
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
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          Configuración de e.firma (FIEL)
        </Typography>

        <Grid container spacing={3}>
          {/* Estado actual */}
          {existingConfig && (
            <Grid item xs={12}>
              <Card sx={{ bgcolor: existingConfig.is_valid ? '#f0fdf4' : '#fef2f2' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    {existingConfig.is_valid ? (
                      <CheckCircleIcon sx={{ color: '#10b981', fontSize: 40 }} />
                    ) : (
                      <ErrorIcon sx={{ color: '#ef4444', fontSize: 40 }} />
                    )}
                    <Box flex={1}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {existingConfig.is_valid ? 'e.firma Configurada' : 'Configuración Inválida'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        RFC: {existingConfig.rfc}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Certificado: {existingConfig.cer_filename}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Clave: {existingConfig.key_filename}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Configurada: {new Date(existingConfig.configured_at).toLocaleString('es-MX')}
                      </Typography>
                    </Box>
                    <IconButton
                      color="error"
                      onClick={handleDelete}
                      disabled={loading}
                      title="Eliminar configuración"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Formulario */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                {existingConfig ? 'Actualizar Credenciales' : 'Configurar Credenciales SAT'}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Para acceder a los servicios del SAT (Descarga Masiva, Validación, etc.), necesitas configurar tu e.firma (FIEL).
                Los archivos y contraseña se almacenan de forma segura y cifrada.
              </Typography>

              <Divider sx={{ mb: 3 }} />

              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  {/* Certificado .cer */}
                  <Grid item xs={12}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        Certificado (.cer) *
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<CloudUploadIcon />}
                          disabled={loading}
                        >
                          {cerFile ? cerFile.name : existingConfig?.cer_filename || 'Seleccionar archivo'}
                          <input
                            type="file"
                            accept=".cer"
                            hidden
                            onChange={handleCerFileChange}
                          />
                        </Button>
                        {cerFile && (
                          <Typography variant="caption" color="success.main">
                            ✓ Archivo seleccionado
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Archivo de certificado digital del SAT (.cer)
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Clave privada .key */}
                  <Grid item xs={12}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        Clave Privada (.key) *
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<CloudUploadIcon />}
                          disabled={loading}
                        >
                          {keyFile ? keyFile.name : existingConfig?.key_filename || 'Seleccionar archivo'}
                          <input
                            type="file"
                            accept=".key"
                            hidden
                            onChange={handleKeyFileChange}
                          />
                        </Button>
                        {keyFile && (
                          <Typography variant="caption" color="success.main">
                            ✓ Archivo seleccionado
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Archivo de clave privada del SAT (.key)
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Contraseña */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type={showPassword ? 'text' : 'password'}
                      label="Contraseña de Clave Privada"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      helperText="Contraseña con la que protegiste tu clave privada"
                    />
                  </Grid>

                  {/* RFC */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="RFC"
                      value={rfc}
                      onChange={(e) => setRfc(e.target.value.toUpperCase())}
                      required
                      disabled={loading}
                      inputProps={{ maxLength: 13 }}
                      helperText="RFC del contribuyente (12 o 13 caracteres)"
                    />
                  </Grid>

                  {/* Mensaje de estado */}
                  {message && (
                    <Grid item xs={12}>
                      <Alert severity={message.type} onClose={() => setMessage(null)}>
                        {message.text}
                      </Alert>
                    </Grid>
                  )}

                  {/* Botón de envío */}
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        px: 4,
                      }}
                    >
                      {loading ? 'Guardando...' : existingConfig ? 'Actualizar Configuración' : 'Guardar Configuración'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>

          {/* Información adicional */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, bgcolor: '#f8fafc' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                ¿Qué es la e.firma (FIEL)?
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                La Firma Electrónica Avanzada (FIEL) o e.firma es un conjunto de datos electrónicos que
                el SAT te proporciona para realizar trámites fiscales por Internet.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Archivos necesarios:
              </Typography>
              <Box component="ul" sx={{ pl: 2, mt: 0 }}>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  <strong>.cer:</strong> Certificado digital público
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  <strong>.key:</strong> Clave privada protegida con contraseña
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                ¿Para qué se usa?
              </Typography>
              <Box component="ul" sx={{ pl: 2, mt: 0 }}>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Descarga masiva de CFDIs del SAT
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Validación de comprobantes fiscales
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Firma digital de documentos
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  Tus credenciales se almacenan de forma cifrada y solo son accesibles para las
                  operaciones autorizadas del sistema.
                </Typography>
              </Alert>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </AdminLayout>
  );
};

export default FIELConfigPage;
