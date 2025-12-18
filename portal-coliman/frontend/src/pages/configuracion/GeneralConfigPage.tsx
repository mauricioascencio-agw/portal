import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  Save as SaveIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';

interface AppConfig {
  id: number;
  company_name: string;
  short_name: string | null;
  version: string | null;
  description: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  company_rfc: string | null;
  footer_text: string | null;
  created_at: string;
  updated_at: string | null;
}

const GeneralConfigPage: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [shortName, setShortName] = useState('AGENTSAT');
  const [version, setVersion] = useState('2.0');
  const [description, setDescription] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#667eea');
  const [secondaryColor, setSecondaryColor] = useState('#764ba2');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [companyRfc, setCompanyRfc] = useState('');
  const [footerText, setFooterText] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoadingConfig(true);
    try {
      const response = await api.get('/api/config/general');
      if (response.data) {
        const config: AppConfig = response.data;
        setCompanyName(config.company_name);
        setShortName(config.short_name || '');
        setVersion(config.version || '');
        setDescription(config.description || '');
        setPrimaryColor(config.primary_color || '#667eea');
        setSecondaryColor(config.secondary_color || '#764ba2');
        setContactEmail(config.contact_email || '');
        setContactPhone(config.contact_phone || '');
        setAddress(config.address || '');
        setCompanyRfc(config.company_rfc || '');
        setFooterText(config.footer_text || '');
      }
    } catch (error: any) {
      console.error('Error al cargar configuración:', error);
      setMessage({ type: 'error', text: 'Error al cargar la configuración' });
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (!companyName.trim()) {
      setMessage({ type: 'error', text: 'El nombre de la empresa es obligatorio' });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        company_name: companyName,
        short_name: shortName || null,
        version: version || null,
        description: description || null,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        address: address || null,
        company_rfc: companyRfc || null,
        footer_text: footerText || null,
      };

      await api.put('/api/config/general', payload);

      setMessage({ type: 'success', text: '✅ Configuración guardada exitosamente. Recarga la página para ver los cambios.' });

      // Opcional: Recargar la página automáticamente después de 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Error al guardar configuración:', error);
      const errorMessage = error.response?.data?.detail || 'Error al guardar la configuración';
      setMessage({ type: 'error', text: errorMessage });
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
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, fontWeight: 600 }}>
          <SettingsIcon fontSize="large" />
          Configuración General del Portal
        </Typography>

        <Grid container spacing={3}>
          {/* Formulario */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon />
                Información de la Empresa
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Personaliza el nombre y la información que se muestra en todo el portal.
              </Typography>

              <Divider sx={{ mb: 3 }} />

              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  {/* Nombre de la Empresa */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Nombre de la Empresa *"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      disabled={loading}
                      helperText="Nombre completo que se mostrará en el portal"
                    />
                  </Grid>

                  {/* Nombre Corto */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nombre Corto"
                      value={shortName}
                      onChange={(e) => setShortName(e.target.value)}
                      disabled={loading}
                      helperText="Nombre corto para branding"
                    />
                  </Grid>

                  {/* Versión */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Versión"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      disabled={loading}
                      helperText="Versión del portal"
                    />
                  </Grid>

                  {/* Descripción */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Descripción"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={loading}
                      helperText="Breve descripción del portal"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PaletteIcon /> Colores del Portal
                    </Typography>
                  </Grid>

                  {/* Color Primario */}
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        Color Primario
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          disabled={loading}
                          style={{ width: '60px', height: '40px', border: 'none', cursor: 'pointer' }}
                        />
                        <TextField
                          size="small"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          disabled={loading}
                          sx={{ flex: 1 }}
                        />
                      </Box>
                    </Box>
                  </Grid>

                  {/* Color Secundario */}
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        Color Secundario
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <input
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          disabled={loading}
                          style={{ width: '60px', height: '40px', border: 'none', cursor: 'pointer' }}
                        />
                        <TextField
                          size="small"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          disabled={loading}
                          sx={{ flex: 1 }}
                        />
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Información de Contacto
                    </Typography>
                  </Grid>

                  {/* RFC */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="RFC de la Empresa"
                      value={companyRfc}
                      onChange={(e) => setCompanyRfc(e.target.value.toUpperCase())}
                      disabled={loading}
                      inputProps={{ maxLength: 13 }}
                    />
                  </Grid>

                  {/* Email */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="email"
                      label="Email de Contacto"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      disabled={loading}
                    />
                  </Grid>

                  {/* Teléfono */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Teléfono"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      disabled={loading}
                    />
                  </Grid>

                  {/* Dirección */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Dirección"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={loading}
                    />
                  </Grid>

                  {/* Footer Text */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Texto del Footer"
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      disabled={loading}
                      helperText="Texto que aparece en el pie de página"
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
                      {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>

          {/* Información adicional */}
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#f8fafc', mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Vista Previa
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Nombre del Portal:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: primaryColor }}>
                    {companyName || 'Nombre del Portal'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Nombre Corto:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {shortName || 'AGENTSAT'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Versión:
                  </Typography>
                  <Typography variant="body1">
                    {version || '2.0'}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      bgcolor: primaryColor,
                      borderRadius: 1,
                    }}
                  />
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      bgcolor: secondaryColor,
                      borderRadius: 1,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>

            <Alert severity="info">
              <Typography variant="caption">
                Los cambios se aplicarán inmediatamente en todo el portal después de guardar.
                Se recomienda recargar la página para ver los cambios completos.
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </Box>
    </AdminLayout>
  );
};

export default GeneralConfigPage;
