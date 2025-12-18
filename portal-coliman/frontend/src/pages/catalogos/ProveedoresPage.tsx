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
  Tooltip,
  InputAdornment,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Store as StoreIcon,
  FileDownload as FileDownloadIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';
import * as XLSX from 'xlsx';

interface Supplier {
  id: number;
  client_id: string;
  rfc: string;
  razon_social: string;
  regimen_fiscal: string;
  codigo_postal: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  contact_name: string;
  contact_position: string;
  contact_phone: string;
  contact_email: string;
  banco: string;
  cuenta_bancaria: string;
  clabe: string;
  is_active: boolean;
  notas: string;
  created_at: string;
  updated_at: string;
}

interface SupplierFormData {
  rfc: string;
  razon_social: string;
  regimen_fiscal: string;
  codigo_postal: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  contact_name: string;
  contact_position: string;
  contact_phone: string;
  contact_email: string;
  banco: string;
  cuenta_bancaria: string;
  clabe: string;
  is_active: boolean;
  notas: string;
}

const ProveedoresPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const [formData, setFormData] = useState<SupplierFormData>({
    rfc: '',
    razon_social: '',
    regimen_fiscal: '',
    codigo_postal: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'Mexico',
    contact_name: '',
    contact_position: '',
    contact_phone: '',
    contact_email: '',
    banco: '',
    cuenta_bancaria: '',
    clabe: '',
    is_active: true,
    notas: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSuppliers();
  }, [page, rowsPerPage, search, statusFilter]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const params: any = {
        skip: page * rowsPerPage,
        limit: rowsPerPage,
      };

      if (search) params.search = search;
      if (statusFilter !== '') params.is_active = statusFilter === 'true';

      const response = await api.get('/api/catalogs/suppliers', { params });
      setSuppliers(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error: any) {
      console.error('Error fetching suppliers:', error);
      alert('Error al cargar proveedores: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      rfc: '',
      razon_social: '',
      regimen_fiscal: '',
      codigo_postal: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: 'Mexico',
      contact_name: '',
      contact_position: '',
      contact_phone: '',
      contact_email: '',
      banco: '',
      cuenta_bancaria: '',
      clabe: '',
      is_active: true,
      notas: '',
    });
    setFormErrors({});
    setTabValue(0);
  };

  const handleOpenCreateDialog = () => {
    setDialogMode('create');
    resetForm();
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (supplier: Supplier) => {
    setDialogMode('edit');
    setSelectedSupplier(supplier);
    setFormData({
      rfc: supplier.rfc || '',
      razon_social: supplier.razon_social || '',
      regimen_fiscal: supplier.regimen_fiscal || '',
      codigo_postal: supplier.codigo_postal || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      state: supplier.state || '',
      country: supplier.country || 'Mexico',
      contact_name: supplier.contact_name || '',
      contact_position: supplier.contact_position || '',
      contact_phone: supplier.contact_phone || '',
      contact_email: supplier.contact_email || '',
      banco: supplier.banco || '',
      cuenta_bancaria: supplier.cuenta_bancaria || '',
      clabe: supplier.clabe || '',
      is_active: supplier.is_active,
      notas: supplier.notas || '',
    });
    setFormErrors({});
    setTabValue(0);
    setOpenDialog(true);
  };

  const handleOpenViewDialog = (supplier: Supplier) => {
    setDialogMode('view');
    setSelectedSupplier(supplier);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSupplier(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.rfc.trim()) errors.rfc = 'El RFC es requerido';
    if (!formData.razon_social.trim()) errors.razon_social = 'La razón social es requerida';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (dialogMode === 'create') {
        await api.post('/api/catalogs/suppliers', formData);
        alert('Proveedor creado exitosamente');
      } else {
        await api.put(`/api/catalogs/suppliers/${selectedSupplier?.id}`, formData);
        alert('Proveedor actualizado exitosamente');
      }
      handleCloseDialog();
      fetchSuppliers();
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      alert('Error al guardar proveedor: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (supplier: Supplier) => {
    const action = supplier.is_active ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Estás seguro de ${action} al proveedor ${supplier.razon_social}?`)) return;

    setLoading(true);
    try {
      if (supplier.is_active) {
        await api.delete(`/api/catalogs/suppliers/${supplier.id}`);
      } else {
        await api.post(`/api/catalogs/suppliers/${supplier.id}/activate`);
      }
      alert(`Proveedor ${action}do exitosamente`);
      fetchSuppliers();
    } catch (error: any) {
      console.error(`Error al ${action} proveedor:`, error);
      alert(`Error al ${action} proveedor: ` + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const data = suppliers.map((s) => ({
      RFC: s.rfc,
      'Razón Social': s.razon_social,
      'Régimen Fiscal': s.regimen_fiscal,
      'C.P.': s.codigo_postal,
      Email: s.email,
      Teléfono: s.phone,
      Dirección: s.address,
      Ciudad: s.city,
      Estado: s.state,
      País: s.country,
      Contacto: s.contact_name,
      'Teléfono Contacto': s.contact_phone,
      Banco: s.banco,
      'Cuenta Bancaria': s.cuenta_bancaria,
      CLABE: s.clabe,
      Estatus: s.is_active ? 'Activo' : 'Inactivo',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Proveedores');
    XLSX.writeFile(wb, `proveedores_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const clearFilters = () => {
    setSearch('');
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
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              Catálogo de Proveedores
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gestiona los proveedores del sistema
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateDialog}
              sx={{ bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' } }}>
              Nuevo Proveedor
            </Button>
            <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportToExcel}
              sx={{ borderColor: '#f97316', color: '#f97316' }}>
              Exportar
            </Button>
          </Box>
        </Box>

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por RFC, razón social, email o contacto"
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
                <InputLabel>Estado</InputLabel>
                <Select value={statusFilter} label="Estado" onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="true">Activos</MenuItem>
                  <MenuItem value="false">Inactivos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth variant="outlined" startIcon={<RefreshIcon />} onClick={fetchSuppliers}>
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
              <TableRow sx={{ bgcolor: 'rgba(249, 115, 22, 0.1)' }}>
                <TableCell>RFC</TableCell>
                <TableCell>Razón Social</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Ciudad</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress sx={{ color: '#f97316' }} />
                  </TableCell>
                </TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <StoreIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body1" color="text.secondary">
                      No hay proveedores registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#f97316' }}>
                        {supplier.rfc}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {supplier.razon_social}
                      </Typography>
                      {supplier.regimen_fiscal && (
                        <Typography variant="caption" color="text.secondary">
                          {supplier.regimen_fiscal}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{supplier.email || '-'}</TableCell>
                    <TableCell>{supplier.phone || '-'}</TableCell>
                    <TableCell>
                      {supplier.city && supplier.state ? `${supplier.city}, ${supplier.state}` : supplier.city || supplier.state || '-'}
                    </TableCell>
                    <TableCell>
                      {supplier.contact_name && (
                        <>
                          <Typography variant="body2">{supplier.contact_name}</Typography>
                          {supplier.contact_phone && (
                            <Typography variant="caption" color="text.secondary">
                              {supplier.contact_phone}
                            </Typography>
                          )}
                        </>
                      )}
                      {!supplier.contact_name && '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={supplier.is_active ? 'Activo' : 'Inactivo'}
                        color={supplier.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver detalle">
                        <IconButton size="small" onClick={() => handleOpenViewDialog(supplier)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small" color="primary" onClick={() => handleOpenEditDialog(supplier)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={supplier.is_active ? 'Desactivar' : 'Activar'}>
                        <IconButton
                          size="small"
                          color={supplier.is_active ? 'error' : 'success'}
                          onClick={() => handleToggleStatus(supplier)}
                        >
                          {supplier.is_active ? <CancelIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
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

        {/* Diálogo Ver Detalle */}
        {dialogMode === 'view' && selectedSupplier && (
          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
            <DialogTitle>
              Detalle del Proveedor
              <Typography variant="body2" color="text.secondary">
                {selectedSupplier.rfc}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ color: '#f97316' }}>{selectedSupplier.razon_social}</Typography>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Régimen Fiscal</Typography><Typography>{selectedSupplier.regimen_fiscal || '-'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">C.P.</Typography><Typography>{selectedSupplier.codigo_postal || '-'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Email</Typography><Typography>{selectedSupplier.email || '-'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Teléfono</Typography><Typography>{selectedSupplier.phone || '-'}</Typography></Grid>
                <Grid item xs={12}><Typography variant="caption" color="text.secondary">Dirección</Typography><Typography>{selectedSupplier.address || '-'}</Typography></Grid>
                <Grid item xs={4}><Typography variant="caption" color="text.secondary">Ciudad</Typography><Typography>{selectedSupplier.city || '-'}</Typography></Grid>
                <Grid item xs={4}><Typography variant="caption" color="text.secondary">Estado</Typography><Typography>{selectedSupplier.state || '-'}</Typography></Grid>
                <Grid item xs={4}><Typography variant="caption" color="text.secondary">País</Typography><Typography>{selectedSupplier.country || '-'}</Typography></Grid>
                <Grid item xs={12}><Divider sx={{ my: 1 }} /><Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Información de Contacto</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Nombre</Typography><Typography>{selectedSupplier.contact_name || '-'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Puesto</Typography><Typography>{selectedSupplier.contact_position || '-'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Teléfono</Typography><Typography>{selectedSupplier.contact_phone || '-'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Email</Typography><Typography>{selectedSupplier.contact_email || '-'}</Typography></Grid>
                <Grid item xs={12}><Divider sx={{ my: 1 }} /><Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Información Bancaria</Typography></Grid>
                <Grid item xs={4}><Typography variant="caption" color="text.secondary">Banco</Typography><Typography>{selectedSupplier.banco || '-'}</Typography></Grid>
                <Grid item xs={4}><Typography variant="caption" color="text.secondary">Cuenta</Typography><Typography>{selectedSupplier.cuenta_bancaria || '-'}</Typography></Grid>
                <Grid item xs={4}><Typography variant="caption" color="text.secondary">CLABE</Typography><Typography>{selectedSupplier.clabe || '-'}</Typography></Grid>
                {selectedSupplier.notas && (
                  <Grid item xs={12}><Divider sx={{ my: 1 }} /><Typography variant="caption" color="text.secondary">Notas</Typography><Typography>{selectedSupplier.notas}</Typography></Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cerrar</Button>
              <Button variant="contained" onClick={() => { handleCloseDialog(); handleOpenEditDialog(selectedSupplier); }}
                sx={{ bgcolor: '#f97316' }}>
                Editar
              </Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Diálogo Crear/Editar */}
        {(dialogMode === 'create' || dialogMode === 'edit') && (
          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
            <DialogTitle>{dialogMode === 'create' ? 'Nuevo Proveedor' : 'Editar Proveedor'}</DialogTitle>
            <DialogContent>
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Datos Generales" />
                <Tab label="Dirección" />
                <Tab label="Contacto" />
                <Tab label="Datos Bancarios" />
              </Tabs>

              {tabValue === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="RFC *" value={formData.rfc}
                      onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                      error={!!formErrors.rfc} helperText={formErrors.rfc} inputProps={{ maxLength: 13 }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Código Postal" value={formData.codigo_postal}
                      onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Razón Social *" value={formData.razon_social}
                      onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                      error={!!formErrors.razon_social} helperText={formErrors.razon_social} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Régimen Fiscal" value={formData.regimen_fiscal}
                      onChange={(e) => setFormData({ ...formData, regimen_fiscal: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Email" type="email" value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Teléfono" value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </Grid>
                </Grid>
              )}

              {tabValue === 1 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Dirección" value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })} multiline rows={2} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Ciudad" value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Estado" value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="País" value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
                  </Grid>
                </Grid>
              )}

              {tabValue === 2 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Nombre del Contacto" value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Puesto" value={formData.contact_position}
                      onChange={(e) => setFormData({ ...formData, contact_position: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Teléfono Contacto" value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Email Contacto" type="email" value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} />
                  </Grid>
                </Grid>
              )}

              {tabValue === 3 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Banco" value={formData.banco}
                      onChange={(e) => setFormData({ ...formData, banco: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Cuenta Bancaria" value={formData.cuenta_bancaria}
                      onChange={(e) => setFormData({ ...formData, cuenta_bancaria: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="CLABE" value={formData.clabe}
                      onChange={(e) => setFormData({ ...formData, clabe: e.target.value })} inputProps={{ maxLength: 18 }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Notas" value={formData.notas}
                      onChange={(e) => setFormData({ ...formData, notas: e.target.value })} multiline rows={3} />
                  </Grid>
                </Grid>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancelar</Button>
              <Button variant="contained" onClick={handleSubmit} disabled={loading}
                sx={{ bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' } }}>
                {dialogMode === 'create' ? 'Crear' : 'Actualizar'}
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </AdminLayout>
  );
};

export default ProveedoresPage;
