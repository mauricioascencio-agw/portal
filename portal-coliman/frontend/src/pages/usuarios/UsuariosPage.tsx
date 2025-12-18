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
  Button,
  IconButton,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import AdminLayout from '../../layouts/AdminLayout';
import { useAppConfig } from '../../contexts/AppConfigContext';
import api from '../../services/api';
import * as XLSX from 'xlsx';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  client_id: string | null;
  client_name: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  is_active: boolean;
  created_at: string;
}

interface UserFormData {
  email: string;
  full_name: string;
  password: string;
  role: string;
  client_id: string;
  client_name: string;
  phone: string;
  company: string;
  position: string;
}

const ROLES = [
  { value: 'superadmin', label: 'Super Administrador', color: 'error' as const },
  { value: 'admin', label: 'Administrador', color: 'warning' as const },
  { value: 'contador', label: 'Contador', color: 'info' as const },
  { value: 'analista', label: 'Analista Fiscal', color: 'primary' as const },
  { value: 'consulta', label: 'Solo Consulta', color: 'default' as const },
];

const UsuariosPage: React.FC = () => {
  const { companyName } = useAppConfig();
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Diálogo
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Formulario
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    full_name: '',
    password: '',
    role: 'consulta',
    client_id: '',
    client_name: '',
    phone: '',
    company: '',
    position: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (tabValue === 1) {
      fetchUsers();
    }
    // eslint-disable-next-line
  }, [tabValue, page, rowsPerPage, search, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {
        skip: page * rowsPerPage,
        limit: rowsPerPage,
      };

      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== '') params.is_active = statusFilter === 'true';

      const response = await api.get('/api/users/', { params });
      setUsers(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      alert('Error al cargar usuarios: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

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

  const handleOpenCreateDialog = () => {
    setDialogMode('create');
    setFormData({
      email: '',
      full_name: '',
      password: '',
      role: 'consulta',
      client_id: '',
      client_name: '',
      phone: '',
      company: '',
      position: '',
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (user: User) => {
    setDialogMode('edit');
    setSelectedUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name,
      password: '',
      role: user.role,
      client_id: user.client_id || '',
      client_name: user.client_name || '',
      phone: user.phone || '',
      company: user.company || '',
      position: user.position || '',
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      errors.full_name = 'El nombre completo es requerido';
    }

    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (dialogMode === 'create' && !formData.password) {
      errors.password = 'La contraseña es requerida';
    }

    if (formData.password && formData.password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (dialogMode === 'create') {
        await api.post('/api/users/', formData);
        alert('Usuario creado exitosamente');
      } else {
        const updateData: any = {
          full_name: formData.full_name,
          phone: formData.phone,
          company: formData.company,
          position: formData.position,
        };
        await api.put(`/api/users/${selectedUser?.id}`, updateData);
        alert('Usuario actualizado exitosamente');
      }
      handleCloseDialog();
      fetchUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      alert('Error al guardar usuario: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const action = user.is_active ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Estás seguro de ${action} al usuario ${user.full_name}?`)) return;

    setLoading(true);
    try {
      if (user.is_active) {
        await api.delete(`/api/users/${user.id}`);
      } else {
        await api.post(`/api/users/${user.id}/activate`);
      }
      alert(`Usuario ${action}do exitosamente`);
      fetchUsers();
    } catch (error: any) {
      console.error(`Error al ${action} usuario:`, error);
      alert(`Error al ${action} usuario: ` + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    return ROLES.find((r) => r.value === role)?.label || role;
  };

  const getRoleColor = (role: string) => {
    return ROLES.find((r) => r.value === role)?.color || ('default' as const);
  };

  const exportToExcel = () => {
    const data = users.map((user) => ({
      ID: user.id,
      'Nombre Completo': user.full_name,
      Email: user.email,
      Rol: getRoleLabel(user.role),
      Cliente: user.client_name || '',
      'ID Cliente': user.client_id || '',
      Teléfono: user.phone || '',
      Empresa: user.company || '',
      Posición: user.position || '',
      Estado: user.is_active ? 'Activo' : 'Inactivo',
      'Fecha Creación': new Date(user.created_at).toLocaleString('es-MX'),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    XLSX.writeFile(wb, `usuarios_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
  };

  return (
    <AdminLayout>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Gestión de Usuarios
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administra los usuarios del sistema
          </Typography>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="tabs de usuarios">
            <Tab label="Información" />
            <Tab label="Listado de Usuarios" />
            <Tab label="Estadísticas" />
          </Tabs>
        </Paper>

        {/* Tab 0: Información */}
        {tabValue === 0 && (
          <Box>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Gestión de Usuarios del Sistema
              </Typography>

              <Typography variant="body1" paragraph>
                En esta sección puedes administrar todos los usuarios del sistema {companyName}.
              </Typography>

              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, bgcolor: '#f5f5f5' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Roles Disponibles
                    </Typography>
                    {ROLES.map((role) => (
                      <Box key={role.value} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={role.label} color={role.color} size="small" />
                      </Box>
                    ))}
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, bgcolor: '#f5f5f5' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Funcionalidades
                    </Typography>
                    <Typography variant="body2" paragraph>
                      • Crear nuevos usuarios
                    </Typography>
                    <Typography variant="body2" paragraph>
                      • Editar información de usuarios
                    </Typography>
                    <Typography variant="body2" paragraph>
                      • Activar/Desactivar usuarios
                    </Typography>
                    <Typography variant="body2" paragraph>
                      • Filtrar y buscar usuarios
                    </Typography>
                    <Typography variant="body2">• Exportar listado a Excel</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Nota:</strong> Solo usuarios con rol Administrador o Super Administrador pueden gestionar
                  usuarios.
                </Typography>
              </Alert>
            </Paper>
          </Box>
        )}

        {/* Tab 1: Listado */}
        {tabValue === 1 && (
          <Box>
            {/* Botón crear y exportar */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateDialog}>
                Nuevo Usuario
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={exportToExcel}
                color="success"
              >
                Exportar Excel
              </Button>
            </Box>

            {/* Filtros */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Buscar por nombre o email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Rol</InputLabel>
                    <Select value={roleFilter} label="Rol" onChange={(e) => setRoleFilter(e.target.value)}>
                      <MenuItem value="">Todos</MenuItem>
                      {ROLES.map((role) => (
                        <MenuItem key={role.value} value={role.value}>
                          {role.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Estado</InputLabel>
                    <Select value={statusFilter} label="Estado" onChange={(e) => setStatusFilter(e.target.value)}>
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="true">Activos</MenuItem>
                      <MenuItem value="false">Inactivos</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button fullWidth variant="outlined" startIcon={<RefreshIcon />} onClick={fetchUsers}>
                    Actualizar
                  </Button>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button fullWidth variant="outlined" onClick={clearFilters}>
                    Limpiar Filtros
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Tabla */}
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Rol</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No hay usuarios
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {user.full_name}
                          </Typography>
                          {user.position && (
                            <Typography variant="caption" color="text.secondary">
                              {user.position}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip label={getRoleLabel(user.role)} color={getRoleColor(user.role)} size="small" />
                        </TableCell>
                        <TableCell>
                          {user.client_name && (
                            <>
                              <Typography variant="body2">{user.client_name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {user.client_id}
                              </Typography>
                            </>
                          )}
                        </TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.is_active ? 'Activo' : 'Inactivo'}
                            color={user.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Editar">
                            <IconButton size="small" color="primary" onClick={() => handleOpenEditDialog(user)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={user.is_active ? 'Desactivar' : 'Activar'}>
                            <IconButton
                              size="small"
                              color={user.is_active ? 'error' : 'success'}
                              onClick={() => handleToggleStatus(user)}
                            >
                              {user.is_active ? <CancelIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 25, 50, 100]}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </TableContainer>
          </Box>
        )}

        {/* Tab 2: Estadísticas */}
        {tabValue === 2 && (
          <Box>
            <Paper sx={{ p: 6, textAlign: 'center', minHeight: 400 }}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Estadísticas de Usuarios
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Próximamente: Gráficas y análisis detallado de usuarios del sistema.
              </Typography>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>En desarrollo:</strong> Estadísticas de usuarios activos, roles, actividad reciente, etc.
                </Typography>
              </Alert>
            </Paper>
          </Box>
        )}

        {/* Diálogo Crear/Editar Usuario */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>{dialogMode === 'create' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nombre Completo *"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    error={!!formErrors.full_name}
                    helperText={formErrors.full_name}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email *"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                    disabled={dialogMode === 'edit'}
                  />
                </Grid>
                {dialogMode === 'create' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Contraseña *"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      error={!!formErrors.password}
                      helperText={formErrors.password || 'Mínimo 8 caracteres, con mayúsculas, minúsculas y números'}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                )}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Rol</InputLabel>
                    <Select
                      value={formData.role}
                      label="Rol"
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      disabled={dialogMode === 'edit'}
                    >
                      {ROLES.map((role) => (
                        <MenuItem key={role.value} value={role.value}>
                          {role.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="ID Cliente"
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    disabled={dialogMode === 'edit'}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nombre Cliente"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    disabled={dialogMode === 'edit'}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Empresa"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Posición"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={loading}>
              {dialogMode === 'create' ? 'Crear' : 'Actualizar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default UsuariosPage;
