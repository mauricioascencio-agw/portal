import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  Visibility,
  VisibilityOff,
  Psychology as PsychologyIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';

interface AIConfig {
  id: number;
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  system_prompt: string | null;
  is_active: boolean;
  is_valid: boolean;
  api_key_preview: string;
  last_used_at: string | null;
  usage_count: number;
  created_at: string;
}

const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic (Claude)', models: [
    'claude-3-5-sonnet-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
  ]},
  { id: 'openai', name: 'OpenAI (GPT)', models: [
    'gpt-4-turbo-preview',
    'gpt-4',
    'gpt-3.5-turbo',
  ]},
];

const AIConfigPage: React.FC = () => {
  const [provider, setProvider] = useState('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('claude-3-5-sonnet-20241022');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [topP, setTopP] = useState(1.0);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [existingConfig, setExistingConfig] = useState<AIConfig | null>(null);

  useEffect(() => {
    fetchExistingConfig();
  }, [provider]);

  const fetchExistingConfig = async () => {
    setLoadingConfig(true);
    try {
      const response = await api.get(`/api/ai-config/?provider=${provider}`);
      if (response.data) {
        const config = response.data;
        setExistingConfig(config);
        setModel(config.model);
        setTemperature(config.temperature);
        setMaxTokens(config.max_tokens);
        setTopP(config.top_p);
        setSystemPrompt(config.system_prompt || '');
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error al cargar configuración de IA:', error);
      }
      setExistingConfig(null);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (!apiKey && !existingConfig) {
      setMessage({ type: 'error', text: 'Por favor ingresa tu API Key' });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        provider,
        api_key: apiKey,
        model,
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        system_prompt: systemPrompt || null,
      };

      const response = await api.post('/api/ai-config/', payload);

      setMessage({ type: 'success', text: '✅ Configuración de IA guardada exitosamente' });
      setApiKey(''); // Limpiar API key por seguridad
      await fetchExistingConfig();
    } catch (error: any) {
      console.error('Error al guardar configuración de IA:', error);
      const errorMessage = error.response?.data?.detail || 'Error al guardar la configuración de IA';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de eliminar la configuración de IA? Esta acción no se puede deshacer.')) {
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/api/ai-config/?provider=${provider}`);
      setMessage({ type: 'success', text: 'Configuración eliminada exitosamente' });
      setExistingConfig(null);
      setApiKey('');
    } catch (error: any) {
      console.error('Error al eliminar configuración:', error);
      setMessage({ type: 'error', text: 'Error al eliminar la configuración' });
    } finally {
      setLoading(false);
    }
  };

  const selectedProvider = PROVIDERS.find(p => p.id === provider);

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
          <PsychologyIcon fontSize="large" />
          Configuración de IA
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
                        {existingConfig.is_valid ? 'IA Configurada y Activa' : 'Configuración Inválida'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Proveedor: {existingConfig.provider.toUpperCase()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Modelo: {existingConfig.model}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        API Key: {existingConfig.api_key_preview}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Usos: {existingConfig.usage_count}
                      </Typography>
                      {existingConfig.last_used_at && (
                        <Typography variant="caption" color="text.secondary">
                          Último uso: {new Date(existingConfig.last_used_at).toLocaleString('es-MX')}
                        </Typography>
                      )}
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
              <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon />
                {existingConfig ? 'Actualizar Configuración' : 'Configurar IA'}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configura tu API key de Claude (Anthropic) u OpenAI para habilitar el asistente inteligente "Cool Iman".
                Tus credenciales se almacenan de forma cifrada.
              </Typography>

              <Divider sx={{ mb: 3 }} />

              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  {/* Proveedor */}
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Proveedor de IA</InputLabel>
                      <Select
                        value={provider}
                        label="Proveedor de IA"
                        onChange={(e) => {
                          setProvider(e.target.value);
                          const newProvider = PROVIDERS.find(p => p.id === e.target.value);
                          if (newProvider) setModel(newProvider.models[0]);
                        }}
                        disabled={loading}
                      >
                        {PROVIDERS.map((prov) => (
                          <MenuItem key={prov.id} value={prov.id}>
                            {prov.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* API Key */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type={showApiKey ? 'text' : 'password'}
                      label="API Key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      required={!existingConfig}
                      disabled={loading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowApiKey(!showApiKey)}
                              edge="end"
                            >
                              {showApiKey ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      helperText={
                        existingConfig
                          ? `API Key actual: ${existingConfig.api_key_preview} (deja vacío para mantener la actual)`
                          : 'Obtén tu API key desde el portal del proveedor'
                      }
                    />
                  </Grid>

                  {/* Modelo */}
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Modelo</InputLabel>
                      <Select
                        value={model}
                        label="Modelo"
                        onChange={(e) => setModel(e.target.value)}
                        disabled={loading}
                      >
                        {selectedProvider?.models.map((modelName) => (
                          <MenuItem key={modelName} value={modelName}>
                            {modelName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Temperature */}
                  <Grid item xs={12}>
                    <Typography gutterBottom>
                      Temperature: {temperature}
                    </Typography>
                    <Slider
                      value={temperature}
                      onChange={(_, value) => setTemperature(value as number)}
                      min={0}
                      max={2}
                      step={0.1}
                      marks={[
                        { value: 0, label: '0 (Preciso)' },
                        { value: 1, label: '1' },
                        { value: 2, label: '2 (Creativo)' },
                      ]}
                      disabled={loading}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Controla la aleatoriedad de las respuestas
                    </Typography>
                  </Grid>

                  {/* Max Tokens */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Max Tokens"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                      inputProps={{ min: 100, max: 100000 }}
                      disabled={loading}
                      helperText="Longitud máxima de respuesta"
                    />
                  </Grid>

                  {/* Top P */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Top P"
                      value={topP}
                      onChange={(e) => setTopP(parseFloat(e.target.value))}
                      inputProps={{ min: 0, max: 1, step: 0.1 }}
                      disabled={loading}
                      helperText="Diversidad de respuestas"
                    />
                  </Grid>

                  {/* System Prompt */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="System Prompt (Opcional)"
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      disabled={loading}
                      placeholder="Eres Cool Iman, un asistente experto en análisis fiscal y contable..."
                      helperText="Define el comportamiento y personalidad del asistente"
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
                ¿Qué es Cool Iman?
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Cool Iman es tu asistente inteligente con IA que te ayuda con consultas,
                análisis de datos y tareas relacionadas con tu portal AgentSat.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Proveedores soportados:
              </Typography>
              <Box component="ul" sx={{ pl: 2, mt: 0 }}>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  <strong>Anthropic:</strong> Claude 3.5 Sonnet, Opus, Haiku
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  <strong>OpenAI:</strong> GPT-4, GPT-3.5 Turbo
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                ¿Cómo obtener mi API Key?
              </Typography>
              <Box component="ul" sx={{ pl: 2, mt: 0 }}>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  <strong>Anthropic:</strong> <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">console.anthropic.com</a>
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  <strong>OpenAI:</strong> <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">platform.openai.com/api-keys</a>
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  Tu API key se almacena de forma cifrada y solo se usa para las consultas autorizadas
                  del sistema. Nunca compartimos tus credenciales.
                </Typography>
              </Alert>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </AdminLayout>
  );
};

export default AIConfigPage;
