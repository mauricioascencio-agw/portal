import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import api from '../services/api';

interface FileUploadStatus {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  message?: string;
  uuid?: string;
}

const CFDIUpload: React.FC<{ onUploadComplete?: () => void }> = ({ onUploadComplete }) => {
  const [files, setFiles] = useState<FileUploadStatus[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Estados para modales
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionMessage, setCompletionMessage] = useState({ success: 0, errors: 0, location: '' });

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => {
        const name = file.name.toLowerCase();
        return name.endsWith('.xml') || name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.7z');
      }
    );

    if (droppedFiles.length > 0) {
      const newFiles: FileUploadStatus[] = droppedFiles.map((file) => ({
        file,
        status: 'pending',
        progress: 0,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const newFiles: FileUploadStatus[] = Array.from(selectedFiles)
        .filter((file) => {
          const name = file.name.toLowerCase();
          return name.endsWith('.xml') || name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.7z');
        })
        .map((file) => ({
          file,
          status: 'pending',
          progress: 0,
        }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setShowProcessingModal(true); // Mostrar modal de procesamiento

    // Upload all files in a single request
    const formData = new FormData();
    files.forEach((fileStatus) => {
      formData.append('files', fileStatus.file);
    });

    try {
      // Update all files to uploading status
      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'uploading' as const, progress: 50, message: 'Subiendo y procesando archivo...' }))
      );

      const response = await api.post('/api/cfdis/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { results, errors_detail, success, errors, total_files } = response.data;

      // Update files based on results
      setFiles((prev) =>
        prev.map((fileStatus) => {
          // Find result for this file
          const successResult = results?.find(
            (r: any) => r.filename === fileStatus.file.name || r.filename.includes(fileStatus.file.name)
          );
          const errorResult = errors_detail?.find(
            (e: any) => e.filename === fileStatus.file.name || e.filename.includes(fileStatus.file.name)
          );

          if (successResult) {
            return {
              ...fileStatus,
              status: 'success' as const,
              progress: 100,
              message: `✓ Subido a: ${successResult.path || 'Insumos XML/año/mes/día'}`,
              uuid: successResult.uuid,
            };
          } else if (errorResult) {
            return {
              ...fileStatus,
              status: 'error' as const,
              progress: 100,
              message: errorResult.error,
            };
          } else {
            return {
              ...fileStatus,
              status: 'error' as const,
              progress: 100,
              message: 'Error desconocido',
            };
          }
        })
      );

      // Cerrar modal de procesamiento y mostrar modal de completado
      setShowProcessingModal(false);

      // Preparar mensaje de completado
      const firstPath = results && results.length > 0 ? results[0].path : 'Insumos XML/año/mes/día';
      setCompletionMessage({
        success,
        errors,
        location: firstPath || 'C:/Git/Coliman/Insumos XML/año/mes/día'
      });

      // Mostrar modal de completado
      setShowCompletionModal(true);
    } catch (error: any) {
      console.error('Error uploading files:', error);
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: 'error' as const,
          progress: 100,
          message: error.response?.data?.detail || 'Error al subir archivo',
        }))
      );

      // Cerrar modal de procesamiento y mostrar error
      setShowProcessingModal(false);
      setCompletionMessage({
        success: 0,
        errors: files.length,
        location: ''
      });
      setShowCompletionModal(true);
    } finally {
      setIsUploading(false);
    }
  };

  // Handler para cerrar modal de completado
  const handleCloseCompletionModal = () => {
    setShowCompletionModal(false);

    // Llamar a onUploadComplete para refrescar y cambiar de pestaña
    if (completionMessage.success > 0 && onUploadComplete) {
      onUploadComplete();
    }
  };

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status === 'pending' || f.status === 'uploading'));
  };

  const importFromFolder = async () => {
    setIsImporting(true);
    setImportMessage(null);

    try {
      const response = await api.post('/api/cfdis/import-folder');
      const { success, errors, total_files, results, errors_detail } = response.data;

      if (success > 0) {
        setImportMessage({
          type: 'success',
          text: `Se importaron ${success} de ${total_files} archivos exitosamente.${errors > 0 ? ` ${errors} archivos con errores.` : ''}`,
        });
        if (onUploadComplete) {
          onUploadComplete();
        }
      } else if (total_files === 0) {
        setImportMessage({
          type: 'info',
          text: 'No se encontraron archivos XML en la carpeta C:/Git/Coliman/Insumos XML',
        });
      } else {
        setImportMessage({
          type: 'error',
          text: `Error al importar archivos. ${errors} de ${total_files} archivos con errores.`,
        });
      }

      // Show detailed errors if any
      if (errors_detail && errors_detail.length > 0) {
        console.error('Import errors:', errors_detail);
      }
    } catch (error: any) {
      console.error('Error importing from folder:', error);
      setImportMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Error al importar archivos desde la carpeta',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const successCount = files.filter((f) => f.status === 'success').length;
  const errorCount = files.filter((f) => f.status === 'error').length;
  const pendingCount = files.filter((f) => f.status === 'pending').length;

  return (
    <Box>
      {/* Import from Folder Button */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.50' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Importar desde Carpeta Local
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Importa automáticamente todos los archivos XML desde: C:\Git\Coliman\Insumos XML
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={importFromFolder}
              disabled={isImporting}
              sx={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                },
              }}
            >
              {isImporting ? 'Importando...' : 'Importar Archivos XML'}
            </Button>
          </Grid>
        </Grid>
        {importMessage && (
          <Alert severity={importMessage.type} sx={{ mt: 2 }}>
            {importMessage.text}
          </Alert>
        )}
      </Paper>

      {/* Upload Zone */}
      <Paper
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          p: 4,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'grey.300',
          bgcolor: isDragging ? 'action.hover' : 'background.paper',
          transition: 'all 0.3s',
          cursor: 'pointer',
          mb: 3,
          position: 'relative',
        }}
      >
        <Box sx={{ pointerEvents: isDragging ? 'none' : 'auto' }}>
          <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Arrastra archivos aquí
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Soporta archivos XML, ZIP, RAR y 7Z (se descomprimirán automáticamente y se guardarán XML + PDF juntos)
          </Typography>
          <input
            type="file"
            accept=".xml,.zip,.rar,.7z"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<CloudUploadIcon />}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              Seleccionar Archivos XML, ZIP, RAR o 7Z
            </Button>
          </label>
        </Box>
      </Paper>

      {/* Summary */}
      {files.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`Total: ${files.length}`}
            color="default"
            variant="outlined"
          />
          {pendingCount > 0 && (
            <Chip
              label={`Pendientes: ${pendingCount}`}
              color="warning"
              variant="outlined"
            />
          )}
          {successCount > 0 && (
            <Chip
              label={`Exitosos: ${successCount}`}
              color="success"
              variant="outlined"
            />
          )}
          {errorCount > 0 && (
            <Chip
              label={`Errores: ${errorCount}`}
              color="error"
              variant="outlined"
            />
          )}
        </Box>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Archivos ({files.length})</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  onClick={clearCompleted}
                  disabled={successCount === 0 && errorCount === 0}
                >
                  Limpiar Completados
                </Button>
                <Button
                  variant="contained"
                  onClick={uploadFiles}
                  disabled={isUploading || pendingCount === 0}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  {isUploading ? 'Subiendo...' : `Subir ${pendingCount} Archivo(s)`}
                </Button>
              </Box>
            </Box>
          </Box>

          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {files.map((fileStatus, index) => (
              <ListItem
                key={index}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 0 },
                }}
              >
                <ListItemIcon>
                  {fileStatus.status === 'success' ? (
                    <CheckCircleIcon color="success" />
                  ) : fileStatus.status === 'error' ? (
                    <ErrorIcon color="error" />
                  ) : (
                    <DescriptionIcon color="action" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={fileStatus.file.name}
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        {(fileStatus.file.size / 1024).toFixed(2)} KB
                      </Typography>
                      {fileStatus.message && (
                        <Typography
                          variant="caption"
                          display="block"
                          color={fileStatus.status === 'error' ? 'error' : 'success.main'}
                        >
                          {fileStatus.message}
                        </Typography>
                      )}
                      {fileStatus.status === 'uploading' && (
                        <LinearProgress
                          variant="indeterminate"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Box>
                  }
                />
                {fileStatus.status === 'pending' && (
                  <IconButton
                    edge="end"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Instructions */}
      {files.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Instrucciones:</strong>
          </Typography>
          <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>Selecciona archivos XML, ZIP, RAR o 7Z con CFDIs</li>
            <li>Los archivos comprimidos se descomprimirán automáticamente</li>
            <li>Se extraerán todos los XMLs y PDFs asociados</li>
            <li>Cada XML se guardará junto con su PDF (si existe) en la misma carpeta</li>
            <li>Se verificará que no existan duplicados (por UUID)</li>
            <li>Los archivos se guardarán en: Insumos XML/Año/Mes/Día</li>
            <li>El estatus inicial será "pendiente" hasta validar con el SAT</li>
          </Typography>
        </Alert>
      )}

      {/* Modal de Procesamiento */}
      <Dialog
        open={showProcessingModal}
        disableEscapeKeyDown
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress size={80} sx={{ mb: 3, color: '#667eea' }} />
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              Procesando archivos...
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Por favor espere mientras se suben y procesan los archivos.
              <br />
              No cierre esta ventana.
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Modal de Completado */}
      <Dialog
        open={showCompletionModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          background: completionMessage.success > 0
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          fontWeight: 600
        }}>
          {completionMessage.success > 0 ? '✅ Proceso Completado' : '❌ Error en el Proceso'}
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Box sx={{ mb: 2 }}>
            {completionMessage.success > 0 && (
              <>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>{completionMessage.success}</strong> archivo(s) procesado(s) exitosamente
                </Typography>
                {completionMessage.errors > 0 && (
                  <Typography variant="body1" color="error" sx={{ mb: 1 }}>
                    <strong>{completionMessage.errors}</strong> archivo(s) con errores
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  <strong>Ubicación:</strong>
                </Typography>
                <Typography variant="body2" sx={{
                  p: 1.5,
                  bgcolor: '#f3f4f6',
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.85rem'
                }}>
                  C:/Git/Coliman/{completionMessage.location}
                </Typography>
              </>
            )}
            {completionMessage.success === 0 && (
              <Typography variant="body1" color="error">
                <strong>{completionMessage.errors}</strong> archivo(s) con errores.
                <br />
                Revisa los detalles en la lista de archivos.
              </Typography>
            )}
          </Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            {completionMessage.success > 0
              ? 'Se mostrará el listado actualizado de CFDIs'
              : 'Verifica los errores e intenta nuevamente'}
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={handleCloseCompletionModal}
            variant="contained"
            fullWidth
            sx={{
              py: 1.5,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              fontWeight: 600
            }}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CFDIUpload;
