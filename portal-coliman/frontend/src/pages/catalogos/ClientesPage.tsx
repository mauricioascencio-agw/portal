import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
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
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';
import * as XLSX from 'xlsx';

interface Client {
  id: number;
  client_id: string;
  client_name: string;
  rfc: string;
  razon_social: string;
  email: string;
  plan_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ClientFormData {
  client_id: string;
  client_name: string;
  rfc: string;
  razon_social: string;
  email: string;
  plan_type: string;
  is_active: boolean;
}

const PLAN_TYPES = [
  { value: 'basico', label: 'Básico', color: 'default' as const },
  { value: 'profesional', label: 'Profesional', color: 'info' as const },
  { value: 'empresarial', label: 'Empresarial', color: 'primary' as const },
  { value: 'corporativo', label: 'Corporativo', color: 'success' as const },
];

const ClientesPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState<ClientFormData>({
    client_id: '',
    client_name: '',
    rfc: '',
    razon_social: '',
    email: '',
    plan_type: 'basico',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchClients();
  }, [page, rowsPerPage, search, planFilter, statusFilter]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params: any = {
        skip: page * rowsPerPage,
        limit: rowsPerPage,
      };

      if (search) params.search = search;
      if (planFilter) params.plan_type = planFilter;
      if (statusFilter !== '') params.is_active = statusFilter === 'true';

      const response = await api.get('/api/catalogs/clients', { params });
      setClients(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      alert('Error al cargar clientes: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setDialogMode('create');
    setFormData({
      client_id: '',
      client_name: '',
      rfc: '',
      razon_social: '',
      email: '',
      plan_type: 'basico',
      is_active: true,
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (client: Client) => {
    setDialogMode('edit');
    setSelectedClient(client);
    setFormData({
      client_id: client.client_id,
      client_name: client.client_name,
      rfc: client.rfc,
      razon_social: client.razon_social,
      email: client.email,
      plan_type: client.plan_type,
      is_active: client.is_active,
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedClient(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.client_id.trim()) errors.client_id = 'El ID de cliente es requerido';
    if (!formData.client_name.trim()) errors.client_name = 'El nombre es requerido';
    if (!formData.rfc.trim()) errors.rfc = 'El RFC es requerido';
    if (!formData.razon_social.trim()) errors.razon_social = 'La razón social es requerida';
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (dialogMode === 'create') {
        await api.post('/api/catalogs/clients', formData);
        alert('Cliente creado exitosamente');
      } else {
        await api.put(`/api/catalogs/clients/${selectedClient?.id}`, formData);
        alert('Cliente actualizado exitosamente');
      }
      handleCloseDialog();
      fetchClients();
    } catch (error: any) {
      console.error('Error saving client:', error);
      alert('Error al guardar cliente: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (client: Client) => {
    const action = client.is_active ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Estás seguro de ${action} al cliente ${client.client_name}?`)) return;

    setLoading(true);
    try {
      if (client.is_active) {
        await api.delete(`/api/catalogs/clients/${client.id}`);
      } else {
        await api.put(`/api/catalogs/clients/${client.id}`, { ...client, is_active: true });
      }
      alert(`Cliente ${action}do exitosamente`);
      fetchClients();
    } catch (error: any) {
      console.error(`Error al ${action} cliente:`, error);
      alert(`Error al ${action} cliente: ` + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const data = clients.map((client) => ({
      'ID Cliente': client.client_id,
      Nombre: client.client_name,
      RFC: client.rfc,
      'Razón Social': client.razon_social,
      Email: client.email,
      Plan: PLAN_TYPES.find(p => p.value === client.plan_type)?.label || client.plan_type,
      Estado: client.is_active ? 'Activo' : 'Inactivo',
      'Fecha Creación': new Date(client.created_at).toLocaleString('es-MX'),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, `clientes_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const clearFilters = () => {
    setSearch('');
    setPlanFilter('');
    setStatusFilter('');
  };

  return (
    <AdminLayout>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              Catálogo de Clientes
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gestiona los clientes del sistema
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateDialog}>
              Nuevo Cliente
            </Button>
            <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportToExcel} color="success">
              Exportar
            </Button>
          </Box>
        </Box>

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por nombre, RFC o email"
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
                <InputLabel>Plan</InputLabel>
                <Select value={planFilter} label="Plan" onChange={(e) => setPlanFilter(e.target.value)}>
                  <MenuItem value="">Todos</MenuItem>
                  {PLAN_TYPES.map((plan) => (
                    <MenuItem key={plan.value} value={plan.value}>
                      {plan.label}
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
              <Button fullWidth variant="outlined" startIcon={<RefreshIcon />} onClick={fetchClients}>
                Actualizar
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth variant="outlined" onClick={clearFilters}>
                Limpiar
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabla */}
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(102, 126, 234, 0.1)' }}>
                <TableCell>ID Cliente</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>RFC</TableCell>
                <TableCell>Razón Social</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <BusinessIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body1" color="text.secondary">
                      No hay clientes registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#667eea' }}>
                        {client.client_id}
                      </Typography>
                    </TableCell>
                    <TableCell>{client.client_name}</TableCell>
                    <TableCell>{client.rfc}</TableCell>
                    <TableCell>{client.razon_social}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={PLAN_TYPES.find(p => p.value === client.plan_type)?.label || client.plan_type}
                        color={PLAN_TYPES.find(p => p.value === client.plan_type)?.color || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={client.is_active ? 'Activo' : 'Inactivo'}
                        color={client.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton size="small" color="primary" onClick={() => handleOpenEditDialog(client)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={client.is_active ? 'Desactivar' : 'Activar'}>
                        <IconButton
                          size="small"
                          color={client.is_active ? 'error' : 'success'}
                          onClick={() => handleToggleStatus(client)}
                        >
                          {client.is_active ? <CancelIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
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
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </TableContainer>

        {/* Diálogo */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>{dialogMode === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="ID Cliente *"
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value.toUpperCase() })}
                    error={!!formErrors.client_id}
                    helperText={formErrors.client_id}
                    disabled={dialogMode === 'edit'}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nombre *"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    error={!!formErrors.client_name}
                    helperText={formErrors.client_name}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="RFC *"
                    value={formData.rfc}
                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                    error={!!formErrors.rfc}
                    helperText={formErrors.rfc}
                    inputProps={{ maxLength: 13 }}
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
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Razón Social *"
                    value={formData.razon_social}
                    onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                    error={!!formErrors.razon_social}
                    helperText={formErrors.razon_social}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Plan</InputLabel>
                    <Select
                      value={formData.plan_type}
                      label="Plan"
                      onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
                    >
                      {PLAN_TYPES.map((plan) => (
                        <MenuItem key={plan.value} value={plan.value}>
                          {plan.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={formData.is_active ? 'true' : 'false'}
                      label="Estado"
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                    >
                      <MenuItem value="true">Activo</MenuItem>
                      <MenuItem value="false">Inactivo</MenuItem>
                    </Select>
                  </FormControl>
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

export default ClientesPage;
