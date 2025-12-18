import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Chip,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as SmartToyIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import AdminLayout from '../../layouts/AdminLayout';
import { useAppConfig } from '../../contexts/AppConfigContext';
import api from '../../services/api';

// Avatares de superhéroes disponibles
const AVATARES_SUPERHEROES = [
  { id: 'iron_man', nombre: 'Iron Man', emoji: '🦾', color: '#c41e3a' },
  { id: 'batman', nombre: 'Batman', emoji: '🦇', color: '#000000' },
  { id: 'superman', nombre: 'Superman', emoji: '🦸', color: '#0476f2' },
  { id: 'spider_man', nombre: 'Spider-Man', emoji: '🕷️', color: '#e62429' },
  { id: 'captain_america', nombre: 'Captain America', emoji: '🛡️', color: '#3a5795' },
  { id: 'hulk', nombre: 'Hulk', emoji: '💚', color: '#6daa2c' },
  { id: 'thor', nombre: 'Thor', emoji: '⚡', color: '#d9232b' },
  { id: 'wonder_woman', nombre: 'Wonder Woman', emoji: '⭐', color: '#d52b1e' },
  { id: 'flash', nombre: 'Flash', emoji: '⚡', color: '#dc1e28' },
  { id: 'black_panther', nombre: 'Black Panther', emoji: '🐆', color: '#321f57' },
];

interface Mensaje {
  id: string;
  texto: string;
  remitente: 'user' | 'agent';
  timestamp: Date;
}

const MCPAgentPage: React.FC = () => {
  const { companyName } = useAppConfig();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [mensajeActual, setMensajeActual] = useState('');
  const [avatarSeleccionado, setAvatarSeleccionado] = useState(AVATARES_SUPERHEROES[0]);
  const [cargando, setCargando] = useState(false);
  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Inicializar mensaje de bienvenida cuando companyName esté disponible
    if (!initialized && companyName) {
      setMensajes([
        {
          id: '1',
          texto: `¡Hola! Soy Cool Iman, tu asistente inteligente de ${companyName}. Puedo ayudarte con consultas sobre tus CFDIs, análisis de datos y mucho más. ¿En qué puedo ayudarte hoy?`,
          remitente: 'agent',
          timestamp: new Date(),
        },
      ]);
      setInitialized(true);
    }
  }, [companyName, initialized]);

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const handleEnviarMensaje = async () => {
    if (!mensajeActual.trim()) return;

    const nuevoMensajeUser: Mensaje = {
      id: Date.now().toString(),
      texto: mensajeActual,
      remitente: 'user',
      timestamp: new Date(),
    };

    setMensajes([...mensajes, nuevoMensajeUser]);
    const mensajeEnviado = mensajeActual;
    setMensajeActual('');
    setCargando(true);

    try {
      // Llamar al endpoint del MCP Agent
      const response = await api.post('/api/mcp/chat', {
        mensaje: mensajeEnviado,
      });

      const respuesta: Mensaje = {
        id: (Date.now() + 1).toString(),
        texto: response.data.respuesta,
        remitente: 'agent',
        timestamp: new Date(),
      };
      setMensajes((prev) => [...prev, respuesta]);
    } catch (error: any) {
      console.error('Error al enviar mensaje:', error);
      const errorMessage: Mensaje = {
        id: (Date.now() + 1).toString(),
        texto: error.response?.data?.detail || 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        remitente: 'agent',
        timestamp: new Date(),
      };
      setMensajes((prev) => [...prev, errorMessage]);
    } finally {
      setCargando(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviarMensaje();
    }
  };

  const handleLimpiarChat = () => {
    setMensajes([
      {
        id: '1',
        texto: 'Chat reiniciado. ¿En qué puedo ayudarte?',
        remitente: 'agent',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <AdminLayout>
      <Box>
        <Box sx={{ mb: 3 }}>
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
            MCP Agent - Cool Iman
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Tu asistente inteligente con IA para consultas y análisis
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Panel izquierdo - Configuración */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, height: '70vh', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SettingsIcon sx={{ mr: 1, color: '#667eea' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Configuración
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Avatar del agente */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    mx: 'auto',
                    mb: 2,
                    fontSize: '3rem',
                    bgcolor: avatarSeleccionado.color,
                  }}
                >
                  {avatarSeleccionado.emoji}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Cool Iman
                </Typography>
                <Chip
                  label={avatarSeleccionado.nombre}
                  size="small"
                  sx={{ mt: 1, bgcolor: avatarSeleccionado.color, color: 'white' }}
                />
              </Box>

              {/* Selector de avatar */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Elegir Superhéroe</InputLabel>
                <Select
                  value={avatarSeleccionado.id}
                  label="Elegir Superhéroe"
                  onChange={(e) => {
                    const avatar = AVATARES_SUPERHEROES.find((a) => a.id === e.target.value);
                    if (avatar) setAvatarSeleccionado(avatar);
                  }}
                >
                  {AVATARES_SUPERHEROES.map((avatar) => (
                    <MenuItem key={avatar.id} value={avatar.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ fontSize: '1.5rem' }}>{avatar.emoji}</span>
                        {avatar.nombre}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Indicaciones */}
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Indicaciones Rápidas:
              </Typography>
              <List dense>
                {[
                  'Pregunta por totales facturados',
                  'Consulta top clientes',
                  'Analiza tendencias',
                  'Resume el mes actual',
                ].map((indicacion, index) => (
                  <ListItem
                    key={index}
                    button
                    onClick={() => setMensajeActual(indicacion)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.08)' },
                    }}
                  >
                    <ListItemText primary={indicacion} primaryTypographyProps={{ variant: 'body2' }} />
                  </ListItem>
                ))}
              </List>

              <Box sx={{ mt: 'auto' }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={handleLimpiarChat}
                  color="error"
                >
                  Limpiar Chat
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Panel derecho - Chat */}
          <Grid item xs={12} md={9}>
            <Paper sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
              {/* Área de mensajes */}
              <Box
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: 3,
                  bgcolor: '#f8fafc',
                }}
              >
                <List>
                  {mensajes.map((mensaje) => (
                    <ListItem
                      key={mensaje.id}
                      sx={{
                        flexDirection: mensaje.remitente === 'user' ? 'row-reverse' : 'row',
                        alignItems: 'flex-start',
                        mb: 2,
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: mensaje.remitente === 'user' ? 0 : 56 }}>
                        <Avatar
                          sx={{
                            bgcolor: mensaje.remitente === 'user' ? '#667eea' : avatarSeleccionado.color,
                            ml: mensaje.remitente === 'user' ? 1 : 0,
                            mr: mensaje.remitente === 'user' ? 0 : 1,
                          }}
                        >
                          {mensaje.remitente === 'user' ? <PersonIcon /> : avatarSeleccionado.emoji}
                        </Avatar>
                      </ListItemAvatar>

                      <Paper
                        sx={{
                          p: 2,
                          maxWidth: '70%',
                          bgcolor: mensaje.remitente === 'user' ? '#667eea' : '#fff',
                          color: mensaje.remitente === 'user' ? '#fff' : 'inherit',
                        }}
                      >
                        <Typography variant="body1">{mensaje.texto}</Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 0.5,
                            opacity: 0.7,
                          }}
                        >
                          {mensaje.timestamp.toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                      </Paper>
                    </ListItem>
                  ))}

                  {cargando && (
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: avatarSeleccionado.color }}>
                          {avatarSeleccionado.emoji}
                        </Avatar>
                      </ListItemAvatar>
                      <Typography variant="body2" color="text.secondary">
                        Cool Iman está escribiendo...
                      </Typography>
                    </ListItem>
                  )}

                  <div ref={mensajesEndRef} />
                </List>
              </Box>

              {/* Área de entrada */}
              <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', bgcolor: '#fff' }}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="caption">
                    <strong>Cool Iman está activo.</strong> Puedes preguntarme sobre totales facturados, top clientes,
                    proveedores, tendencias y facturas pendientes.
                  </Typography>
                </Alert>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={3}
                    placeholder="Escribe tu mensaje..."
                    value={mensajeActual}
                    onChange={(e) => setMensajeActual(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={cargando}
                  />
                  <Button
                    variant="contained"
                    endIcon={<SendIcon />}
                    onClick={handleEnviarMensaje}
                    disabled={cargando || !mensajeActual.trim()}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      minWidth: '100px',
                    }}
                  >
                    Enviar
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </AdminLayout>
  );
};

export default MCPAgentPage;
