# 📋 Implementación de Constancia Fiscal - Plan Completo

**Fecha:** 2025-12-15
**Estado:** EN PROGRESO

---

## ✅ COMPLETADO

### 1. Modelos de Base de Datos ✅
**Archivo:** `backend/app/models/constancia_fiscal.py`

**Tablas creadas:**
- `constancias_fiscales` - Datos principales del contribuyente
- `actividades_economicas` - Actividades económicas
- `obligaciones_fiscales` - Obligaciones fiscales

**Campos importantes:**
- RFC, Razón Social, Nombre Comercial
- Régimen Capital
- Domicilio completo (código postal, vialidad, colonia, municipio, entidad)
- Fechas (inicio operaciones, emisión)
- Código QR (almacenamiento)
- Actividades con porcentajes
- Obligaciones fiscales

### 2. API Backend ✅
**Archivo:** `backend/app/api/constancia_fiscal.py`

**Endpoints:**
- `POST /api/constancia-fiscal/upload` - Subir PDF y extraer datos
- `GET /api/constancia-fiscal/` - Obtener constancia guardada

**Funcionalidades:**
- Extracción de texto del PDF con PyPDF2
- Parseo inteligente de datos con regex
- Conversión de fechas en español a ISO
- Extracción de actividades económicas
- Extracción de regímenes fiscales
- Extracción de obligaciones
- Almacenamiento en base de datos
- Actualización si ya existe (basado en RFC)

### 3. Dependencia PyPDF2 ✅
**Archivo:** `backend/requirements.txt`
- Agregado: `PyPDF2==3.0.1`

---

## ⏳ PENDIENTE

### 4. Registrar Router en Main.py
**Archivo a modificar:** `backend/app/main.py`

```python
from app.api import auth, cfdis, sat_descarga_masiva, config, kpis, users, constancia_fiscal

app.include_router(constancia_fiscal.router)
```

### 5. Crear Tablas en Base de Datos
**Ejecutar:**
```bash
docker exec coliman_backend alembic revision --autogenerate -m "Add constancia fiscal tables"
docker exec coliman_backend alembic upgrade head
```

O reiniciar backend para que se creen automáticamente si tienes `Base.metadata.create_all()`

### 6. Frontend - Página de Constancia Fiscal
**Archivo a crear:** `frontend/src/pages/configuracion/ConstanciaFiscalPage.tsx`

**Funcionalidades requeridas:**
- ✅ Botón "Adjuntar PDF de Constancia Fiscal"
- ✅ Subir archivo PDF al backend (`POST /api/constancia-fiscal/upload`)
- ✅ Mostrar datos extraídos en tarjetas/secciones:
  - Datos del Contribuyente (RFC, Razón Social, Régimen)
  - Domicilio Fiscal (completo)
  - Actividades Económicas (tabla con orden, actividad, porcentaje)
  - Régimen Fiscal
  - Obligaciones Fiscales
- ✅ Botón "Confirmar Importación"
- ✅ Mensaje de éxito: "✅ Constancia Fiscal importada correctamente"
- ✅ Mostrar código QR si se extrajo

**Diseño sugerido:**
```tsx
import React, { useState } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableHead, TableRow,
  Alert, CircularProgress
} from '@mui/material';
import { Upload as UploadIcon, CheckCircle as CheckIcon } from '@mui/icons-material';

const ConstanciaFiscalPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/constancia-fiscal/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setData(response.data.data);
      setSuccess(true);
      alert('✅ ' + response.data.message);
    } catch (error) {
      alert('Error: ' + error.response?.data?.detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Typography variant="h4">Constancia de Situación Fiscal</Typography>

      {/* Botón para adjuntar PDF */}
      <Button variant="contained" component="label">
        <UploadIcon /> Adjuntar Constancia Fiscal (PDF)
        <input type="file" hidden accept=".pdf" onChange={handleFileSelect} />
      </Button>

      {file && (
        <Button onClick={handleUpload} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Confirmar Importación'}
        </Button>
      )}

      {success && <Alert severity="success">✅ Constancia importada correctamente</Alert>}

      {/* Mostrar datos extraídos */}
      {data && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Datos del Contribuyente</Typography>
                <Typography>RFC: {data.rfc}</Typography>
                <Typography>Razón Social: {data.razon_social}</Typography>
                {/* ... más campos */}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Domicilio Fiscal</Typography>
                <Typography>{data.domicilio}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6">Actividades Económicas</Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Orden</TableCell>
                      <TableCell>Actividad</TableCell>
                      <TableCell>Porcentaje</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Renderizar actividades */}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};
```

### 7. Actualizar Ruta en App.tsx
**Archivo a modificar:** `frontend/src/App.tsx`

```tsx
import ConstanciaFiscalPage from './pages/configuracion/ConstanciaFiscalPage';

<Route
  path="/configuracion/constancia"
  element={
    <ProtectedRoute>
      <ConstanciaFiscalPage />
    </ProtectedRoute>
  }
/>
```

### 8. Instalar PyPDF2 en el Backend
**Ejecutar:**
```bash
docker exec coliman_backend pip install PyPDF2==3.0.1
```

O reconstruir el backend:
```bash
cd C:/Git/Coliman/portal-coliman
docker-compose build backend
docker-compose up -d
```

---

## 🎯 Orden de Implementación Recomendado

1. ✅ **Registrar router** en main.py
2. ✅ **Crear tablas** en la base de datos
3. ✅ **Instalar PyPDF2** en el backend
4. ✅ **Crear página frontend** ConstanciaFiscalPage.tsx
5. ✅ **Actualizar ruta** en App.tsx
6. ✅ **Probar** subiendo el PDF de ejemplo

---

## 📝 Notas Técnicas

### Extracción de Código QR
El código QR está embebido en el PDF como imagen. Para extraerlo necesitarías:
```python
from PIL import Image
import pyzbar.pyzbar as pyzbar

# Extraer imagen del PDF
# Decodificar QR de la imagen
```

Por ahora, la implementación almacena la referencia pero no extrae la imagen del QR.

### Mejoras Futuras
- Extraer y decodificar código QR
- Validar constancia contra el SAT
- Descargar constancia del SAT automáticamente
- OCR para PDFs escaneados
- Notificaciones de vencimiento de constancia

---

## 🐛 Posibles Errores

### Error: "PyPDF2 not found"
**Solución:** Instalar PyPDF2 en el backend

### Error: "No se pudo extraer el RFC"
**Solución:** El PDF puede tener formato diferente. Revisar patrones regex.

### Error: "Unable to serialize"
**Solución:** Ya está resuelto con conversión manual a dict.

---

**Última actualización:** 2025-12-15 16:00
**Estado:** Falta frontend y registro de rutas
**Prioridad:** Alta
